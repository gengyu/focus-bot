

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  documents: Array<KnowledgeDocument>;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  path: string;
  size: number,
  createdAt: string;
  type: string;
  metadata: {
    originalName: string,
    mimeType: string,
    uploadedAt: string
  }
}



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
  description: string;
  config?: any;
  documents: Array<KnowledgeDocument>
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
