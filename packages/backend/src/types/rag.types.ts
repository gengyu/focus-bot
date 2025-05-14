import { Document } from 'langchain/document';

export interface RAGRequest {
  query: string;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
}

export interface PrepareKnowledgeBaseRequest {
  documents: Document[];
}

export interface PrepareKnowledgeBaseResponse {
  message: string;
}

export interface InitResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
} 