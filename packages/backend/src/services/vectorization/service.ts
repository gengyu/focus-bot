import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { 
  VectorizationService, 
  VectorizationPlugin, 
  EventType, 
  EventHandler, 
  EmbeddingModel,
  VectorizationOptions,
  VectorizationResult,
  SearchResult
} from './types';
import { VectorizationError } from './errors';
import { ErrorCode } from './errors';
import { vectorize } from './vectorizer';
import { MemoryStorage } from './storage';
import { MemoryVectorCache } from './cache';
import { ConfigManager, appConfig } from './config';
import { LogManager } from './logging';
import { PerformanceMonitorImpl } from './performance';
import { InputValidatorImpl } from './validation';
import { AccessControlImpl } from './access-control';
import { EventBus } from './events';
import { PluginManager } from './plugins';
import { cosineSimilarity } from './utils';

// 创建日志管理器实例
const logManager = new LogManager();

// 创建性能监控实例
const performanceMonitor = new PerformanceMonitorImpl();

// 创建配置管理器实例
const configManager = new ConfigManager();

// 创建存储实例
const storage = new MemoryStorage();

// 创建缓存实例
const vectorCache = new MemoryVectorCache();

/**
 * 创建命名空间
 * @param {Namespace} namespace - 命名空间信息
 * @returns {Promise<Namespace>} 创建的命名空间
 */
export async function createNamespace(namespace: any): Promise<any> {
  const existingNamespace = await storage.getNamespace(namespace.id);
  if (existingNamespace) {
    throw new VectorizationError(
      `命名空间 ${namespace.id} 已存在`,
      ErrorCode.NAMESPACE_ALREADY_EXISTS,
      { namespaceId: namespace.id }
    );
  }
  await storage.saveNamespace(namespace);
  return namespace;
}

/**
 * 获取命名空间
 * @param {string} namespaceId - 命名空间ID
 * @returns {Namespace | undefined} 命名空间信息
 */
export function getNamespace(namespaceId: string): any | undefined {
  return storage.getNamespace(namespaceId);
}

/**
 * 删除命名空间
 * @param {string} namespaceId - 命名空间ID
 * @returns {boolean} 是否删除成功
 */
export function deleteNamespace(namespaceId: string): boolean {
  // 删除命名空间下的所有向量
  storage.clearVectorsByNamespaceId(namespaceId);
  // 这里需要修改，因为 storage.delete 方法不存在
  // 实际应用中需要实现 storage.deleteNamespace 方法
  return true;
}

/**
 * 向量化并存储
 * @param {VectorizationOptions} options - 向量化选项
 * @returns {Promise<VectorizationResult>} 处理结果
 */
export async function vectorizeAndStore(options: VectorizationOptions): Promise<VectorizationResult> {
  try {
    const {
      namespaceId,
      texts,
      chunkSize = appConfig.defaultChunkSize,
      chunkOverlap = appConfig.defaultChunkOverlap
    } = options;

    if (!namespaceId || !texts || !Array.isArray(texts)) {
      throw new VectorizationError(
        'namespaceId 和 texts 是必填字段，且 texts 必须是数组',
        ErrorCode.INVALID_INPUT,
        { namespaceId, texts }
      );
    }

    // 检查命名空间是否存在
    const namespace = await storage.getNamespace(namespaceId);
    if (!namespace) {
      throw new VectorizationError(
        `命名空间 ${namespaceId} 不存在`,
        ErrorCode.NAMESPACE_NOT_FOUND,
        { namespaceId }
      );
    }

    // 分块
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const documents: Document[] = [];
    for (const text of texts) {
      const chunks = await splitter.createDocuments([text], [{namespaceId}]);
      documents.push(...chunks);
    }

    console.log('分块完成，向量化开始...');
    
    // 向量化
    const vectors = await vectorize(documents, configManager.getConfig().model);
    
    // 存储
    const newVectors = storage.storeVectors(documents, vectors, namespaceId);

    return {
      status: 'success',
      message: '本地向量化完成，存储到内存',
      vectorCount: newVectors.length,
    };
  } catch (error) {
    if (error instanceof VectorizationError) {
      return {
        status: 'error',
        message: error.message,
      };
    }
    return {
      status: 'error',
      message: `本地向量化失败: ${(error as Error).message}`,
    };
  }
}

