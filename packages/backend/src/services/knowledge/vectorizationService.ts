import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {pipeline, env} from '@xenova/transformers';
import path from 'path';
import { Document } from 'langchain/document';

// 使用 Node.js 的 __dirname 变量
// 注意：如果项目使用 ES Modules，请确保 tsconfig.json 中设置了适当的 module 选项


// 设置模型缓存目录
// env.cacheDir 用于指定模型文件缓存的根目录。
// 我们将其设置为当前文件所在目录下的 '.cache_models' 文件夹。
// env.cacheDir = path.join(__dirname, 'cache_models');
console.log('env.localModelPath==', env.localModelPath)
// env.localModelPath = __dirname;
// env.remoteHost  = 'https://huggingface.co/';
env.remoteHost = 'https://hf-mirror.com/';

/**
 * 向量文档接口
 * @interface VectorDocument
 * @property {string} id - 文档唯一标识符
 * @property {string} text - 文档文本内容
 * @property {number[]} vector - 文档的向量表示
 * @property {Record<string, any>} metadata - 文档的元数据
 */
export interface VectorDocument {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, any>;
}

/**
 * 命名空间接口
 * @interface Namespace
 * @property {string} id - 命名空间唯一标识符
 * @property {string} name - 命名空间名称
 * @property {string} [description] - 命名空间描述
 */
export interface Namespace {
  id: string;
  name: string;
  description?: string;
}

/**
 * 向量化选项接口
 * @interface VectorizationOptions
 * @property {string} namespaceId - 命名空间ID
 * @property {string[]} texts - 待向量化的文本数组
 * @property {number} [chunkSize] - 文本分块大小，默认1000
 * @property {number} [chunkOverlap] - 文本分块重叠大小，默认200
 */
export interface VectorizationOptions {
  namespaceId: string;
  texts: string[];
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * 向量化结果接口
 * @interface VectorizationResult
 * @property {'success' | 'error'} status - 处理状态
 * @property {string} message - 处理结果消息
 * @property {number} [vectorCount] - 生成的向量数量
 */
export interface VectorizationResult {
  status: 'success' | 'error';
  message: string;
  vectorCount?: number;
}

/**
 * 向量化错误类型
 */
export class VectorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VectorizationError';
  }
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  NAMESPACE_NOT_FOUND = 'NAMESPACE_NOT_FOUND',
  NAMESPACE_ALREADY_EXISTS = 'NAMESPACE_ALREADY_EXISTS',
  VECTORIZATION_FAILED = 'VECTORIZATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PLUGIN_ALREADY_EXISTS = 'PLUGIN_ALREADY_EXISTS'
}

/**
 * 向量化模型配置
 * @interface EmbeddingModel
 */
export interface EmbeddingModel {
  /** 模型名称 */
  name: string;
  /** 向量维度 */
  dimension: number;
  /** 最大token数 */
  maxTokens: number;
  /** 池化方法 */
  pooling: 'mean' | 'max' | 'cls';
  /** 是否归一化 */
  normalize: boolean;
}

/**
 * 默认模型配置
 */
const defaultModel: EmbeddingModel = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  maxTokens: 256,
  pooling: 'mean',
  normalize: true
};

/**
 * 应用配置
 * @constant appConfig
 */
export const appConfig = {
  defaultChunkSize: 1000,
  defaultChunkOverlap: 200,
  model: defaultModel,
} as const;


// const embedder = pipeline('feature-extraction', appConfig.modelName);

// 向量存储（内存中）
let vectorStore: VectorDocument[] = [];

// 命名空间存储（内存中）
let namespaceStore: Map<string, Namespace> = new Map();

/**
 * 创建命名空间
 * @param {Namespace} namespace - 命名空间信息
 * @returns {Promise<Namespace>} 创建的命名空间
 */
