import { API_BASE_URL } from './api';
import { TransportAdapter, type TransportRequest, TransportType } from "../transports";

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export class KnowledgeAPI {
  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'knowledge-bases'
  });

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const req: TransportRequest = { method: 'getKnowledgeBases', payload: {} };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`获取知识库列表失败: ${res.error}`);
    return res.data;
  }

  async createKnowledgeBase(request: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const req: TransportRequest = { method: 'createKnowledgeBase', payload: request };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`创建知识库失败: ${res.error}`);
    return res.data;
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    const req: TransportRequest = { method: 'deleteKnowledgeBase', payload: { id } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`删除知识库失败: ${res.error}`);
  }

  async uploadDocuments(kbId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('id', kbId);
    const req: TransportRequest = { method: 'upload/documents', payload: formData };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`上传文档失败: ${res.error}`);

    // const response = await fetch(`${API_BASE_URL}/knowledge-bases/${kbId}/documents`, {
    //   method: 'POST',
    //   body: formData,
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`上传文档失败: ${response.statusText}`);
    // }
    //
    // const result = await response.json();
    // if (!result.success) {
    //   throw new Error(`上传文档失败: ${result.error}`);
    // }
  }

  async chat(kbId: string, query: string): Promise<ChatResponse> {
    const req: TransportRequest = { 
      method: 'chat', 
      payload: { id: kbId, query } 
    };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`知识库对话失败: ${res.error}`);
    return res.data;
  }
}

export const knowledgeAPI = new KnowledgeAPI(); 