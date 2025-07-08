import { EnhancedKnowledgeService } from "./knowledge/enhanced-knowledge.service.ts";
import { SearchOptions } from "./knowledge/types.ts";

/**
 * RAG服务 - 简化版本
 * 主要功能已迁移到 EnhancedKnowledgeService
 * 保留此服务用于向后兼容
 * @deprecated 建议直接使用 EnhancedKnowledgeService
 */
export class RAGService {
  private knowledgeService: EnhancedKnowledgeService;

  constructor() {
    this.knowledgeService = new EnhancedKnowledgeService();
  }

  /**
   * RAG流水线 - 简化版本
   * @param knowledgeBaseId 知识库ID
   * @param query 用户查询
   * @returns 包含答案和来源的结果
   * @deprecated 建议使用 EnhancedKnowledgeService.searchDocuments
   */
  async ragPipeline(knowledgeBaseId: string, query: string): Promise<{ answer: string; sources: string[] }> {
    try {
      // 检查知识库是否存在
      const knowledgeBases = this.knowledgeService.getAllKnowledgeBases();
      if (!knowledgeBases.includes(knowledgeBaseId)) {
        return {
          answer: '指定的知识库不存在',
          sources: []
        };
      }

      // 搜索相关文档
      const searchOptions: SearchOptions = {
        topK: 3,
        similarityThreshold: 0.3,
        includeMetadata: true,
        highlightMatches: false
      };

      const searchResults = await this.knowledgeService.searchDocuments(
        knowledgeBaseId,
        query,
        searchOptions
      );

      // 格式化结果
      const formattedResults = this.knowledgeService.formatRetrievalResults(searchResults);
      
      if (formattedResults.length === 0) {
        return {
          answer: '未找到相关信息',
          sources: []
        };
      }

      // 构建上下文
      const context = formattedResults.map(result => result.content).join('\n\n');
      const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;

      return {
        answer: prompt,
        sources: formattedResults.map(result => result.source || result.content)
      };
    } catch (error) {
      console.error('RAG流水线执行失败:', error);
      return {
        answer: `处理查询时发生错误: ${(error as Error).message}`,
        sources: []
      };
    }
  }
}
