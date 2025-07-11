import {API_BASE_URL, callAPI} from './api';
import {TransportAdapter, type TransportRequest, TransportType} from "../transports";
import type {KnowledgeBase} from "../../../../share/knowledge.ts";

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  config?: any;
}

export interface KnowledgeBaseStats {
  id: string;
  name: string;
  documentCount: number;
  chunkCount: number;
  config: any;
}

export interface KnowledgeBaseDetail {
  id: string;
  stats: {
    documentCount: number;
    chunkCount: number;
    config: any;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    chunks: number;
    addedAt: string;
    lastModified: string;
  }>;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    [key: string]: any;
  };
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  searchOptions: {
    topK: number;
    similarityThreshold: number;
    includeMetadata: boolean;
    highlightMatches: boolean;
  };
}

export interface UploadResponse {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    fileName: string;
    documentId?: string;
    success: boolean;
    chunksCreated: number;
    error?: string;
    message?: string;
  }>;
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  context: string[];
}

// 创建文档
export const knowledgeUploadDocuments =(
  namespaceId: string,
  files: File[],
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
  }
)=> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('namespaceId', namespaceId);
  if (options?.chunkSize) {
    formData.append('chunkSize', options.chunkSize.toString());
  }
  if (options?.chunkOverlap) {
    formData.append('chunkOverlap', options.chunkOverlap.toString());
  }

  return callAPI({ method: '/api/knowledge/upload', payload: formData })
}

export class KnowledgeApi {
  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'api/knowledge'
  });

  /**
   * 创建知识库
   */
  async createKnowledgeBase(request: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const req: TransportRequest = { method: 'create', payload: request };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`创建知识库失败: ${res.error}`);
    return res.data;
  }

  /**
   * 获取知识库列表
   */
  async getKnowledgeBases(): Promise<KnowledgeBaseStats[]> {
    const req: TransportRequest = { method: 'list', payload: {} };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`获取知识库列表失败: ${res.error}`);
    return res.data;
  }

  /**
   * 获取知识库详情
   */
  async getKnowledgeBaseDetail(id: string): Promise<KnowledgeBaseDetail> {
    const req: TransportRequest = { method: 'detail', payload: { id } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`获取知识库详情失败: ${res.error}`);
    return res.data;
  }

  /**
   * 删除知识库
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    const req: TransportRequest = { method: 'delete', payload: { id } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`删除知识库失败: ${res.error}`);
  }

  /**
   * 更新知识库名称
   */
  async updateKnowledgeBaseName(id: string, name: string): Promise<void> {
    const req: TransportRequest = { method: 'name/update', payload: { id, name } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`更新知识库名称失败: ${res.error}`);
  }

  /**
   * 删除知识库文档
   */
  async deleteKnowledgeBaseDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
    const req: TransportRequest = { method: 'document/delete', payload: { knowledgeBaseId, documentId } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`删除文档失败: ${res.error}`);
  }

  /**
   * 上传文档到知识库
   */
  async uploadDocuments(
    namespaceId: string,
    files: File[],
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('namespaceId', namespaceId);
    if (options?.chunkSize) {
      formData.append('chunkSize', options.chunkSize.toString());
    }
    if (options?.chunkOverlap) {
      formData.append('chunkOverlap', options.chunkOverlap.toString());
    }

    const req: TransportRequest = { method: 'upload', payload: formData };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`上传文档失败: ${res.error}`);
    return res.data;
  }

  /**
   * 搜索知识库
   */
  async searchKnowledgeBase(
    namespaceId: string,
    query: string,
    options?: {
      topK?: number;
      similarityThreshold?: number;
      includeMetadata?: boolean;
      highlightMatches?: boolean;
    }
  ): Promise<SearchResponse> {
    const req: TransportRequest = {
      method: 'search',
      payload: {
        namespaceId,
        query,
        ...options
      }
    };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`搜索知识库失败: ${res.error}`);
    return res.data;
  }

  /**
   * 删除文档
   */
  async deleteDocument(namespaceId: string, documentId: string): Promise<boolean> {
    const req: TransportRequest = {
      method: 'document/delete',
      payload: { namespaceId, documentId }
    };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`删除文档失败: ${res.error}`);
    return res.data;
  }

  // /**
  //  * 删除知识库
  //  */
  // async deleteKnowledgeBase(namespaceId: string): Promise<boolean> {
  //   const req: TransportRequest = {
  //     method: 'delete',
  //     payload: { id: namespaceId }
  //   };
  //   const res = await this.transport.invokeDirect(req);
  //   if (!res.success) throw new Error(`删除知识库失败: ${res.error}`);
  //   return res.data;
  // }

  /**
   * 更新知识库配置
   */
  async updateKnowledgeBaseConfig(namespaceId: string, config: any): Promise<any> {
    const req: TransportRequest = {
      method: 'config/update',
      payload: { id: namespaceId, config }
    };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`更新配置失败: ${res.error}`);
    return res.data;
  }

  /**
   * RAG 聊天
   */
  async chatWithKnowledge(
    namespaceId: string,
    query: string,
    options?: {
      topK?: number;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatResponse> {
    const req: TransportRequest = {
      method: 'chat',
      payload: {
        namespaceId,
        query,
        ...options
      }
    };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`知识库聊天失败: ${res.error}`);
    return res.data;
  }
}

export const knowledgeApi = new KnowledgeApi();