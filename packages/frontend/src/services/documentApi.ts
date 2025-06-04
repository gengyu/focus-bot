import { API_BASE_URL } from './api';
import { TransportAdapter, type TransportRequest, TransportType } from "../transports";
import type {KnowledgeBase, KnowledgeDocument} from "../../../../share/knowledge.ts";



export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export class DocumentsApi {
  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'fileParser'
  });


  async searchDocuments(kbId: string, query: string): Promise<Document[]> {
    const req: TransportRequest = { method: 'searchDocuments', payload: { id: kbId, query } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`搜索文档失败: ${res.error}`);
    return res.data;
  }

  async uploadDocuments(kbId: string, files: File[]): Promise<KnowledgeDocument[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('id', kbId);
    const req: TransportRequest = { method: 'upload/documents', payload: formData };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`上传文档失败: ${res.error}`);

    return res.data;
  }

}

export const documentsApi = new DocumentsApi();