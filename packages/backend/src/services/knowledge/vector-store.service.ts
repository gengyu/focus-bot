import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DocumentChunk, RetrievalResult, HighlightMatch, SearchOptions } from './types';
import { v4 as uuidv4 } from 'uuid';
import { CustomEmbeddings } from './custom-embeddings';
import { EmbeddingModel } from '../vectorization/types';

/**
 * 基于 LangChain 的向量存储服务
 * 提供文档向量化、存储和检索功能
 */
export class VectorStoreService {
  private vectorStores: Map<string, MemoryVectorStore> = new Map();
  private embeddings: CustomEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private documentChunks: Map<string, DocumentChunk[]> = new Map();

  constructor(
    model?: EmbeddingModel,
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ) {
    // 初始化自定义嵌入模型
    this.embeddings = new CustomEmbeddings(model);

    // 初始化文本分割器
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  /**
   * 创建或获取命名空间的向量存储
   */
  private async getOrCreateVectorStore(namespaceId: string): Promise<MemoryVectorStore> {
    if (!this.vectorStores.has(namespaceId)) {
      const vectorStore = new MemoryVectorStore(this.embeddings);
      this.vectorStores.set(namespaceId, vectorStore);
    }
    return this.vectorStores.get(namespaceId)!;
  }

  /**
   * 添加文档到向量存储
   */
  async addDocument(
    namespaceId: string,
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<DocumentChunk[]> {
    try {
      // 分割文档
      const docs = await this.textSplitter.createDocuments([content], [{
        ...metadata,
        documentId,
        source: metadata.source || documentId,
      }]);

      // 创建文档块
      const chunks: DocumentChunk[] = [];
      let currentChar = 0;

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const chunkId = uuidv4();
        const startChar = currentChar;
        const endChar = currentChar + doc.pageContent.length;

        const chunk: DocumentChunk = {
          id: chunkId,
          documentId,
          content: doc.pageContent,
          metadata: {
            ...doc.metadata,
            source: doc.metadata.source || documentId,
            chunkIndex: i,
            startChar,
            endChar,
          },
        };

        chunks.push(chunk);
        currentChar = endChar;
      }

      // 获取向量存储
      const vectorStore = await this.getOrCreateVectorStore(namespaceId);

      // 添加到向量存储
      await vectorStore.addDocuments(docs);

      // 存储文档块信息
      const existingChunks = this.documentChunks.get(namespaceId) || [];
      this.documentChunks.set(namespaceId, [...existingChunks, ...chunks]);

      return chunks;
    } catch (error) {
      throw new Error(`添加文档失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 搜索相似文档
   */
  async searchSimilar(
    namespaceId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<RetrievalResult[]> {
    try {
      const {
        topK = 5,
        similarityThreshold = 0.7,
        includeMetadata = true,
        highlightMatches = true,
        filters = {},
      } = options;

      const vectorStore = this.vectorStores.get(namespaceId);
      if (!vectorStore) {
        console.error(`向量存储未找到: ${namespaceId}`);
        return [];
      }

      // 执行相似性搜索
      const results = await vectorStore.similaritySearchWithScore(query, topK);

      // 获取文档块信息
      const chunks = this.documentChunks.get(namespaceId) || [];

      // 转换结果
      const retrievalResults: RetrievalResult[] = [];

      for (const [doc, score] of results) {
        // 过滤低相似度结果
        if (score < similarityThreshold) {
          continue;
        }

        // 查找对应的文档块
        const chunk = chunks.find(c => 
          c.content === doc.pageContent && 
          c.documentId === doc.metadata.documentId
        );

        if (!chunk) {
          continue;
        }

        // 应用过滤器
        if (Object.keys(filters).length > 0) {
          const matchesFilter = Object.entries(filters).every(([key, value]) => {
            return chunk.metadata[key] === value;
          });
          if (!matchesFilter) {
            continue;
          }
        }

        const result: RetrievalResult = {
          chunk,
          score,
        };

        // 添加高亮匹配
        if (highlightMatches) {
          result.highlights = this.findHighlights(query, chunk.content);
        }

        retrievalResults.push(result);
      }

      // 按相似度排序
      return retrievalResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      throw new Error(`搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 查找文本中的高亮匹配
   */
  private findHighlights(query: string, content: string): HighlightMatch[] {
    const highlights: HighlightMatch[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi');
      let match;

      while ((match = regex.exec(content)) !== null) {
        highlights.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          score: 1.0, // 简单的匹配分数
        });
      }
    }

    // 合并重叠的高亮
    return this.mergeOverlappingHighlights(highlights);
  }

  /**
   * 合并重叠的高亮匹配
   */
  private mergeOverlappingHighlights(highlights: HighlightMatch[]): HighlightMatch[] {
    if (highlights.length === 0) return [];

    // 按开始位置排序
    highlights.sort((a, b) => a.startIndex - b.startIndex);

    const merged: HighlightMatch[] = [highlights[0]];

    for (let i = 1; i < highlights.length; i++) {
      const current = highlights[i];
      const last = merged[merged.length - 1];

      // 如果重叠，合并
      if (current.startIndex <= last.endIndex) {
        last.endIndex = Math.max(last.endIndex, current.endIndex);
        last.text = last.text; // 保持原始文本
        last.score = Math.max(last.score, current.score);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * 删除文档
   */
  async removeDocument(namespaceId: string, documentId: string): Promise<boolean> {
    try {
      // 从文档块中移除
      const chunks = this.documentChunks.get(namespaceId) || [];
      const filteredChunks = chunks.filter(chunk => chunk.documentId !== documentId);
      this.documentChunks.set(namespaceId, filteredChunks);

      // 注意：MemoryVectorStore 不支持直接删除文档
      // 在生产环境中，建议使用支持删除操作的向量数据库
      console.warn('MemoryVectorStore 不支持删除操作，建议使用持久化向量数据库');

      return true;
    } catch (error) {
      throw new Error(`删除文档失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 删除命名空间
   */
  async removeNamespace(namespaceId: string): Promise<boolean> {
    try {
      this.vectorStores.delete(namespaceId);
      this.documentChunks.delete(namespaceId);
      return true;
    } catch (error) {
      throw new Error(`删除命名空间失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取命名空间统计信息
   */
  getNamespaceStats(namespaceId: string): {
    documentCount: number;
    chunkCount: number;
    hasVectorStore: boolean;
  } {
    const chunks = this.documentChunks.get(namespaceId) || [];
    const documentIds = new Set(chunks.map(chunk => chunk.documentId));

    return {
      documentCount: documentIds.size,
      chunkCount: chunks.length,
      hasVectorStore: this.vectorStores.has(namespaceId),
    };
  }

  /**
   * 检查命名空间是否存在
   */
  hasNamespace(namespaceId: string): boolean {
    return this.vectorStores.has(namespaceId);
  }

  /**
   * 获取所有命名空间
   */
  getAllNamespaces(): string[] {
    return Array.from(this.vectorStores.keys());
  }
}