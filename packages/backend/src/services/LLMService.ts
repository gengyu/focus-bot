import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider} from "../provider/LLMProvider";
import {ConfigService} from "./configService.ts";
import {ProviderConfig} from "../../../../share/type.ts";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

export class LLMService {
    private providerCache: Map<string, LLMProvider> = new Map();
    private providerFactory: Record<string, (config: ProviderConfig) => LLMProvider> = {
        openai: (config: ProviderConfig) => new OpenAIProvider(config),
        // 如需支持 GeminiProvider，请实现对应 Provider 并在 providerFactory 注册
        // gemini: (config: ProviderConfig) => new GeminiProvider(config), // 需要实现 GeminiProvider
    };
    private configService: ConfigService

    constructor(config: ConfigService) {
        this.configService =config
    }

    // 单例 #todo
    private async getLLmIntance(providerId: string): Promise<LLMProvider> {
        if (this.providerCache.has(providerId)) {
            return this.providerCache.get(providerId)!;
        }
       const providers = await  this.configService.getProviderConfig();
        const provider = providers.find(p => p.id === providerId);
        const factory = this.providerFactory[providerId];
        if (factory && provider) {
            const instance = factory(provider);
            this.providerCache.set(providerId, instance);
            return instance;
        }
        throw new Error(`Provider ${providerId} not supported`);
    }

    async chat(messages: Array<{ role: string; content: string }>, providerId: string, modelId: string) {
        const llmProvider =await this.getLLmIntance(providerId);
        return llmProvider.chat(messages, modelId);
    }

    async streamChat(messages: Array<{ role: string; content: string }>, providerId: string, modelId: string) {
        const llmProvider = await this.getLLmIntance(providerId);
        return llmProvider.streamChat(messages, modelId);
    }

    async getModels(providerId: string) {
        const llmProvider = await this.getLLmIntance(providerId);
        return llmProvider.getModels();
    }
}
