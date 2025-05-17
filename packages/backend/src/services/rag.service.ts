import {IndexFlatL2} from 'faiss-node';
import {pipeline} from '@xenova/transformers';
import {LLMProvider} from '../provider/LLMProvider';
import {ChatMessage} from '../../../../share/type';
import {SearchService} from './SearchService';
import {Document} from '../types/rag.types';
import {KnowledgeService} from "./knowledge.service.ts";

// Document 接口已移至 rag.types.ts

interface RelevantDoc {
  content: string;
  score: number;
}

/**
 * 基于检索增强生成(RAG)的服务类，实现了以下核心功能：
 * 1. 使用 Transformers.js 创建文本嵌入表示
 * 2. 利用 FAISS 进行高效向量相似性搜索
 * 3. 整合 LLMProvider 提供的语言模型能力
 * 4. 结合 SearchService 进行上下文增强
 */
export class RAGService {

  // private readonly searchService: SearchService;

  private readonly knowledgeService: KnowledgeService;


  /**
   * 构造函数初始化必要的依赖服务
   */
  constructor() {

    // this.searchService = new SearchService();
    this.knowledgeService = new KnowledgeService();
  }


  /**
   * 完整的 RAG 流水线执行方法
   * 执行从检索到生成回答的完整流程
   * @param knowledgeBaseId 知识库ID
   * @param query 用户的查询语句
   * @returns 包含回答和引用来源的结果对象
   */
  async ragPipeline(knowledgeBaseId: string, query: string): Promise<{ answer: string; sources: string[] }> {
    // 1. 获取相关文档
    const relevantDocs = await this.knowledgeService.retrieveRelevantDocs(knowledgeBaseId, query);

    // 2. 构建提示词
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    const prompt = `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。\n\n上下文：\n${context}\n\n问题：${query}`;

    return {
      answer: prompt,
      sources: relevantDocs.map(doc => doc.content) // 返回引用的文档内容
    };
  }
} // end of RAGService class
