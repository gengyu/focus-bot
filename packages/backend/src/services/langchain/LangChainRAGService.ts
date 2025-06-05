import { Document } from 'langchain/document';
import { BaseChain } from 'langchain/chains';
import { BaseLanguageModel } from 'langchain/base_language';
import { OpenAI } from 'langchain/llms/openai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Ollama } from 'langchain/llms/ollama';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnableSequence } from 'langchain/schema/runnable';
import { formatDocumentsAsString } from 'langchain/util/document';
import { LangChainService } from './LangChainService';
import { Singleton } from '../../decorators/Singleton';
import { LogManager } from '../vectorization/logging';
import { PerformanceMonitorImpl } from '../vectorization/performance';
import { AppSettingService } from '../AppSettingService';
import { ProviderId } from '../../../../../share/type';

/**
 * LangChain RAG服务接口
 */
export interface LangChainRAGServiceInterface {
  /**
   * 执行RAG流水线
   * @param query 用户查询
   * @param namespaceId 命名空间ID
   * @param topK 返回结果数量
   * @returns 包含回答和引用来源的结果对象
   */
  ragPipeline(query: string, namespaceId: string, topK?: number): Promise<{ answer: string; sources: string[] }>;
}

/**
 * LangChain RAG服务实现
 */
@Singleton()
export class LangChainRAGService implements LangChainRAGServiceInterface {
  private langChainService: LangChainService;
  private logger: LogManager;
  private monitor: PerformanceMonitorImpl;
  private appSettingService: AppSettingService;

  constructor() {
    this.langChainService = new LangChainService();
    this.logger = new LogManager();
    this.monitor = new PerformanceMonitorImpl();
    this.appSettingService = new AppSettingService();
  }

  /**
   * 获取语言模型
   * @returns 语言模型
   */
  private async getLanguageModel(): Promise<BaseLanguageModel> {
    try {
      // 获取应用设置中的提供商配置
      const providers = await this.appSettingService.getProviderConfig();
      const defaultProvider = providers.find(p => p.isDefault);
      
      if (!defaultProvider) {
        // 默认使用OpenAI
        return new ChatOpenAI({
          modelName: 'gpt-3.5-turbo',
          temperature: 0
        });
      }
      
      // 根据提供商类型创建相应的语言模型
      switch (defaultProvider.id) {
        case ProviderId.openai:
        case ProviderId.aliyun:
          return new ChatOpenAI({
            modelName: defaultProvider.modelId || 'gpt-3.5-turbo',
            temperature: 0,
            openAIApiKey: defaultProvider.apiKey,
            configuration: {
              baseURL: defaultProvider.baseUrl
            }
          });
        case ProviderId.ollama:
          return new Ollama({
            baseUrl: defaultProvider.baseUrl || 'http://localhost:11434',
            model: defaultProvider.modelId || 'llama2'
          });
        default:
          return new ChatOpenAI({
            modelName: 'gpt-3.5-turbo',
            temperature: 0
          });
      }
    } catch (error) {
      this.logger.error('获取语言模型失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // 出错时使用默认模型
      return new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0
      });
    }
  }

  /**
   * 创建RAG链
   * @param namespaceId 命名空间ID
   * @returns RAG链
   */
  private async createRAGChain(namespaceId: string): Promise<BaseChain> {
    // 获取向量存储
    const vectorStore = await this.langChainService.getVectorStore(namespaceId);
    if (!vectorStore) {
      throw new Error(`命名空间 ${namespaceId} 的向量存储不存在`);
    }
    
    // 获取语言模型
    const model = await this.getLanguageModel();
    
    // 创建检索器
    const retriever = vectorStore.asRetriever();
    
    // 创建提示模板
    const promptTemplate = PromptTemplate.fromTemplate(
      `基于以下上下文回答问题。如果上下文中没有相关信息，请说明无法回答。

上下文：
{context}

问题：{question}`
    );
    
    // 创建RAG链
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: (input: { question: string }) => input.question,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);
    
    return chain as unknown as BaseChain;
  }

  /**
   * 执行RAG流水线
   * @param query 用户查询
   * @param namespaceId 命名空间ID
   * @param topK 返回结果数量
   * @returns 包含回答和引用来源的结果对象
   */
  async ragPipeline(query: string, namespaceId: string, topK: number = 3): Promise<{ answer: string; sources: string[] }> {
    const operationName = 'ragPipeline';
    this.monitor.startOperation(operationName);
    
    try {
      this.logger.info('开始执行RAG流水线', { query, namespaceId, topK });
      
      // 获取向量存储
      const vectorStore = await this.langChainService.getVectorStore(namespaceId);
      if (!vectorStore) {
        throw new Error(`命名空间 ${namespaceId} 的向量存储不存在`);
      }
      
      // 搜索相似文档
      const relevantDocs = await this.langChainService.searchSimilarDocuments(query, namespaceId, topK);
      
      // 如果没有找到相关文档，返回无法回答
      if (relevantDocs.length === 0) {
        return {
          answer: '抱歉，我没有找到与您问题相关的信息。',
          sources: []
        };
      }
      
      // 创建RAG链
      const chain = await this.createRAGChain(namespaceId);
      
      // 执行链
      const result = await chain.call({ question: query });
      
      this.monitor.endOperation(operationName);
      this.logger.info('RAG流水线执行完成', {
        query,
        namespaceId,
        processingTime: this.monitor.getMetrics()[operationName]
      });
      
      // 返回结果
      return {
        answer: result.text || result.toString(),
        sources: relevantDocs.map(doc => doc.document.text)
      };
    } catch (error) {
      this.monitor.endOperation(operationName);
      this.logger.error('RAG流水线执行失败', {
        error: error instanceof Error ? error.message : String(error),
        query,
        namespaceId
      });
      
      return {
        answer: `抱歉，处理您的问题时出现错误: ${error instanceof Error ? error.message : String(error)}`,
        sources: []
      };
    }
  }
}