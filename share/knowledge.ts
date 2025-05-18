

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
  content?: string;
  createdAt: string;
  type: string;
}