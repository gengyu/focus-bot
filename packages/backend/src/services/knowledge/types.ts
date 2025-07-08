import { Document } from 'langchain/document';

/**
 * 文档片段接口
 * 用于存储分块后的文档内容
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    [key: string]: any;
  };
  embedding?: number[];
}

/**
 * 检索结果接口
 * 包含匹配的文档片段和相似度分数
 */
export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  highlights?: HighlightMatch[];
}

/**
 * 高亮匹配接口
 * 用于标记匹配的文本片段
 */
export interface HighlightMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

/**
 * 知识库文档接口
 * 扩展原有的 KnowledgeDocument
 */
export interface EnhancedKnowledgeDocument {
  id: string;
  name: string;
  path: string;
  type?: string;
  size?: number;
  createdAt?: string;
  content: string;
  chunks: any[]; // Document[] from LangChain
  metadata: {
    originalName: string;
    fileType?: string;
    fileSize?: number;
    addedAt: string;
    lastModified: string;
    parseMetadata?: any;
    [key: string]: any;
  };
}

/**
 * 知识库配置接口
 */
export interface KnowledgeBaseConfig {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  similarityThreshold: number;
  maxResults: number;
}

/**
 * 文档处理结果接口
 */
export interface AddDocumentResult {
  success: boolean;
  documentId: string;
  chunksCreated?: number;
  error?: string;
  message?: string;
  parseResult?: any; // ParseResult from FileParserService
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
  highlightMatches?: boolean;
  filters?: Record<string, any>;
}

/**
 * 批量处理结果接口
 */
export interface BatchProcessResult {
  totalDocuments: number;
  successCount: number;
  failureCount: number;
  results: AddDocumentResult[];
}

/**
 * 文档处理结果接口（向后兼容）
 */
export interface DocumentProcessResult extends AddDocumentResult {}