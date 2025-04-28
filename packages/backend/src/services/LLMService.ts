
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
        // gemini: (config: ProviderConfig) => new GeminiProvider(config), // 需要实现 GeminiProvider
    };
    private configService: ConfigService

    constructor(config: ConfigService) {
        this.configService =config
    }

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

    async chat(messages: Array<{ role: string; content: string }>, providerId: string, modelId?: string) {
        const prov =await this.getLLmIntance(providerId);
        return prov.chat(messages);
    }

    async streamChat(messages: Array<{ role: string; content: string }>, provider?: string, config?: ProviderConfig) {
        const prov = this.getLLmIntance(provider || this.defaultProvider, config);
        return prov.streamChat(messages);
    }

    async getModels(provider?: string) {
        const prov = this.getLLmIntance(provider || this.defaultProvider);
        return prov.getModels();
    }
}
// 如需支持 GeminiProvider，请实现对应 Provider 并在 providerFactory 注册