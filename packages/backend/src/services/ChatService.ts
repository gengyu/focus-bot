import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider, ProviderResponseChunk} from "../provider/LLMProvider";
import {AppSettingService} from "./AppSettingService";
import {type ChatMessage, Model, ProviderConfig} from "../../../../share/type";
import {ChatHistoryService} from "./ChatHistoryService";
import {ReadableStream} from "node:stream/web";
import {Singleton} from "../decorators/Singleton";
import {OllamaAIProvider} from "../provider/OllamaAIProvider.ts";
import {RAGService} from './rag.service';
import {SearchService} from './SearchService';
import {ChatOptions} from "../../../../share/chat.ts";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

@Singleton()
export class ChatService {
  private providerCache: Map<string, LLMProvider> = new Map();
  private providerFactory: Record<string, (config: ProviderConfig) => LLMProvider> = {
    openai: (config: ProviderConfig) => new OpenAIProvider(config),
    ollama: (config: ProviderConfig) => new OllamaAIProvider(config),
    aliyun: (config: ProviderConfig) => new OllamaAIProvider(config),
    // 如需支持 GeminiProvider，请实现对应 Provider 并在 providerFactory 注册
    // gemini: (config: ProviderConfig) => new GeminiProvider(config), // 需要实现 GeminiProvider
  };
  private readonly appSettingService: AppSettingService;
  private readonly chatHistoryService: ChatHistoryService;
  private readonly ragService: RAGService;
  private readonly searchService: SearchService;
  private readonly modelId: string = 'gpt-3.5-turbo';
  private llmProvider: LLMProvider | null = null;

  constructor() {
    this.appSettingService = new AppSettingService();
    this.chatHistoryService = new ChatHistoryService();
    this.ragService = new RAGService();
    this.searchService = new SearchService();
  }

  // 单例 #todo
  private async getLLmIntance(providerId: string): Promise<LLMProvider> {
    console.log("getLLmIntance", providerId);
    if (this.providerCache.has(providerId)) {
      return this.providerCache.get(providerId)!;
    }
    const providers = await this.appSettingService.getProviderConfig();
    const provider = providers.find(p => p.id === providerId);
    const factory = this.providerFactory[providerId];
    if (factory && provider) {
      const instance = factory(provider);
      this.providerCache.set(providerId, instance);
      return instance;
    }
    // return ;
    throw new Error(`Provider ${providerId} not supported`);
  }

  async chat(messages: ChatMessage[], options: ChatOptions & { stream: true }): Promise<[() => void, ReadableStream<ProviderResponseChunk>]>
  async chat(messages: ChatMessage[], options: ChatOptions & { stream?: false }): Promise<ChatMessage>
  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatMessage | [() => void, ReadableStream<ProviderResponseChunk>]> {
    const {
      useKnowledgeBase = true,
      useSearchEngine = false,
      knowledgeBaseId = '77584235-251e-4f4c-9d8e-a7eedc43d133',
      model,
      stream = false,
    } = options;

    if (!model) {
      throw new Error('Model is required');
    }

    const llmProvider = await this.getLLmIntance(model.providerId);
    const lastMessage = messages[messages.length - 1];
    let enhancedMessages = [...messages];


    // 1. 是否检索本地知识库
    if (true || useKnowledgeBase && knowledgeBaseId) {
      try {
        // const ragResult = await this.ragService.ragPipeline(knowledgeBaseId,lastMessage.content as string);
        const ragResult = await this.ragService.ragPipeline('77584235-251e-4f4c-9d8e-a7eedc43d133',lastMessage.content as string);
        const knowledgeContext = `以下是来自知识库的相关信息：\n\n${ragResult.sources.join('\n\n')}`;

        enhancedMessages = [
          {
            id: Date.now().toString(),
            role: 'system',
            content: knowledgeContext,
            timestamp: Date.now(),
            type: 'text'
          },
          ...enhancedMessages
        ];
      } catch (error) {
        console.error('知识库检索失败:', error);
      }
    }

    // 2. 是否启用搜索引擎
    if (useSearchEngine) {
      try {
        enhancedMessages = await this.searchService.enhanceWithSearch(lastMessage.content as string, enhancedMessages);
      } catch (error) {
        console.error('搜索引擎查询失败:', error);
      }
    }

    // 3. 构造 prompts
    const systemPrompt = this.constructSystemPrompt(useKnowledgeBase, useSearchEngine);
    enhancedMessages = [
      {
        id: Date.now().toString(),
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now(),
        type: 'text'
      },
      ...enhancedMessages
    ];

    if (stream) {
      // 控制结束
      const abortController: AbortController = new AbortController();
      const signal = abortController.signal;


      const stream = llmProvider.streamChat(
        enhancedMessages
        , model.id, signal);

      const readableStream = new ReadableStream<ProviderResponseChunk>({
        async start(controller) {
          // controller.enqueue(JSON.stringify(assistantMessage));
        },
        async pull(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(chunk);
            }
          } catch (err) {
            console.error('Stream error:', err);
          } finally {
            controller.close();
          }
        }
      });


      return [() => abortController.abort(), readableStream];
    } else {
      // 调用 LLM 生成回答
      const response = await llmProvider.chat(enhancedMessages, model.id);
      return response;
    }

  }

  private constructSystemPrompt(useKnowledgeBase: boolean, useSearchEngine: boolean): string {
    const prompts: string[] = [
      '你是一个智能助手，请根据提供的信息回答问题。'
    ];

    if (useKnowledgeBase) {
      prompts.push('我会提供来自知识库的相关信息，请优先使用这些信息来回答问题。');
    }

    if (useSearchEngine) {
      prompts.push('我会提供来自搜索引擎的相关信息，请参考这些信息来补充回答。');
    }

    prompts.push(
      '如果提供的信息不足以回答问题，请说明无法回答。',
      '回答时请保持专业、准确和客观。',
      '如果信息之间有冲突，请说明冲突点并给出可能的解释。'
    );

    return prompts.join('\n');
  }

  // async streamChat(
  //   chatId: string,
  //   message: ChatMessage,
  //   model: Model,
  //   resendMessageId?: string
  // ) {
  //
  //   const llmProvider = await this.getLLmIntance(model.providerId);
  //   await this.chatHistoryService.pushMessage(chatId, message, resendMessageId);
  //
  //   const controller: AbortController = new AbortController();
  //   const signal = controller.signal;
  //   const historyMessages = await this.chatHistoryService.getMessages(chatId);
  //
  //
  //   const stream = llmProvider.streamChat(
  //     historyMessages.filter(Boolean)
  //     , model.id, signal);
  //
  //
  //   const readableStream = new ReadableStream<ProviderResponseChunk>({
  //     async start(controller) {
  //       // controller.enqueue(JSON.stringify(assistantMessage));
  //     },
  //     async pull(controller) {
  //       try {
  //         for await (const chunk of stream) {
  //           controller.enqueue(chunk);
  //         }
  //       } catch (err) {
  //         console.error('Stream error:', err);
  //       } finally {
  //         controller.close();
  //       }
  //     }
  //   });
  //   const [stream1, stream2] = readableStream.tee();
  //   stream2.pipeTo(this.chatHistoryService.getWriteStorageStream(chatId)).catch(error => {
  //     console.error('Error writing to storage:', error);
  //   });
  //
  //   return [() => controller.abort(), stream1];
  // }


  async getModels(providerId: string) {
    const llmProvider = await this.getLLmIntance(providerId);
    return await llmProvider.getModels();
  }
}
