import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { LLMProvider } from '../provider/LLMProvider';
import { ChatMessage } from '../../../../share/type';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export class RAGService {
  private pinecone: Pinecone | null = null;
  private llmProvider: LLMProvider;
  private index: any;
  private modelId: string;

  constructor(llmProvider: LLMProvider, modelId: string = 'gpt-3.5-turbo') {
    this.llmProvider = llmProvider;
    this.modelId = modelId;
  }

  async initialize() {
    try {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });
      
      this.index = this.pinecone.Index(process.env.PINECONE_INDEX!);
      console.log('RAG service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  private createChatMessage(role: 'user' | 'system', content: string): ChatMessage {
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'text',
      role,
      content,
    };
  }

  async prepareKnowledgeBase(documents: Document[]) {
    try {
      if (!this.pinecone) {
        throw new Error('Pinecone client not initialized');
      }

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await textSplitter.splitDocuments(documents);
      
      for (const chunk of chunks) {
        // 使用 LLM Provider 生成嵌入
        const embeddingResponse = await this.llmProvider.chat([
          this.createChatMessage('user', `Generate an embedding for the following text: ${chunk.pageContent}`)
        ], this.modelId);

        const embedding = JSON.parse(embeddingResponse.content || '[]');
        
        await this.index.upsert({
          vectors: [{
            id: chunk.metadata.id || uuidv4(),
            values: embedding,
            metadata: {
              text: chunk.pageContent,
              source: chunk.metadata.source,
            },
          }],
        });
      }
      
      console.log('Knowledge base prepared successfully');
    } catch (error) {
      console.error('Failed to prepare knowledge base:', error);
      throw error;
    }
  }

  async retrieveRelevantDocs(query: string, topK: number = 5) {
    try {
      if (!this.pinecone) {
        throw new Error('Pinecone client not initialized');
      }

      // 使用 LLM Provider 生成查询嵌入
      const embeddingResponse = await this.llmProvider.chat([
        this.createChatMessage('user', `Generate an embedding for the following query: ${query}`)
      ], this.modelId);

      const queryEmbedding = JSON.parse(embeddingResponse.content || '[]');
      
      const results = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return results.matches.map((match: any) => ({
        text: match.metadata.text,
        source: match.metadata.source,
        score: match.score,
      }));
    } catch (error) {
      console.error('Failed to retrieve documents:', error);
      throw error;
    }
  }

  async generateAnswer(query: string, relevantDocs: any[]) {
    try {
      const context = relevantDocs.map(doc => doc.text).join('\n');
      
      const messages: ChatMessage[] = [
        this.createChatMessage('system', '你是一个基于知识库的问答助手。请根据提供的上下文回答问题，并引用信息来源。'),
        this.createChatMessage('user', `用户查询: ${query}\n相关上下文: ${context}`)
      ];

      const response = await this.llmProvider.chat(messages, this.modelId);
      
      return {
        answer: response.content,
        sources: relevantDocs.map(doc => doc.source),
      };
    } catch (error) {
      console.error('Failed to generate answer:', error);
      throw error;
    }
  }

  async ragPipeline(query: string) {
    try {
      const relevantDocs = await this.retrieveRelevantDocs(query);
      const result = await this.generateAnswer(query, relevantDocs);
      return result;
    } catch (error) {
      console.error('RAG pipeline failed:', error);
      throw error;
    }
  }
} 