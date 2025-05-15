import { Pinecone } from '@pinecone-database/pinecone';
import { LLMProvider } from '../provider/LLMProvider';
import { ChatMessage } from '../../../../share/type';
import { SearchService } from './SearchService';
// faiss-node 、 ANN 、nedb、lowdb
interface Document {
  pageContent: string;
  metadata: {
    id: string;
    source: string;
    [key: string]: any;
  };
}

interface RelevantDoc {
  content: string;
  score: number;
}

export class RAGService {
  private readonly llmProvider: LLMProvider;
  private readonly searchService: SearchService;
  private pinecone: Pinecone | null = null;
  private readonly modelId: string = 'gpt-3.5-turbo';

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
    this.searchService = new SearchService();
  }

  async prepareKnowledgeBase(documents: Document[]) {
    if (!this.pinecone) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || '',
      });
    }

    const index = this.pinecone.Index(process.env.PINECONE_INDEX || '');
    
    // 将文档分块
    const chunks = this.splitDocuments(documents);
    
    // 为每个块生成嵌入向量
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.pageContent);
      
      // 存储到 Pinecone
      await index.upsert([{
        id: chunk.metadata.id,
        values: embedding,
        metadata: chunk.metadata
      }]);
    }
  }

  private splitDocuments(documents: Document[]): Document[] {
    const chunks: Document[] = [];
    
    for (const doc of documents) {
      // 简单的按段落分割
      const paragraphs = doc.pageContent.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          chunks.push({
            pageContent: paragraph,
            metadata: {
              ...doc.metadata,
              id: `${doc.metadata.id}-${chunks.length}`
            }
          });
        }
      }
    }
    
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.llmProvider.chat([
      {
        id: Date.now().toString(),
        role: 'user',
        content: `Generate an embedding for the following text: ${text}`,
        timestamp: Date.now(),
        type: 'text'
      }
    ], this.modelId);
    
    return JSON.parse(response.content || '[]');
  }

  private async retrieveRelevantDocs(query: string): Promise<RelevantDoc[]> {
    if (!this.pinecone) {
      throw new Error('Pinecone client not initialized');
    }

    const index = this.pinecone.Index(process.env.PINECONE_INDEX || '');
    
    // 生成查询的嵌入向量
    const queryEmbedding = await this.generateEmbedding(query);
    
    // 在 Pinecone 中搜索相似文档
    const results = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true
    });
    
    return results.matches.map(match => ({
      content: match.metadata?.content as string,
      score: match.score || 0
    }));
  }

  async ragPipeline(query: string): Promise<{ answer: string; sources: string[] }> {
    // 1. 获取相关文档
    const relevantDocs = await this.retrieveRelevantDocs(query);
    
    // 2. 构建提示
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;
    
    // 3. 使用搜索服务增强上下文
    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        type: 'text'
      }
    ];
    
    const enhancedMessages = await this.searchService.enhanceWithSearch(query, messages);
    
    // 4. 调用 LLM 生成回答
    const response = await this.llmProvider.chat(enhancedMessages, this.modelId);
    
    return {
      answer: response.content,
      sources: relevantDocs.map(doc => doc.content)
    };
  }
} 