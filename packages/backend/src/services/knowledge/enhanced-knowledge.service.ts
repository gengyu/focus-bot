import { FileParserService, ChunkingOptions, ParseResult } from '../FileParserService.ts';
import { VectorStoreService } from './vector-store.service.ts';
import { KnowledgeDocument, KnowledgeBase } from '../../../../../share/knowledge.ts';
import { AppSettingService } from '../AppSettingService.ts';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { 
  AddDocumentResult, 
  RetrievalResult, 
  SearchOptions, 
  KnowledgeBaseStats,
  FormattedRetrievalResult
} from './types.ts';
import { v4 as uuidv4 } from 'uuid';
import { Singleton } from '../../decorators/Singleton';

/**
 * 增强的知识库服务
 * 基于 LangChain 实现文档处理、向量化和检索功能
 */
@Singleton()
export class EnhancedKnowledgeService {
  private vectorStoreService: VectorStoreService;
  private fileParserService: FileParserService;
  private appSettingService: AppSettingService;
  private knowledgeBases: Map<string, KnowledgeBaseConfig> = new Map();
  private documents: Map<string, Map<string, EnhancedKnowledgeDocument>> = new Map();

  constructor() {
    this.vectorStoreService = new VectorStoreService();
    this.fileParserService = FileParserService.getInstance();
    this.appSettingService = new AppSettingService();
  }

  /**
   * 创建知识库
   */
  async createKnowledgeBase(
    namespaceId: string,
    name: string,
    description: string = '',
    config: Partial<KnowledgeBaseConfig> = {}
  ): Promise<void> {
    const defaultConfig: KnowledgeBaseConfig = {
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'text-embedding-3-small',
      similarityThreshold: 0.7,
      maxResults: 10,
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.knowledgeBases.set(namespaceId, finalConfig);
    this.documents.set(namespaceId, new Map());

    // 保存到AppSetting
    const knowledgeBase: KnowledgeBase = {
      id: namespaceId,
      name,
      description,
      documentCount: 0,
      createdAt: new Date().toISOString(),
      documents: []
    };
    
    await this.appSettingService.addKnowledgeBase(knowledgeBase);
  }

  /**
   * 删除知识库
   */
  async deleteKnowledgeBase(namespaceId: string): Promise<boolean> {
    try {
      await this.vectorStoreService.removeNamespace(namespaceId);
      this.knowledgeBases.delete(namespaceId);
      this.documents.delete(namespaceId);
      
      // 从AppSetting中删除
      await this.appSettingService.removeKnowledgeBase(namespaceId);
      
      return true;
    } catch (error) {
      console.error(`删除知识库失败: ${error}`);
      return false;
    }
  }

  /**
   * 添加文档到知识库
   * @param namespaceId 命名空间ID
   * @param document 知识文档
   * @param chunkingOptions 分块选项
   * @returns 处理结果
   */
  public async addDocument(
    namespaceId: string,
    document: KnowledgeDocument,
    chunkingOptions?: ChunkingOptions
  ): Promise<AddDocumentResult> {
    try {
      // 确保知识库存在
      if (!this.knowledgeBases.has(namespaceId)) {
        await this.createKnowledgeBase(namespaceId);
      }

      // 使用 LangChain 解析文档
      const parseResult: ParseResult = await this.fileParserService.parseDocumentWithLangChain(
        document.path,
        chunkingOptions
      );
      
      if (!parseResult.content || parseResult.content.trim().length === 0) {
        return {
          success: false,
          error: '文档内容为空',
          documentId: document.id
        };
      }

      if (!parseResult.chunks || parseResult.chunks.length === 0) {
        return {
          success: false,
          error: '文档分块失败',
          documentId: document.id
        };
      }

      // 为每个分块添加增强的元数据
      const enhancedChunks = parseResult.chunks.map((chunk, index) => {
        const chunkId = `${document.id}_chunk_${index}`;
        return new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            // 文档基本信息
            documentId: document.id,
            documentName: document.name,
            documentType: document.type || 'unknown',
            documentPath: document.path,
            // 分块信息
            chunkId,
            chunkIndex: index,
            totalChunks: parseResult.chunks!.length,
            chunkSize: chunk.pageContent.length,
            // 时间戳
            addedAt: new Date().toISOString(),
            // 原始文档元数据
            originalMetadata: parseResult.metadata,
            // 用户自定义元数据
            ...document.metadata
          }
        });
      });

