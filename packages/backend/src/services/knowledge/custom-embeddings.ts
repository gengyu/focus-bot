import {Embeddings} from '@langchain/core/embeddings';
import {Document} from 'langchain/document';
import {batchVectorize} from '../vectorization/vectorizer';
import {EmbeddingModel} from '../vectorization/types';
import {defaultModel} from '../vectorization/config';

/**
 * 自定义嵌入类，使用本地向量化模型
 * 实现 LangChain 的 Embeddings 接口
 */
export class CustomEmbeddings extends Embeddings {
	private model: EmbeddingModel;

	constructor(model: EmbeddingModel = defaultModel) {
		super({});
		this.model = model;
	}

	/**
	 * 嵌入文档数组
	 * @param texts 文本数组
	 * @returns 向量数组
	 */
	async embedDocuments(texts: string[]): Promise<number[][]> {
		try {
			const documents = texts.map(text => new Document({pageContent: text}));

			let vectors = await batchVectorize(documents, this.model);

			return vectors;
		} catch (error) {
			throw new Error(`嵌入文档失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 嵌入查询文本
	 * @param text 查询文本
	 * @returns 向量
	 */
	async embedQuery(text: string): Promise<number[]> {
		try {
			const vectors = await this.embedDocuments([text]);
			return vectors[0];
		} catch (error) {
			throw new Error(`嵌入查询失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取模型配置
	 */
	getModel(): EmbeddingModel {
		return this.model;
	}

	/**
	 * 更新模型配置
	 */
	setModel(model: EmbeddingModel): void {
		this.model = model;
	}
}