export async function createNamespace(namespace: Namespace): Promise<Namespace> {
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
export function getNamespace(namespaceId: string): Namespace | undefined {
  return namespaceStore.get(namespaceId);
}

/**
 * 删除命名空间
 * @param {string} namespaceId - 命名空间ID
 * @returns {boolean} 是否删除成功
 */
export function deleteNamespace(namespaceId: string): boolean {
  // 删除命名空间下的所有向量
  clearVectorsByNamespaceId(namespaceId);
  return namespaceStore.delete(namespaceId);
}

/**
 * 向量缓存接口
 * @interface VectorCache
 */
export interface VectorCache {
  /**
   * 获取缓存的向量
   * @param key - 缓存键
   */
  get(key: string): Promise<number[] | null>;

  /**
   * 设置向量缓存
   * @param key - 缓存键
   * @param vector - 要缓存的向量
   */
  set(key: string, vector: number[]): Promise<void>;

  /**
   * 使缓存失效
   * @param key - 缓存键
   */
  invalidate(key: string): Promise<void>;
}

/**
 * 内存向量缓存实现
 * @class MemoryVectorCache
 * @implements {VectorCache}
 */
export class MemoryVectorCache implements VectorCache {
  private cache: Map<string, { vector: number[]; timestamp: number }> = new Map();
  private readonly ttl: number;

  constructor(ttl: number = 3600 * 1000) {
    this.ttl = ttl;
  }

  async get(key: string): Promise<number[] | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.vector;
  }

  async set(key: string, vector: number[]): Promise<void> {
    this.cache.set(key, {
      vector,
      timestamp: Date.now()
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

/**
 * 日志接口
 * @interface VectorizationLog
 */
interface VectorizationLog {
  level: LogLevel;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * 日志处理器接口
 * @interface LogHandler
 */
interface LogHandler {
  handle(log: VectorizationLog): void;
}

/**
 * 控制台日志处理器
 * @class ConsoleLogHandler
 * @implements {LogHandler}
 */
class ConsoleLogHandler implements LogHandler {
  handle(log: VectorizationLog): void {
    const timestamp = log.timestamp.toISOString();
    const metadata = JSON.stringify(log.metadata);
    console.log(`[${timestamp}] ${log.level.toUpperCase()}: ${log.message} ${metadata}`);
  }
}

/**
 * 日志管理器
 * @class LogManager
 */
class LogManager {
  private handlers: LogHandler[] = [];

  constructor() {
    // 默认添加控制台处理器
    this.addHandler(new ConsoleLogHandler());
  }

  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  log(level: LogLevel, message: string, metadata: Record<string, any> = {}): void {
    const log: VectorizationLog = {
      level,
      message,
      metadata,
      timestamp: new Date()
    };

    this.handlers.forEach(handler => handler.handle(log));
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
}

// 创建日志管理器实例
const logManager = new LogManager();

/**
 * 性能监控接口
 * @interface PerformanceMonitor
 */
interface PerformanceMonitor {
  startOperation(name: string): void;
  endOperation(name: string): void;
  getMetrics(): Record<string, number>;
}

/**
 * 性能监控实现
 * @class PerformanceMonitorImpl
 * @implements {PerformanceMonitor}
 */
class PerformanceMonitorImpl implements PerformanceMonitor {
  private operations: Map<string, { start: number; end?: number }> = new Map();

  startOperation(name: string): void {
    this.operations.set(name, { start: Date.now() });
  }

  endOperation(name: string): void {
    const operation = this.operations.get(name);
    if (operation) {
      operation.end = Date.now();
    }
  }

  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.operations.forEach((operation, name) => {
      if (operation.end) {
        metrics[name] = operation.end - operation.start;
      }
    });
    return metrics;
  }
}

// 创建性能监控实例
const performanceMonitor = new PerformanceMonitorImpl();

/**
 * 批量向量化
 * @param {Document[]} documents - 待向量化的文档数组
 * @param {EmbeddingModel} model - 向量化模型配置
 * @param {number} [batchSize=32] - 批处理大小
 * @returns {Promise<number[][]>} 向量化结果
 */
async function batchVectorize(
  documents: Document[],
  model: EmbeddingModel,
  batchSize: number = 32
): Promise<number[][]> {
  const results: number[][] = [];
  const metrics: VectorizationMetrics = {
    startTime: Date.now(),
    endTime: 0,
    documentCount: documents.length,
    vectorDimension: model.dimension,
    processingTime: 0
  };

  try {
    // 分批处理
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchVectors = await vectorize(batch, model);
      results.push(...batchVectors);
    }

    metrics.endTime = Date.now();
    metrics.processingTime = metrics.endTime - metrics.startTime;

    // 记录性能指标
    console.log('向量化性能指标:', {
      documentCount: metrics.documentCount,
      processingTime: `${metrics.processingTime}ms`,
      averageTimePerDoc: `${metrics.processingTime / metrics.documentCount}ms`
    });

    return results;
  } catch (error) {
    throw new VectorizationError(
      '批量向量化失败',
      ErrorCode.VECTORIZATION_FAILED,
      { metrics, error }
    );
  }
}

/**
 * 向量化服务配置
 * @interface VectorizationConfig
 */
export interface VectorizationConfig {
  /** 模型配置 */
  model: EmbeddingModel;
  /** 缓存配置 */
  cache: {
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存过期时间（毫秒） */
    ttl: number;
  };
  /** 存储配置 */
  storage: {
    /** 存储类型 */
    type: 'memory' | 'database';
    /** 存储选项 */
    options?: Record<string, any>;
  };
  /** 日志配置 */
  logging: {
    /** 日志级别 */
    level: LogLevel;
    /** 日志处理器 */
    handlers: LogHandler[];
  };
  /** 性能配置 */
  performance: {
    /** 批处理大小 */
    batchSize: number;
    /** 超时时间（毫秒） */
    timeout: number;
  };
}

/**
 * 默认配置
 */
const defaultConfig: VectorizationConfig = {
  model: defaultModel,
  cache: {
    enabled: true,
    ttl: 3600 * 1000 // 1小时
  },
  storage: {
    type: 'memory'
  },
  logging: {
    level: LogLevel.INFO,
    handlers: [new ConsoleLogHandler()]
  },
  performance: {
    batchSize: 10,
    timeout: 30000 // 30秒
  }
};

/**
 * 配置管理器
 * @class ConfigManager
 */
class ConfigManager {
  private config: VectorizationConfig;

  constructor(config: Partial<VectorizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  getConfig(): VectorizationConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<VectorizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 创建配置管理器实例
const configManager = new ConfigManager();

// 创建存储实例
const storage = new MemoryStorage();

// 创建缓存实例
const vectorCache = new MemoryVectorCache();

/**
 * 输入验证接口
 * @interface InputValidator
 */
interface InputValidator {
  validateDocument(doc: Document): void;
  validateVector(vector: number[]): void;
  validateNamespaceId(namespaceId: string): void;
  validateQuery(query: string): void;
}

/**
 * 输入验证实现
 * @class InputValidatorImpl
 * @implements {InputValidator}
 */
class InputValidatorImpl implements InputValidator {
  validateDocument(doc: Document): void {
    if (!doc || typeof doc.pageContent !== 'string') {
      throw new VectorizationError('无效的文档格式', ErrorCode.INVALID_INPUT);
    }
    if (doc.pageContent.length === 0) {
      throw new VectorizationError('文档内容不能为空', ErrorCode.INVALID_INPUT);
    }
    if (doc.pageContent.length > 10000) {
      throw new VectorizationError('文档内容超过最大长度限制', ErrorCode.INVALID_INPUT);
    }
  }

  validateVector(vector: number[]): void {
    if (!Array.isArray(vector)) {
      throw new VectorizationError('向量必须是数组', ErrorCode.INVALID_INPUT);
    }
    if (vector.length === 0) {
      throw new VectorizationError('向量不能为空', ErrorCode.INVALID_INPUT);
    }
    if (!vector.every(num => typeof num === 'number' && !isNaN(num))) {
      throw new VectorizationError('向量包含无效的数值', ErrorCode.INVALID_INPUT);
    }
  }

  validateNamespaceId(namespaceId: string): void {
    if (!namespaceId || typeof namespaceId !== 'string') {
      throw new VectorizationError('无效的命名空间ID', ErrorCode.INVALID_INPUT);
    }
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(namespaceId)) {
      throw new VectorizationError('命名空间ID格式无效', ErrorCode.INVALID_INPUT);
    }
  }

  validateQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new VectorizationError('无效的查询字符串', ErrorCode.INVALID_INPUT);
    }
    if (query.length === 0) {
      throw new VectorizationError('查询字符串不能为空', ErrorCode.INVALID_INPUT);
    }
    if (query.length > 1000) {
      throw new VectorizationError('查询字符串超过最大长度限制', ErrorCode.INVALID_INPUT);
    }
  }
}

/**
 * 访问控制接口
 * @interface AccessControl
 */
interface AccessControl {
  checkAccess(namespaceId: string, userId: string): Promise<boolean>;
  validateAccess(namespaceId: string, userId: string): Promise<void>;
}

/**
 * 访问控制实现
 * @class AccessControlImpl
 * @implements {AccessControl}
 */
class AccessControlImpl implements AccessControl {
  async checkAccess(namespaceId: string, userId: string): Promise<boolean> {
    // TODO: 实现实际的访问控制逻辑
    return true;
  }

  async validateAccess(namespaceId: string, userId: string): Promise<void> {
    const hasAccess = await this.checkAccess(namespaceId, userId);
    if (!hasAccess) {
      throw new VectorizationError('没有访问权限', ErrorCode.ACCESS_DENIED);
    }
  }
}

/**
 * 向量化文档（带缓存）
 * @param {Document[]} documents - 待向量化的文档数组
 * @param {EmbeddingModel} [model=defaultModel] - 向量化模型配置
 * @returns {Promise<number[][]>} 向量化结果
 */
export async function vectorize(
  documents: Document[],
  model: EmbeddingModel = configManager.getConfig().model
): Promise<number[][]> {
  const operationName = 'vectorize';
  performanceMonitor.startOperation(operationName);
  
  try {
    logManager.info('开始向量化', {
      documentCount: documents.length,
      model: model.name
    });

    const results: number[][] = [];
    const { batchSize } = configManager.getConfig().performance;

    // 批量处理文档
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      for (const doc of batch) {
        const cacheKey = `${model.name}-${doc.pageContent}`;
        
        if (configManager.getConfig().cache.enabled) {
          const cachedVector = await vectorCache.get(cacheKey);
          if (cachedVector) {
            logManager.debug('使用缓存向量', { cacheKey });
            results.push(cachedVector);
            continue;
          }
        }

        logManager.debug('向量化文档', { 
          model: model.name,
          contentLength: doc.pageContent.length 
        });

        const embedder = await pipeline('feature-extraction', model.name);
        const vectors = await embedder([doc.pageContent], {
          pooling: model.pooling,
          normalize: model.normalize
        });

        const vector = Array.isArray(vectors) 
          ? Array.from(vectors[0].data) as number[]
          : Array.from(vectors.data[0]) as number[];

        if (configManager.getConfig().cache.enabled) {
          await vectorCache.set(cacheKey, vector);
        }
        results.push(vector);
      }
    }

    performanceMonitor.endOperation(operationName);
    const metrics = performanceMonitor.getMetrics();
    
    logManager.info('向量化完成', {
      documentCount: documents.length,
      processingTime: metrics[operationName],
      averageTimePerDoc: metrics[operationName] / documents.length
    });

    return results;
  } catch (error) {
    performanceMonitor.endOperation(operationName);
    logManager.error('向量化失败', {
      error: error instanceof Error ? error.message : String(error),
      metrics: performanceMonitor.getMetrics()
    });
    throw error;
  }
}

/**
 * 存储向量
 * @param {Document[]} documents - 文档数组
 * @param {number[][]} vectors - 向量数组
 * @param {string} namespaceId - 命名空间ID
 * @returns {VectorDocument[]} 存储的向量文档数组
 */
export function storeVectors(documents: any[], vectors: number[][], namespaceId: string): VectorDocument[] {
  const newVectors: VectorDocument[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const vec: VectorDocument = {
      id: `${namespaceId}-${vectorStore.length + i}`,
      text: documents[i].pageContent,
      vector: vectors[i],
      metadata: documents[i].metadata,
    };
    vectorStore.push(vec);
    newVectors.push(vec);
  }
  
  return newVectors;
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
    const newVectors = await storeVectors(documents, vectors, namespaceId);

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
 * 获取内存中的向量
 * @param {string} [namespaceId] - 可选的命名空间ID
 * @returns {VectorDocument[]} 向量文档数组
 */
export function getVectors(namespaceId?: string): VectorDocument[] {
  if (namespaceId) {
    return vectorStore.filter(vec => vec.metadata.namespaceId === namespaceId);
  }
  return vectorStore;
}

/**
 * 计算余弦相似度
 * @param {number[]} vecA - 向量A
 * @param {number[]} vecB - 向量B
 * @returns {number} 相似度得分
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

/**
 * 清理特定命名空间的向量
 * @param {string} namespaceId - 命名空间ID
 */
export function clearVectorsByNamespaceId(namespaceId: string): void {
  vectorStore = vectorStore.filter(vec => vec.metadata.namespaceId !== namespaceId);
}

/**
 * 搜索结果接口
 * @interface SearchResult
 * @property {VectorDocument} document - 匹配的文档
 * @property {number} score - 相似度得分
 */
export interface SearchResult {
  document: VectorDocument;
  score: number;
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
    if (!namespaceStore.has(namespaceId)) {
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
    const relevantVectors = vectorStore.filter(vec => vec.metadata.namespaceId === namespaceId);
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
 * 向量化服务接口
 * @interface VectorizationService
 */
export interface VectorizationService {
  /**
   * 将文档向量化
   * @param documents - 要向量化的文档数组
   * @param model - 可选的向量化模型配置
   * @returns 向量数组的Promise
   */
  vectorize(documents: Document[], model?: EmbeddingModel): Promise<number[][]>;

  /**
   * 存储向量
   * @param vectors - 要存储的向量数组
   * @param namespaceId - 命名空间ID
   */
  storeVectors(vectors: number[][], namespaceId: string): Promise<void>;

  /**
   * 搜索相似文档
   * @param query - 查询字符串
   * @param namespaceId - 命名空间ID
   * @param limit - 返回结果数量限制
   * @returns 相似文档数组的Promise
   */
  searchSimilarDocuments(query: string, namespaceId: string, limit?: number): Promise<Document[]>;

  /**
   * 注册插件
   * @param plugin - 要注册的插件
   */
  registerPlugin(plugin: VectorizationPlugin): Promise<void>;

  /**
   * 注销插件
   * @param name - 插件名称
   */
  unregisterPlugin(name: string): Promise<void>;

  /**
   * 订阅事件
   * @param type - 事件类型
   * @param handler - 事件处理器
   */
  subscribe(type: EventType, handler: EventHandler): void;

  /**
   * 取消订阅事件
   * @param type - 事件类型
   * @param handler - 事件处理器
   */
  unsubscribe(type: EventType, handler: EventHandler): void;
}

/**
 * 事件类型枚举
 */
export enum EventType {
  VECTORIZATION_STARTED = 'vectorization.started',
  VECTORIZATION_COMPLETED = 'vectorization.completed',
  VECTORIZATION_FAILED = 'vectorization.failed',
  STORAGE_STARTED = 'storage.started',
  STORAGE_COMPLETED = 'storage.completed',
  STORAGE_FAILED = 'storage.failed',
  SEARCH_STARTED = 'search.started',
  SEARCH_COMPLETED = 'search.completed',
  SEARCH_FAILED = 'search.failed'
}

/**
 * 事件接口
 * @interface VectorizationEvent
 */
export interface VectorizationEvent {
  type: EventType;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * 事件处理器接口
 * @interface EventHandler
 */
export interface EventHandler {
  handle(event: VectorizationEvent): void | Promise<void>;
}

/**
 * 事件总线
 * @class EventBus
 */
export class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  subscribe(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  unsubscribe(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  async publish(event: VectorizationEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler.handle(event)));
  }
}

/**
 * 插件接口
 * @interface VectorizationPlugin
 */
export interface VectorizationPlugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * 插件管理器
 * @class PluginManager
 */
export class PluginManager {
  private plugins: Map<string, VectorizationPlugin> = new Map();

  async register(plugin: VectorizationPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new VectorizationError(`插件 ${plugin.name} 已存在`, ErrorCode.PLUGIN_ALREADY_EXISTS);
    }
    await plugin.initialize();
    this.plugins.set(plugin.name, plugin);
  }

  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.cleanup();
      this.plugins.delete(name);
    }
  }

  getPlugin(name: string): VectorizationPlugin | undefined {
    return this.plugins.get(name);
  }

  async cleanup(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values()).map(plugin => plugin.cleanup())
    );
    this.plugins.clear();
  }
}

