import { pipeline, env } from '@xenova/transformers';
import { Document } from 'langchain/document';
import { EmbeddingModel, VectorizationMetrics } from './types';
import { VectorizationError } from './errors';
import { ErrorCode } from './errors';
import { LogManager } from './logging';
import { PerformanceMonitorImpl } from './performance';
import { ConfigManager } from './config';
import { MemoryVectorCache } from './cache';

// 设置模型缓存目录
env.remoteHost = 'https://hf-mirror.com/';

// 创建日志管理器实例
const logManager = new LogManager();

// 创建性能监控实例
const performanceMonitor = new PerformanceMonitorImpl();

// 创建配置管理器实例
const configManager = new ConfigManager();

// 创建缓存实例
const vectorCache = new MemoryVectorCache();

/**
 * 批量向量化
 * @param {Document[]} documents - 待向量化的文档数组
 * @param {EmbeddingModel} model - 向量化模型配置
 * @param {number} [batchSize=32] - 批处理大小
 * @returns {Promise<number[][]>} 向量化结果
 */
export async function batchVectorize(
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
          : Array.from(vectors.data) as number[];

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
      averageTimePerDoc: metrics[operationName] / documents.length,
      documents,
    });

    console.log(results)
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