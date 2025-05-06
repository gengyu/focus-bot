import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider, ProviderResponseChunk} from "../provider/LLMProvider";
import {AppSettingService} from "./AppSettingService";
import {type ChatMessage, Model, ProviderConfig} from "../../../../share/type";
import {ChatHistoryService} from "./ChatHistoryService";
import {ReadableStream} from "node:stream/web";
import {Singleton} from "../decorators/Singleton";
import {OllamaAIProvider} from "../provider/OllamaAIProvider.ts";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

@Singleton()
export class ChatService {
  private providerCache: Map<string, LLMProvider> = new Map();
  private providerFactory: Record<string, (config: ProviderConfig) => LLMProvider> = {
    openai: (config: ProviderConfig) => new OpenAIProvider(config),
    ollama: (config: ProviderConfig) => new OllamaAIProvider(config),
    // 如需支持 GeminiProvider，请实现对应 Provider 并在 providerFactory 注册
    // gemini: (config: ProviderConfig) => new GeminiProvider(config), // 需要实现 GeminiProvider
  };
  private appSettingService: AppSettingService
  private chatHistoryService: ChatHistoryService;

  constructor() {
    this.appSettingService = new AppSettingService();
    this.chatHistoryService = new ChatHistoryService();
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

  async chat(
    chatId: string,
    message: ChatMessage,
    model: Model
  ) {
    const llmProvider = await this.getLLmIntance(model.providerId);
    await this.chatHistoryService.pushMessage(model.id, message);
    const reponseMsg = await llmProvider.chat([message], chatId);
    await this.chatHistoryService.pushMessage(chatId, reponseMsg);
  }

  async streamChat(
    chatId: string,
    message: ChatMessage,
    model: Model
  ) {

    const llmProvider = await this.getLLmIntance(model.providerId);
    await this.chatHistoryService.pushMessage(chatId, message);

    const controller: AbortController = new AbortController();
    const signal = controller.signal;


    const stream = llmProvider.streamChat([message], model.id, signal);


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
    const [stream1, stream2] = readableStream.tee();
    stream2.pipeTo(this.chatHistoryService.getWriteStorageStream(chatId)).catch(error => {
      console.error('Error writing to storage:', error);
    });

    return [() => controller.abort(), stream1];
  }

  async getModels(providerId: string) {
    const llmProvider = await this.getLLmIntance(providerId);
    return llmProvider.getModels();
  }
}
