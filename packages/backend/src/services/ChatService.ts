import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider} from "../provider/LLMProvider";
import {AppSettingService} from "./AppSettingService.ts";
import {type ChatMessage, Model, ProviderConfig} from "../../../../share/type.ts";
import {ChatHistoryService} from "./ChatHistoryService.ts";
import {ReadableStream} from "node:stream/web";
import {Singleton} from "../decorators/Singleton.ts";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

@Singleton()
export class ChatService {
	private providerCache: Map<string, LLMProvider> = new Map();
	private providerFactory: Record<string, (config: ProviderConfig) => LLMProvider> = {
		// @ts-ignore
		ollama: (config: ProviderConfig) => new OpenAIProvider(config),
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
		const stream = llmProvider.streamChat([message], model.id);
		const assistantMessage: ChatMessage = {
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
			type: 'text'
		};

		const readableStream = new ReadableStream<string>({
			async start(controller) {
				controller.enqueue(JSON.stringify(assistantMessage));
			},
			async pull(controller) {
				for await (const chunk of stream) {
					const content = chunk.content || '';
					if (content) {
						controller.enqueue(content);
					}
				}
				controller.close();
			}
		});
		const [stream1, stream2] = readableStream.tee();
		stream2.pipeTo(this.chatHistoryService.getWriteStorageStream(chatId)).catch(error => {
			console.error('Error writing to storage:', error);
		});
		return stream1;
	}

	async getModels(providerId: string) {
		const llmProvider = await this.getLLmIntance(providerId);
		return llmProvider.getModels();
	}
}