/**
 * 修改向量化服务实现，添加事件和插件支持
 */
export class VectorizationServiceImpl implements VectorizationService {
  private readonly validator: InputValidator;
  private readonly accessControl: AccessControl;
  private readonly eventBus: EventBus;
  private readonly pluginManager: PluginManager;

  constructor(
    private readonly storage: Storage,
    private readonly cache: VectorCache,
    private readonly config: ConfigManager,
    private readonly logger: LogManager,
    private readonly monitor: PerformanceMonitor
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

          const embedder = await pipeline('feature-extraction', model.name);
          const vectors = await embedder([doc.pageContent], {
            pooling: model.pooling,
            normalize: model.normalize
          });

          const vector = Array.isArray(vectors) 
            ? Array.from(vectors[0].data) as number[]
            : Array.from(vectors.data[0]) as number[];

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
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
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
  new MemoryStorage(),
  new MemoryVectorCache(),
  configManager,
  logManager,
  performanceMonitor
);

// 导出工厂函数，方便测试时注入模拟依赖
export function createVectorizationService(
  storage: Storage,
  cache: VectorCache,
  config: ConfigManager,
  logger: LogManager,
  monitor: PerformanceMonitor
): VectorizationService {
  return new VectorizationServiceImpl(storage, cache, config, logger, monitor);
}

// main().catch(err => console.error('主进程错误:', err));