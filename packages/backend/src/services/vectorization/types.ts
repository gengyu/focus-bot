import { Document } from 'langchain/document';

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
  name?: string;
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
  // pooling: 'mean' | 'max' | 'cls';
  pooling: "none" | "mean" | "cls" | undefined;
  /** 是否归一化 */
  normalize: boolean;
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
export interface VectorizationLog {
  level: LogLevel;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * 日志处理器接口
 * @interface LogHandler
 */
export interface LogHandler {
  handle(log: VectorizationLog): void;
}

/**
 * 性能监控接口
 * @interface PerformanceMonitor
 */
export interface PerformanceMonitor {
  startOperation(name: string): void;
  endOperation(name: string): void;
  getMetrics(): Record<string, number>;
}

/**
 * 向量化指标接口
 * @interface VectorizationMetrics
 */
export interface VectorizationMetrics {
  startTime: number;
  endTime: number;
  documentCount: number;
  vectorDimension: number;
  processingTime: number;
}

/**
 * 输入验证接口
 * @interface InputValidator
 */
export interface InputValidator {
  validateDocument(doc: Document): void;
  validateVector(vector: number[]): void;
  validateNamespaceId(namespaceId: string): void;
  validateQuery(query: string): void;
}

/**
 * 访问控制接口
 * @interface AccessControl
 */
export interface AccessControl {
  checkAccess(namespaceId: string, userId: string): Promise<boolean>;
  validateAccess(namespaceId: string, userId: string): Promise<void>;
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
 * 存储接口
 * @interface Storage
 */
export interface Storage {
  /**
   * 保存命名空间
   * @param namespace - 命名空间信息
   */
  saveNamespace(namespace: Namespace): Promise<void>;
  
  /**
   * 获取命名空间
   * @param id - 命名空间ID
   */
  getNamespace(id: string): Promise<Namespace | null>;
  
  /**
   * 保存向量
   * @param vectors - 向量数组
   * @param namespaceId - 命名空间ID
   */
  save(vectors: number[][], namespaceId: string): Promise<void>;
  
  /**
   * 根据命名空间查找文档
   * @param namespaceId - 命名空间ID
   */
  findByNamespace(namespaceId: string): Promise<any[]>;
}