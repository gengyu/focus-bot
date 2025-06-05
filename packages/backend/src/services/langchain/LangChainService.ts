import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { VectorStore } from 'langchain/vectorstores/base';
import { BaseDocumentLoader } from 'langchain/document_loaders/base';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { Embeddings } from 'langchain/embeddings/base';
import { Singleton } from '../../decorators/Singleton';
import { FileParserService } from '../FileParserService';
import { ConfigManager, appConfig } from '../vectorization/config';
import { LogManager } from '../vectorization/logging';
import { PerformanceMonitorImpl } from '../vectorization/performance';
import { VectorizationOptions, VectorizationResult, SearchResult } from '../vectorization/types';
import path from 'path';
import fs from 'fs';

/**
 * LangChain服务接口
 */
export interface LangChainServiceInterface {
  /**
   * 加载文档
   * @param filePath 文件路径
   * @returns 文档数组
   */
  loadDocument(filePath: string): Promise<Document[]>;

  /**
   * 分割文本
   * @param documents 文档数组
   * @param chunkSize 分块大小
   * @param chunkOverlap 分块重叠大小
   * @returns 分割后的文档数组
   */
  splitDocuments(documents: Document[], chunkSize?: number, chunkOverlap?: number): Promise<Document[]>;

  /**
   * 向量化文档
   * @param documents 文档数组
   * @param namespaceId 命名空间ID
   * @returns 向量化结果
   */
  vectorizeDocuments(documents: Document[], namespaceId: string): Promise<VectorizationResult>;

  /**
   * 搜索相似文档
   * @param query 查询文本
   * @param namespaceId 命名空间ID
   * @param topK 返回结果数量
   * @returns 搜索结果
   */
  searchSimilarDocuments(query: string, namespaceId: string, topK?: number): Promise<SearchResult[]>;

  /**
   * 获取向量存储
   * @param namespaceId 命名空间ID
   * @returns 向量存储
   */
  getVectorStore(namespaceId: string): Promise<VectorStore | null>;
}

/**
 * LangChain服务实现
 */
@Singleton()
export class LangChainService implements LangChainServiceInterface {
  private fileParserService: FileParserService;
  private configManager: ConfigManager;
  private logger: LogManager;
  private monitor: PerformanceMonitorImpl;
  private vectorStores: Map<string, VectorStore> = new Map();
  private embeddings: Embeddings;

  constructor() {
    this.fileParserService = FileParserService.getInstance();
    this.configManager = new ConfigManager();
    this.logger = new LogManager();
    this.monitor = new PerformanceMonitorImpl();
    
    // 根据配置初始化嵌入模型
    const modelConfig = this.configManager.getConfig().model;
    if (modelConfig.name.includes('openai')) {
      this.embeddings = new OpenAIEmbeddings();
    } else {
      this.embeddings = new HuggingFaceTransformersEmbeddings({
        modelName: modelConfig.name
      });
    }
  }

