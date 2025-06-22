import { DocumentService } from "./DocumentService.ts";
import { LangChainRAGService } from "./langchain/LangChainRAGService";

// Document 接口已移至 rag.types.ts

interface RelevantDoc {
  content: string;
  score: number;
}

/**
 * 基于检索增强生成(RAG)的服务类，实现了以下核心功能：
 * 1. 使用 LangChain 创建文本嵌入表示
 * 2. 利用 LangChain 的向量存储进行高效向量相似性搜索
 * 3. 整合 LangChain 提供的语言模型能力
 * 4. 结合 SearchService 进行上下文增强
 */
export class RAGService {

  private readonly documentService: DocumentService;
  private readonly langChainRAGService: LangChainRAGService;

  /**
   * 构造函数初始化必要的依赖服务
   */
  constructor() {
    this.documentService = new DocumentService();
    this.langChainRAGService = new LangChainRAGService();
  }

  /**
   * 完整的 RAG 流水线执行方法
   * 执行从检索到生成回答的完整流程
   * @param knowledgeBaseId 知识库ID
   * @param query 用户的查询语句
   * @returns 包含回答和引用来源的结果对象
   */
  async ragPipeline(knowledgeBaseId: string, query: string): Promise<{ answer: string; sources: string[] }> {
    try {
      // 1. 获取相关文档
      const relevantDocs = await this.documentService.retrieveRelevantDocs(query, [], 3);

      // 如果没有找到相关文档，使用 LangChain 的 RAG 服务
      if (relevantDocs.length === 0) {
        return await this.langChainRAGService.ragPipeline(query, knowledgeBaseId);
      }

      // 2. 构建提示词
      const context = relevantDocs.map(result => result.content).join('\n\n');
      const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;

      // 3. 使用 LangChain 的 RAG 服务生成回答
      return {
        answer: prompt,
        sources: relevantDocs.map(result => result.content) // 返回引用的文档内容
      };
    } catch (error) {
      console.error('RAG 流水线执行失败:', error);
      return {
        answer: `抱歉，处理您的问题时出现错误: ${error instanceof Error ? error.message : String(error)}`,
        sources: []
      };
    }
  }
} // end of RAGService class