      // 添加到向量存储
      for (const chunk of enhancedChunks) {
        await this.vectorStoreService.addDocument(
          namespaceId,
          chunk.metadata.documentId || document.id,
          chunk.pageContent,
          chunk.metadata
        );
      }

      // 更新文档记录
      const namespaceDocuments = this.documents.get(namespaceId)!;
      const enhancedDoc: EnhancedKnowledgeDocument = {
        ...document,
        content: parseResult.content,
        chunks: enhancedChunks,
        metadata: {
          originalName: document.name,
          fileType: document.type,
          fileSize: document.size,
          addedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          // 保存解析结果的元数据
          parseMetadata: parseResult.metadata
        }
      };
      namespaceDocuments.set(document.id, enhancedDoc);

      // 更新AppSetting中的知识库信息
      await this.updateKnowledgeBaseInAppSetting(namespaceId);

      console.log(`文档 ${document.name} 已添加到知识库 ${namespaceId}，创建了 ${enhancedChunks.length} 个分块`);

      return {
        success: true,
        documentId: document.id,
        chunksCreated: enhancedChunks.length,
        message: `成功添加文档，创建了 ${enhancedChunks.length} 个分块`,
        parseResult // 返回解析结果供调用者使用
      };
    } catch (error) {
      console.error('添加文档失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        documentId: document.id
      };
    }
  }

  /**
   * 批量添加文档
   */
  async addDocuments(
    namespaceId: string,
    documents: KnowledgeDocument[]
  ): Promise<BatchProcessResult> {
    const results: DocumentProcessResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const document of documents) {
      const result = await this.addDocument(namespaceId, document);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      totalDocuments: documents.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * 搜索相关文档
   */
  async searchDocuments(
    namespaceId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<RetrievalResult[]> {
    try {
      // 获取知识库配置
      const config = this.knowledgeBases.get(namespaceId);
      if (!config) {
        throw new Error(`知识库 ${namespaceId} 不存在`);
      }

      // 合并搜索选项
      const searchOptions: SearchOptions = {
        topK: config.maxResults,
        similarityThreshold: config.similarityThreshold,
        includeMetadata: true,
        highlightMatches: true,
        ...options,
      };

      // 执行搜索
      const results = await this.vectorStoreService.searchSimilar(
        namespaceId,
        query,
        searchOptions
      );

      return results;
    } catch (error) {
      throw new Error(`搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文档详情
   */
  getDocument(namespaceId: string, documentId: string): EnhancedKnowledgeDocument | undefined {
    const namespaceDocuments = this.documents.get(namespaceId);
    return namespaceDocuments?.get(documentId);
  }

  /**
   * 获取知识库中的所有文档
   */
  getDocuments(namespaceId: string): EnhancedKnowledgeDocument[] {
    const namespaceDocuments = this.documents.get(namespaceId);
    return namespaceDocuments ? Array.from(namespaceDocuments.values()) : [];
  }

  /**
   * 删除文档
   */
  async removeDocument(namespaceId: string, documentId: string): Promise<boolean> {
    try {
      // 从向量存储中删除
      await this.vectorStoreService.removeDocument(namespaceId, documentId);

      // 从文档映射中删除
      const namespaceDocuments = this.documents.get(namespaceId);
      if (namespaceDocuments) {
        namespaceDocuments.delete(documentId);
      }

      // 更新AppSetting中的知识库信息
      await this.updateKnowledgeBaseInAppSetting(namespaceId);

      return true;
    } catch (error) {
      console.error(`删除文档失败: ${error}`);
      return false;
    }
  }

  /**
   * 获取知识库统计信息
   */
  getKnowledgeBaseStats(namespaceId: string): {
    config: KnowledgeBaseConfig | undefined;
    documentCount: number;
    chunkCount: number;
    vectorStoreStats: {
      documentCount: number;
      chunkCount: number;
      hasVectorStore: boolean;
    };
  } {
    const config = this.knowledgeBases.get(namespaceId);
    const documents = this.getDocuments(namespaceId);
    const vectorStoreStats = this.vectorStoreService.getNamespaceStats(namespaceId);

    const totalChunks = documents.reduce((sum, doc) => {
      return sum + (doc.chunks?.length || 0);
    }, 0);

    return {
      config,
      documentCount: documents.length,
      chunkCount: totalChunks,
      vectorStoreStats,
    };
  }

  /**
   * 获取所有知识库
   */
  async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    return await this.appSettingService.getKnowledgeBases();
  }

  /**
   * 获取所有知识库ID
   */
  getAllKnowledgeBaseIds(): string[] {
    return Array.from(this.knowledgeBases.keys());
  }

  /**
   * 更新AppSetting中的知识库信息
   */
  private async updateKnowledgeBaseInAppSetting(namespaceId: string): Promise<void> {
    try {
      const knowledgeBase = await this.appSettingService.getKnowledgeBase(namespaceId);
      if (!knowledgeBase) {
        return;
      }

      // 获取当前文档列表
      const documents = this.getDocuments(namespaceId);
      const knowledgeDocuments: KnowledgeDocument[] = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        path: doc.path,
        size: doc.size || 0,
        content: doc.content,
        createdAt: doc.metadata?.addedAt || new Date().toISOString(),
        type: doc.type || 'unknown',
        metadata: doc.metadata || {}
      }));

      // 更新知识库信息
      const updatedKnowledgeBase: KnowledgeBase = {
        ...knowledgeBase,
        documentCount: documents.length,
        documents: knowledgeDocuments
      };

      await this.appSettingService.updateKnowledgeBase(updatedKnowledgeBase);
    } catch (error) {
      console.error('更新知识库信息失败:', error);
    }
  }

  /**
   * 更新知识库配置
   */
  updateKnowledgeBaseConfig(
    namespaceId: string,
    config: Partial<KnowledgeBaseConfig>
  ): boolean {
    const existingConfig = this.knowledgeBases.get(namespaceId);
    if (!existingConfig) {
      return false;
    }

    const updatedConfig = { ...existingConfig, ...config };
    this.knowledgeBases.set(namespaceId, updatedConfig);
    return true;
  }

  /**
   * 格式化检索结果为显示格式
   */
  formatRetrievalResults(results: RetrievalResult[]): Array<{
    content: string;
    score: number;
    source: string;
    highlights: string;
    metadata: Record<string, any>;
  }> {
    return results.map(result => {
      const { chunk, score, highlights } = result;
      
      // 生成高亮内容
      let highlightedContent = chunk.content;
      if (highlights && highlights.length > 0) {
        // 从后往前替换，避免索引偏移
        const sortedHighlights = highlights.sort((a, b) => b.startIndex - a.startIndex);
        for (const highlight of sortedHighlights) {
          const before = highlightedContent.substring(0, highlight.startIndex);
          const highlighted = `<mark>${highlight.text}</mark>`;
          const after = highlightedContent.substring(highlight.endIndex);
          highlightedContent = before + highlighted + after;
        }
      }

      return {
        content: highlightedContent,
        score: Math.round(score * 100) / 100, // 保留两位小数
        source: chunk.metadata.source || chunk.documentId,
        highlights: highlights?.map(h => h.text).join(', ') || '',
        metadata: chunk.metadata,
      };
    });
  }
}