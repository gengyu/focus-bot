import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Ollama } from 'langchain/chat_models/ollama';
import { HumanMessage, SystemMessage, AIMessage, ChatMessage as LCChatMessage } from 'langchain/schema';
import { LLMProvider, ProviderResponseChunk } from "./LLMProvider";
import { type ChatMessage, Model, ProviderConfig } from "../../../../share/type";
import { formatMessage } from './formatMessage';
import { v4 as uuidv4 } from 'uuid';

/**
 * LangChain Provider 实现
 * 使用 LangChain 的 ChatModel 实现 LLMProvider 接口
 */
export class LangChainProvider implements LLMProvider {
  private config: ProviderConfig;
  private model: ChatOpenAI | Ollama | null = null;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.initializeModel();
  }

  /**
   * 初始化 LangChain 模型
   */
  private initializeModel() {
    try {
      // 根据提供商类型初始化不同的模型
      switch (this.config.id) {
        case 'openai':
        case 'aliyun':
          this.model = new ChatOpenAI({
            modelName: this.config.modelId || 'gpt-3.5-turbo',
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            openAIApiKey: this.config.apiKey,
            configuration: {
              baseURL: this.config.apiUrl
            }
          });
          break;
        case 'ollama':
          this.model = new Ollama({
            baseUrl: this.config.apiUrl || 'http://localhost:11434',
            model: this.config.modelId || 'llama2',
            temperature: this.config.temperature,
          });
          break;
        default:
          throw new Error(`不支持的提供商类型: ${this.config.id}`);
      }
    } catch (error) {
      console.error(`初始化 LangChain 模型失败:`, error);
      throw new Error(`初始化 LangChain 模型失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 将 ChatMessage 转换为 LangChain 消息格式
   */
  private convertToLangChainMessages(messages: ChatMessage[]): LCChatMessage[] {
    return messages.map(msg => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : msg.content.map(c => {
            if (c.type === 'text') return c.text;
            if (c.type === 'file' && c.files) {
              const files = Array.isArray(c.files) ? c.files : [c.files];
              return files.map(f => f.content || '').join('\n');
            }
            return '';
          }).filter(Boolean).join('\n');

      switch (msg.role) {
        case 'user':
          return new HumanMessage(content);
        case 'assistant':
          return new AIMessage(content);
        case 'system':
          return new SystemMessage(content);
        default:
          return new HumanMessage(content);
      }
    });
  }

  /**
   * 非流式聊天接口
   */
  async chat(chatMessages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    try {
      if (!this.model) {
        this.initializeModel();
      }

      if (!this.model) {
        throw new Error('模型初始化失败');
      }

      // 转换消息格式
      const langChainMessages = this.convertToLangChainMessages(chatMessages);
      
      // 调用 LangChain 模型
      const response = await this.model.invoke(langChainMessages, {
        signal,
      });

      return {
        role: 'assistant',
        content: response.content,
      };
    } catch (error) {
      console.error('LangChain API Error:', error);
      throw new Error(`Failed to get response from LangChain: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 流式聊天接口
   */
  async* streamChat(chatMessages: ChatMessage[], modelId: string, signal?: AbortSignal) {
    try {
      if (!this.model) {
        this.initializeModel();
      }

      if (!this.model) {
        throw new Error('模型初始化失败');
      }

      // 转换消息格式
      const langChainMessages = this.convertToLangChainMessages(chatMessages);
      
      // 生成唯一消息ID
      const messageId = uuidv4();
      
      // 调用 LangChain 模型的流式接口
      const stream = await this.model.stream(langChainMessages, {
        signal,
      });

      // 处理流式响应
      for await (const chunk of stream) {
        yield {
          id: messageId,
          content: chunk.content,
          provider: this.config.id,
          model: modelId,
          role: 'assistant',
          timestamp: Date.now(),
          type: 'text'
        } as ProviderResponseChunk;
      }
    } catch (error) {
      console.error('LangChain API Stream Error:', error);
      throw new Error(`Failed to create stream from LangChain: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<Model[]> {
    try {
      // 根据提供商返回不同的模型列表
      switch (this.config.id) {
        case 'openai':
          return [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          ];
        case 'aliyun':
          return [
            { id: 'qwen-turbo', name: 'Qwen Turbo' },
            { id: 'qwen-plus', name: 'Qwen Plus' },
            { id: 'qwen-max', name: 'Qwen Max' },
          ];
        case 'ollama':
          // 理想情况下，应该从 Ollama API 获取可用模型列表
          return [
            { id: 'llama2', name: 'Llama 2' },
            { id: 'mistral', name: 'Mistral' },
            { id: 'gemma', name: 'Gemma' },
          ];
        default:
          return [];
      }
    } catch (error) {
      console.error('Get Models Error:', error);
      return [{ id: this.config.modelId || 'default-model', name: this.config.modelId || 'Default Model' }];
    }
  }
}