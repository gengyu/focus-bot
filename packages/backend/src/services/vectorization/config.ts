import { EmbeddingModel, VectorizationConfig, LogLevel } from './types';
import { ConsoleLogHandler } from './logging';

/**
 * 默认模型配置
 */
export const defaultModel: EmbeddingModel = {
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

/**
 * 默认配置
 */
export const defaultConfig: VectorizationConfig = {
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
export class ConfigManager {
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