  /**
   * 获取适合文件类型的文档加载器
   * @param filePath 文件路径
   * @returns 文档加载器
   */
  private getDocumentLoader(filePath: string): BaseDocumentLoader {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        return new PDFLoader(filePath);
      case '.docx':
      case '.doc':
        return new DocxLoader(filePath);
      case '.csv':
        return new CSVLoader(filePath);
      case '.txt':
      case '.md':
      case '.js':
      case '.ts':
      case '.html':
      case '.css':
      case '.json':
      case '.xml':
        return new TextLoader(filePath);
      default:
        // 对于不支持的文件类型，使用FileParserService解析后创建文档
        return {
          async load(): Promise<Document[]> {
            const fileParserService = FileParserService.getInstance();
            const content = await fileParserService.parseFile(filePath);
            return [new Document({ pageContent: content })];
          }
        };
    }
  }

  /**
   * 加载文档
   * @param filePath 文件路径
   * @returns 文档数组
   */
  async loadDocument(filePath: string): Promise<Document[]> {
    try {
      const operationName = 'loadDocument';
      this.monitor.startOperation(operationName);
      
      this.logger.info('开始加载文档', { filePath });
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }
      
      // 获取适合的文档加载器
      const loader = this.getDocumentLoader(filePath);
      
      // 加载文档
      const documents = await loader.load();
      
      this.monitor.endOperation(operationName);
      const metrics = this.monitor.getMetrics();
      
      this.logger.info('文档加载完成', {
        filePath,
        documentCount: documents.length,
        processingTime: metrics[operationName]
      });
      
      return documents;
    } catch (error) {
      this.logger.error('文档加载失败', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 分割文本
   * @param documents 文档数组
   * @param chunkSize 分块大小
   * @param chunkOverlap 分块重叠大小
   * @returns 分割后的文档数组
   */
  async splitDocuments(
    documents: Document[],
    chunkSize: number = appConfig.defaultChunkSize,
    chunkOverlap: number = appConfig.defaultChunkOverlap
  ): Promise<Document[]> {
    try {
      const operationName = 'splitDocuments';
      this.monitor.startOperation(operationName);
      
      this.logger.info('开始分割文档', {
        documentCount: documents.length,
        chunkSize,
        chunkOverlap
      });
      
      // 创建文本分割器
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
      });
      
      // 分割文档
      const splitDocs: Document[] = [];
      for (const doc of documents) {
        const chunks = await splitter.splitDocuments([doc]);
        splitDocs.push(...chunks);
      }
      
      this.monitor.endOperation(operationName);
      const metrics = this.monitor.getMetrics();
      
      this.logger.info('文档分割完成', {
        originalDocumentCount: documents.length,
        splitDocumentCount: splitDocs.length,
        processingTime: metrics[operationName]
      });
      
      return splitDocs;
    } catch (error) {
      this.logger.error('文档分割失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 向量化文档
   * @param documents 文档数组
   * @param namespaceId 命名空间ID
   * @returns 向量化结果
   */
  async vectorizeDocuments(documents: Document[], namespaceId: string): Promise<VectorizationResult> {
    try {
      const operationName = 'vectorizeDocuments';
      this.monitor.startOperation(operationName);
      
      this.logger.info('开始向量化文档', {
        documentCount: documents.length,
        namespaceId
      });
      
      // 创建向量存储
      const vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );
      
      // 保存向量存储
      this.vectorStores.set(namespaceId, vectorStore);
      
      this.monitor.endOperation(operationName);
      const metrics = this.monitor.getMetrics();
      
      this.logger.info('文档向量化完成', {
        documentCount: documents.length,
        namespaceId,
        processingTime: metrics[operationName]
      });
      
      return {
        status: 'success',
        message: '文档向量化完成',
        vectorCount: documents.length
      };
    } catch (error) {
      this.logger.error('文档向量化失败', {
        error: error instanceof Error ? error.message : String(error),
        namespaceId
      });
      
      return {
        status: 'error',
        message: `文档向量化失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 搜索相似文档
   * @param query 查询文本
   * @param namespaceId 命名空间ID
   * @param topK 返回结果数量
   * @returns 搜索结果
   */
  async searchSimilarDocuments(query: string, namespaceId: string, topK: number = 3): Promise<SearchResult[]> {
    try {
      const operationName = 'searchSimilarDocuments';
      this.monitor.startOperation(operationName);
      
      this.logger.info('开始搜索相似文档', {
        query,
        namespaceId,
        topK
      });
      
      // 获取向量存储
      const vectorStore = this.vectorStores.get(namespaceId);
      if (!vectorStore) {
        throw new Error(`命名空间 ${namespaceId} 的向量存储不存在`);
      }
      
      // 搜索相似文档
      const results = await vectorStore.similaritySearch(query, topK);
      
      this.monitor.endOperation(operationName);
      const metrics = this.monitor.getMetrics();
      
      this.logger.info('相似文档搜索完成', {
        query,
        namespaceId,
        resultCount: results.length,
        processingTime: metrics[operationName]
      });
      
      // 转换为SearchResult格式
      return results.map(doc => ({
        document: {
          id: doc.metadata.id || `${namespaceId}-${Math.random().toString(36).substring(2, 9)}`,
          text: doc.pageContent,
          vector: [], // LangChain不直接暴露向量，这里返回空数组
          metadata: doc.metadata
        },
        score: doc.metadata.score || 1.0 // LangChain不直接暴露分数，这里使用元数据中的分数或默认值
      }));
    } catch (error) {
      this.logger.error('相似文档搜索失败', {
        error: error instanceof Error ? error.message : String(error),
        query,
        namespaceId
      });
      return [];
    }
  }

  /**
   * 获取向量存储
   * @param namespaceId 命名空间ID
   * @returns 向量存储
   */
  async getVectorStore(namespaceId: string): Promise<VectorStore | null> {
    return this.vectorStores.get(namespaceId) || null;
  }

  /**
   * 保存向量存储到文件
   * @param namespaceId 命名空间ID
   * @param directory 保存目录
   * @returns 是否保存成功
   */
  async saveVectorStore(namespaceId: string, directory: string): Promise<boolean> {
    try {
      const vectorStore = this.vectorStores.get(namespaceId);
      if (!vectorStore || !(vectorStore instanceof MemoryVectorStore)) {
        return false;
      }
      
      // 确保目录存在
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // 将MemoryVectorStore转换为FaissStore并保存
      const docs = await vectorStore.similaritySearch('', 1000); // 获取所有文档
      const faissStore = await FaissStore.fromDocuments(docs, this.embeddings);
      await faissStore.save(directory);
      
      return true;
    } catch (error) {
      this.logger.error('保存向量存储失败', {
        error: error instanceof Error ? error.message : String(error),
        namespaceId,
      });
      return false;
    }
  }

  /**
   * 加载向量存储从文件
   * @param namespaceId 命名空间ID
   * @param directory 加载目录
   * @returns 是否加载成功
   */
  async loadVectorStore(namespaceId: string, directory: string): Promise<boolean> {
    try {
      if (!fs.existsSync(directory)) {
        return false;
      }
      
      // 从文件加载FaissStore
      const faissStore = await FaissStore.load(directory, this.embeddings);
      this.vectorStores.set(namespaceId, faissStore);
      
      return true;
    } catch (error) {
      this.logger.error('加载向量存储失败', {
        error: error instanceof Error ? error.message : String(error),
        namespaceId,
      });
      return false;
    }
  }
}