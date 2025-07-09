import {API_BASE_URL} from './api';
import {TransportAdapter, type TransportRequest, TransportType} from "../transports";
import type {KnowledgeDocument} from "../../../../share/knowledge.ts";


export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export class DocumentApi {
  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'fileParser'
  });


  /**
   * 搜索文档
   * @param query
   * @param documents
   */
  async searchDocuments( query: string, documents: KnowledgeDocument[]): Promise<Document[]> {
    const req: TransportRequest = { method: 'searchDocuments', payload: { documents, query } };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`搜索文档失败: ${res.error}`);
    return res.data;
  }

  async uploadDocuments(files: File[]): Promise<KnowledgeDocument[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const req: TransportRequest = { method: 'upload/documents', payload: formData };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`上传文档失败: ${res.error}`);

    return res.data;
  }

}

export const documentApi = new DocumentApi();