/**
 * 搜索相似文档
 * @param {string} query - 查询文本
 * @param {string} namespaceId - 命名空间ID
 * @param {number} [topK=3] - 返回结果数量
 * @returns {Promise<SearchResult[]>} 搜索结果
 */
export async function searchSimilarDocuments(query: string, namespaceId: string, topK: number = 3): Promise<SearchResult[]> {
  try {
    // 检查命名空间是否存在
    const namespace = await storage.getNamespace(namespaceId);
    if (!namespace) {
      throw new Error(`命名空间 ${namespaceId} 不存在`);
    }
    
    // 创建查询文档
    const queryDocument = [{
      pageContent: query,
      metadata: { namespaceId: 'query' }
    }];

    // 对查询进行向量化
    const queryVectors = await vectorize(queryDocument, configManager.getConfig().model);
    if (!queryVectors || queryVectors.length === 0) {
      throw new Error('查询向量化失败');
    }
    const queryVector = queryVectors[0];

    // 获取命名空间向量
    const relevantVectors = storage.getVectors(namespaceId);
    if (relevantVectors.length === 0) {
      return [];
    }

    // 计算相似度并排序
    const results = relevantVectors
      .map(vec => ({
        document: vec,
        score: cosineSimilarity(queryVector, vec.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  } catch (error) {
    console.error('搜索相似文档失败:', error);
    return [];
  }
}

/**
 * 修改向量化服务实现，添加事件和插件支持
 */
export class VectorizationServiceImpl implements VectorizationService {
  private readonly validator: InputValidatorImpl;
  private readonly accessControl: AccessControlImpl;
  private readonly eventBus: EventBus;
  private readonly pluginManager: PluginManager;

  constructor(
    private readonly storage: any,
    private readonly cache: MemoryVectorCache,
    private readonly config: ConfigManager,
    private readonly logger: LogManager,
    private readonly monitor: PerformanceMonitorImpl
  ) {
    this.validator = new InputValidatorImpl();
    this.accessControl = new AccessControlImpl();
    this.eventBus = new EventBus();
    this.pluginManager = new PluginManager();
  }

  async vectorize(
    documents: Document[],
    model: EmbeddingModel = this.config.getConfig().model
  ): Promise<number[][]> {
    const operationName = 'vectorize';
    this.monitor.startOperation(operationName);
    
    try {
      // 发布开始事件
      await this.eventBus.publish({
        type: EventType.VECTORIZATION_STARTED,
        data: { documentCount: documents.length, model: model.name },
        timestamp: new Date()
      });

      // 验证输入
      documents.forEach(doc => this.validator.validateDocument(doc));

      this.logger.info('开始向量化', {
        documentCount: documents.length,
        model: model.name
      });

      const results: number[][] = [];
      const { batchSize } = this.config.getConfig().performance;

      // 批量处理文档
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        for (const doc of batch) {
          const cacheKey = `${model.name}-${doc.pageContent}`;
          
          if (this.config.getConfig().cache.enabled) {
            const cachedVector = await this.cache.get(cacheKey);
            if (cachedVector) {
              this.logger.debug('使用缓存向量', { cacheKey });
              results.push(cachedVector);
              continue;
            }
          }

          this.logger.debug('向量化文档', { 
            model: model.name,
            contentLength: doc.pageContent.length 
          });

          // 使用 vectorize 函数
          const docVectors = await vectorize([doc], model);
          const vector = docVectors[0];

          // 验证向量
          this.validator.validateVector(vector);

          if (this.config.getConfig().cache.enabled) {
            await this.cache.set(cacheKey, vector);
          }
          results.push(vector);
        }
      }

      this.monitor.endOperation(operationName);
      const metrics = this.monitor.getMetrics();
      
      // 发布完成事件
      await this.eventBus.publish({
        type: EventType.VECTORIZATION_COMPLETED,
        data: {
          documentCount: documents.length,
          processingTime: metrics[operationName],
          averageTimePerDoc: metrics[operationName] / documents.length
        },
        timestamp: new Date()
      });

      this.logger.info('向量化完成', {
        documentCount: documents.length,
        processingTime: metrics[operationName],
        averageTimePerDoc: metrics[operationName] / documents.length
      });

      return results;
    } catch (error) {
      this.monitor.endOperation(operationName);
      
      // 发布失败事件
      await this.eventBus.publish({
        type: EventType.VECTORIZATION_FAILED,
        data: {
          error: error instanceof Error ? error.message : String(error),
          metrics: this.monitor.getMetrics()
        },
        timestamp: new Date()
      });

      this.logger.error('向量化失败', {
        error: error instanceof Error ? error.message : String(error),
        metrics: this.monitor.getMetrics()
      });
      throw error;
    }
  }

  async storeVectors(vectors: number[][], namespaceId: string): Promise<void> {
    const operationName = 'storeVectors';
    this.monitor.startOperation(operationName);

    try {
      // 验证输入
      this.validator.validateNamespaceId(namespaceId);
      vectors.forEach(vector => this.validator.validateVector(vector));

      this.logger.info('开始存储向量', { namespaceId, vectorCount: vectors.length });
      await this.storage.save(vectors, namespaceId);
      this.monitor.endOperation(operationName);
      this.logger.info('向量存储完成', {
        namespaceId,
        processingTime: this.monitor.getMetrics()[operationName]
      });
    } catch (error) {
      this.monitor.endOperation(operationName);
      this.logger.error('向量存储失败', {
        error: error instanceof Error ? error.message : String(error),
        namespaceId
      });
      throw error;
    }
  }

  async searchSimilarDocuments(
    query: string,
    namespaceId: string,
    limit: number = 5
  ): Promise<Document[]> {
    const operationName = 'searchSimilarDocuments';
    this.monitor.startOperation(operationName);

    try {
      // 验证输入
      this.validator.validateQuery(query);
      this.validator.validateNamespaceId(namespaceId);

      this.logger.info('开始搜索相似文档', { query, namespaceId, limit });

      const queryDocument = new Document({ pageContent: query });
      const queryVectors = await this.vectorize([queryDocument]);
      
      if (!queryVectors || queryVectors.length === 0) {
        throw new Error('查询向量化失败');
      }

      const documents = await this.storage.findByNamespace(namespaceId);
      const results = documents
        .map((doc: { document: Document; vector: number[] }) => ({
          document: doc,
          similarity: this.calculateCosineSimilarity(queryVectors[0], doc.vector)
        }))
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((result: { document: Document }) => result.document);

      this.monitor.endOperation(operationName);
      this.logger.info('相似文档搜索完成', {
        query,
        namespaceId,
        resultCount: results.length,
        processingTime: this.monitor.getMetrics()[operationName]
      });

      return results;
    } catch (error) {
      this.monitor.endOperation(operationName);
      this.logger.error('相似文档搜索失败', {
        error: error instanceof Error ? error.message : String(error),
        query,
        namespaceId
      });
      throw error;
    }
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    return cosineSimilarity(vec1, vec2);
  }

  // 添加插件管理方法
  async registerPlugin(plugin: VectorizationPlugin): Promise<void> {
    await this.pluginManager.register(plugin);
  }

  async unregisterPlugin(name: string): Promise<void> {
    await this.pluginManager.unregister(name);
  }

  // 添加事件订阅方法
  subscribe(type: EventType, handler: EventHandler): void {
    this.eventBus.subscribe(type, handler);
  }

  unsubscribe(type: EventType, handler: EventHandler): void {
    this.eventBus.unsubscribe(type, handler);
  }
}

// 创建服务实例
export const vectorizationService = new VectorizationServiceImpl(
  storage,
  vectorCache,
  configManager,
  logManager,
  performanceMonitor
);

// 导出工厂函数，方便测试时注入模拟依赖
export function createVectorizationService(
  storage: any,
  cache: MemoryVectorCache,
  config: ConfigManager,
  logger: LogManager,
  monitor: PerformanceMonitorImpl
): VectorizationService {
  return new VectorizationServiceImpl(storage, cache, config, logger, monitor);
}