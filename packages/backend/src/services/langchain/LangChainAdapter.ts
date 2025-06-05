import { Document } from 'langchain/document';
import { LangChainService } from './LangChainService';
import { Singleton } from '../../decorators/Singleton';
import {
  VectorizationService,
  VectorizationOptions,
  VectorizationResult,
  SearchResult,
  EmbeddingModel,
  Namespace
} from '../vectorization/types';
import { ConfigManager } from '../vectorization/config';
import { LogManager } from '../vectorization/logging';
import { PerformanceMonitorImpl } from '../vectorization/performance';
import { EventBus } from '../vectorization/events';
import { EventType } from '../vectorization/types';

/**
 * LangChain适配器，实现VectorizationService接口
 * 将LangChain服务适配到现有的向量化服务接口
 */
@Singleton()
export class LangChainAdapter implements VectorizationService {
  private langChainService: LangChainService;
  private configManager: ConfigManager;
  private logger: LogManager;
  private monitor: PerformanceMonitorImpl;
  private eventBus: EventBus;
  private namespaces: Map<string, Namespace> = new Map();

  constructor() {
    this.langChainService = new LangChainService();
    this.configManager = new ConfigManager();
    this.logger = new LogManager();
    this.monitor = new PerformanceMonitorImpl();
    this.eventBus = new EventBus();
  }

  /**
   * 创建命名空间
   * @param namespace 命名空间信息
   * @returns 创建的命名空间
   */
  async createNamespace(namespace: Namespace): Promise<Namespace> {
    if (this.namespaces.has(namespace.id)) {
      throw new Error(`命名空间 ${namespace.id} 已存在`);
    }
    this.namespaces.set(namespace.id, namespace);
    return namespace;
  }

  /**
   * 获取命名空间
   * @param namespaceId 命名空间ID
   * @returns 命名空间信息
   */
  async getNamespace(namespaceId: string): Promise<Namespace | null> {
    return this.namespaces.get(namespaceId) || null;
  }

  /**
   * 将文档向量化
   * @param documents 要向量化的文档数组
   * @param model 可选的向量化模型配置
   * @returns 向量数组的Promise
   */
  async vectorize(documents: Document[], model?: EmbeddingModel): Promise<number[][]> {
    const operationName = 'vectorize';
    this.monitor.startOperation(operationName);
    
    try {
      // 发布开始事件
      await this.eventBus.publish({
        type: EventType.VECTORIZATION_STARTED,
        data: { documentCount: documents.length, model: model?.name || 'default' },
        timestamp: new Date()
      });

      this.logger.info('开始向量化', {
        documentCount: documents.length,
        model: model?.name || 'default'
      });

      // 由于LangChain内部处理向量化，这里我们不直接返回向量
      // 实际应用中，可以考虑使用OpenAI API直接获取向量
      // 这里返回空向量数组，实际向量存储在LangChain的VectorStore中
      const emptyVectors = documents.map(() => []);

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

      return emptyVectors;
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

  /**
   * 存储向量
   * @param vectors 要存储的向量数组
   * @param namespaceId 命名空间ID
   */
  async storeVectors(vectors: number[][], namespaceId: string): Promise<void> {
    const operationName = 'storeVectors';
    this.monitor.startOperation(operationName);

    try {
      this.logger.info('开始存储向量', { namespaceId, vectorCount: vectors.length });
      
      // 检查命名空间是否存在
      if (!this.namespaces.has(namespaceId)) {
        await this.createNamespace({ id: namespaceId });
      }
      
      // 由于LangChain内部处理向量存储，这里不需要额外操作
      // 实际向量存储在LangChain的VectorStore中
      
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

  /**
   * 搜索相似文档
   * @param query 查询字符串
   * @param namespaceId 命名空间ID
   * @param topK 返回结果数量
   * @returns 搜索结果
   */
  async searchSimilarDocuments(query: string, namespaceId: string, topK: number = 3): Promise<SearchResult[]> {
    const operationName = 'searchSimilarDocuments';
    this.monitor.startOperation(operationName);

    try {
      this.logger.info('开始搜索相似文档', { query, namespaceId, topK });
      
      // 检查命名空间是否存在
      if (!this.namespaces.has(namespaceId)) {
        throw new Error(`命名空间 ${namespaceId} 不存在`);
      }
      
      // 使用LangChain服务搜索相似文档
      const results = await this.langChainService.searchSimilarDocuments(query, namespaceId, topK);
      
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
      return [];
    }
  }

  /**
   * 向量化并存储文档
   * @param options 向量化选项
   * @returns 向量化结果
   */
  async vectorizeAndStore(options: VectorizationOptions): Promise<VectorizationResult> {
    try {
      const { namespaceId, texts, chunkSize, chunkOverlap } = options;
      
      if (!namespaceId || !texts || !Array.isArray(texts)) {
        throw new Error('namespaceId 和 texts 是必填字段，且 texts 必须是数组');
      }
      
      // 检查命名空间是否存在，不存在则创建
      if (!this.namespaces.has(namespaceId)) {
        await this.createNamespace({ id: namespaceId });
      }
      
      // 创建文档对象
      const documents = texts.map(text => new Document({ pageContent: text, metadata: { namespaceId } }));
      
      // 分割文档
      const splitDocs = await this.langChainService.splitDocuments(
        documents,
        chunkSize,
        chunkOverlap
      );
      
      // 向量化文档
      const result = await this.langChainService.vectorizeDocuments(splitDocs, namespaceId);
      
      return result;
    } catch (error) {
      return {
        status: 'error',
        message: `向量化并存储失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 注册插件（兼容接口，实际不使用）
   */
  async registerPlugin(): Promise<void> {
    // 兼容接口，实际不使用
  }

  /**
   * 注销插件（兼容接口，实际不使用）
   */
  async unregisterPlugin(): Promise<void> {
    // 兼容接口，实际不使用
  }

  /**
   * 订阅事件
   * @param type 事件类型
   * @param handler 事件处理器
   */
  subscribe(type: EventType, handler: any): void {
    this.eventBus.subscribe(type, handler);
  }
}