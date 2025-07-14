import {pipeline, env} from '@xenova/transformers';
import {Document} from 'langchain/document';
import {EmbeddingModel, VectorizationMetrics} from './types';
import {VectorizationError} from './errors';
import {ErrorCode} from './errors';
import {LogManager} from './logging';
import {PerformanceMonitorImpl} from './performance';
import {ConfigManager} from './config';
import {MemoryVectorCache} from './cache';
import path from 'path';

// 设置模型缓存目录
env.cacheDir = path.join(process.cwd(), '/data/.cache/')
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
	batchSize: number = configManager.getConfig().performance.batchSize || 32
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
			let batchVectors: number[][] = [];
			for (let j = 0; j < batch.length; j++) {
				const batchVector = await vectorize(batch[j], model);
				batchVectors.push(batchVector);
			}
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
			{metrics, error}
		);
	}
}

/**
 * 向量化文档（带缓存）
 * @param {Document[]} document - 待向量化的文档数组
 * @param {EmbeddingModel} [model=defaultModel] - 向量化模型配置
 * @returns {Promise<number[][]>} 向量化结果
 */
export async function vectorize(
	document: Document,
	model: EmbeddingModel = configManager.getConfig().model
): Promise<number[]> {
	const operationName = 'vectorize';
	performanceMonitor.startOperation(operationName);

	try {
		logManager.info('开始向量化', {
			documentCount: 1,
			model: model.name
		});


		// 批量处理文档
		const doc = document;
		const cacheKey = `${model.name}-${doc.pageContent}`;

		if (configManager.getConfig().cache.enabled) {
			const cachedVector = await vectorCache.get(cacheKey);
			if (cachedVector) {
				logManager.debug('使用缓存向量', {cacheKey});
				return cachedVector;

			}
		}

		logManager.debug('向量化文档', {
			model: model.name,
			contentLength: doc.pageContent.length
		});

		const embedder = await pipeline('feature-extraction', model.name, {
			progress_callback: function (progress: any) {
				if (progress.status === 'progress') {
					const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(2); // 转换为 MB
					const totalMB = (progress.total / (1024 * 1024)).toFixed(2);
					const loadedGB = (progress.loaded / (1024 * 1024 * 1024)).toFixed(2); // 转换为 GB
					const totalGB = (progress.total / (1024 * 1024 * 1024)).toFixed(2);

					// 记录开始时间
					if (!this._downloadStartTime) {
						this._downloadStartTime = Date.now();
						this._lastLoaded = 0;
						this._lastTime = Date.now();
					}

					const now = Date.now();
					const timeDiffSec = (now - this._lastTime) / 1000;
					const bytesDiff = progress.loaded - this._lastLoaded;

					// 下载速度（bps）
					const speedBps = bytesDiff / timeDiffSec;
					const speedKBps = (speedBps / 1024).toFixed(2);
					const speedMBps = (speedBps / (1024 * 1024)).toFixed(2);

					// 剩余时间（秒）
					const remainingBytes = progress.total - progress.loaded;
					const etaSeconds = remainingBytes / speedBps;
					const etaFormatted = formatTime(etaSeconds);


					logManager.debug('正在加载模型', {
						progress: `${progress?.progress?.toFixed(3)}%`,
						name: progress.name,
						loaded: `${loadedMB} MB`,
						total: `${totalMB} MB`,
						speed: `${speedMBps} MB/s)`,
						// eta: `${etaFormatted}`,
					});
				}
			}.bind({}),
		});
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


		performanceMonitor.endOperation(operationName);
		const metrics = performanceMonitor.getMetrics();

		logManager.info('向量化完成', {
			documentCount: 1,
			processingTime: metrics[operationName],
			averageTimePerDoc: metrics[operationName],
			document,
		});

		// console.log(results)
		return vector;
	} catch (error) {
		performanceMonitor.endOperation(operationName);
		logManager.error('向量化失败', {
			error: error instanceof Error ? error.message : String(error),
			metrics: performanceMonitor.getMetrics()
		});
		throw error;
	}
}


function formatTime(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m ` : ''}${secs}s`;
}