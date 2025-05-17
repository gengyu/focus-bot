import { IndexFlatL2 } from 'faiss-node';
import { pipeline } from '@xenova/transformers';
import { LLMProvider } from '../provider/LLMProvider';
import { ChatMessage } from '../../../../share/type';
import { SearchService } from './SearchService';
import { Document } from '../types/rag.types';

// Document 接口已移至 rag.types.ts

interface RelevantDoc {
  content: string;
  score: number;
}

/**
 * 基于检索增强生成(RAG)的服务类，实现了以下核心功能：
 * 1. 使用 Transformers.js 创建文本嵌入表示
 * 2. 利用 FAISS 进行高效向量相似性搜索
 * 3. 整合 LLMProvider 提供的语言模型能力
 * 4. 结合 SearchService 进行上下文增强
 */
export class RAGService {
  private readonly llmProvider: LLMProvider;
  private readonly searchService: SearchService;
  private indexes: Map<string, IndexFlatL2> = new Map();
  private documents: Map<string, Document[]> = new Map();
  private readonly modelId: string = 'gpt-3.5-turbo';
  private embeddingPipeline: any = null;

  /**
   * 构造函数初始化必要的依赖服务
   * @param llmProvider 大语言模型提供者实例
   */
  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
    this.searchService = new SearchService();
  }

  /**
   * 初始化文本嵌入模型管道
   * 使用 Xenova/all-MiniLM-L6-v2 模型进行文本特征提取
   */
  private async initEmbeddingPipeline() {
    if (!this.embeddingPipeline) {
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  }

  /**
   * 初始化RAG服务
   */
  async initialize() {
    await this.initEmbeddingPipeline();
    return true;
  }

  /**
   * 准备知识库索引的主方法
   * 执行完整流程：文档分块 -> 生成嵌入 -> 创建并填充 FAISS 索引
   * @param knowledgeBaseId 知识库ID
   * @param documents 需要处理的原始文档数组
   */
  async prepareKnowledgeBase(knowledgeBaseId: string, documents: Document[]) {
    // 初始化 embedding pipeline
    await this.initEmbeddingPipeline();

    // 将文档分块
    const chunks = this.splitDocuments(documents);
    this.documents.set(knowledgeBaseId, chunks);

    // 为每个块生成嵌入向量
    const embeddings = await Promise.all(
      chunks.map(chunk => this.generateEmbedding(chunk.pageContent))
    );

    // 创建 FAISS 索引
    if (embeddings.length > 0) {
      const dimension = embeddings[0].length;
      const index = new IndexFlatL2(dimension);

      // 将向量添加到索引
      const vectors = embeddings.flat();
      index.add(vectors);

      this.indexes.set(knowledgeBaseId, index);
    } else {
      // 创建空索引
      const dimension = 384; // MiniLM-L6-v2 的维度
      const index = new IndexFlatL2(dimension);
      this.indexes.set(knowledgeBaseId, index);
    }
  }

  /**
   * 将文档按段落分割为更小的文本块
   * @param documents 需要分割的原始文档数组
   * @returns 分割后的文档块数组
   */
  private splitDocuments(documents: Document[]): Document[] {
    const chunks: Document[] = [];

    for (const doc of documents) {
      // 简单的按段落分割
      const paragraphs = doc.pageContent.split('\n\n');

      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          chunks.push({
            pageContent: paragraph,
            metadata: {
              ...doc.metadata,
              id: `${doc.metadata.id}-${chunks.length}`
            }
          });
        }
      }
    }

    return chunks;
  }

  /**
   * 为给定文本生成嵌入向量
   * @param text 需要生成嵌入的文本内容
   * @returns 数值化的向量表示（浮点数数组）
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    await this.initEmbeddingPipeline();
    const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }

  /**
   * 加载知识库
   * @param knowledgeBaseId 知识库ID
   */
  async loadKnowledgeBase(knowledgeBaseId: string): Promise<boolean> {
    // 检查知识库是否存在
    if (!this.indexes.has(knowledgeBaseId)) {
      throw new Error(`知识库 ${knowledgeBaseId} 不存在`);
    }
    return true;
  }



  /**
   * 检索与查询最相关的文档
   * @param knowledgeBaseId 知识库ID
   * @param query 用户的查询语句
   * @returns 包含相关内容和相关性分数的结果数组
   */
  private async retrieveRelevantDocs(knowledgeBaseId: string, query: string): Promise<RelevantDoc[]> {
    const index = this.indexes.get(knowledgeBaseId);
    const docs = this.documents.get(knowledgeBaseId);

    if (!index || !docs) {
      throw new Error(`知识库 ${knowledgeBaseId} 未初始化`);
    }

    // 生成查询的嵌入向量
    const queryEmbedding = await this.generateEmbedding(query);

    // 在 FAISS 中搜索相似文档
    const { distances, labels } = index.search(queryEmbedding, 3);

    return labels.map((label: number, i: number) => ({
      content: docs[label].pageContent,
      score: 1 - distances[i] // 将距离转换为相似度分数
    }));
  }

  /**
   * 完整的 RAG 流水线执行方法
   * 执行从检索到生成回答的完整流程
   * @param knowledgeBaseId 知识库ID
   * @param query 用户的查询语句
   * @returns 包含回答和引用来源的结果对象
   */
  async ragPipeline(knowledgeBaseId: string, query: string): Promise<{ answer: string; sources: string[] }> {
    // 1. 获取相关文档
    const relevantDocs = await this.retrieveRelevantDocs(knowledgeBaseId, query);

    // 2. 构建提示词
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;

    // 3. 使用搜索服务增强上下文
    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        type: 'text'
      }
    ];

    const enhancedMessages = await this.searchService.enhanceWithSearch(query, messages);

    // 4. 调用 LLM 生成最终回答
    const response = await this.llmProvider.chat(enhancedMessages, this.modelId);

    return {
      answer: response.content,
      sources: relevantDocs.map(doc => doc.content) // 返回引用的文档内容
    };
  }
} // end of RAGService class
