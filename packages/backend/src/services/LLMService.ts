
import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider, ProviderConfig} from "../provider/LLMProvider";
import {ConfigService} from "./configService.ts";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

export class LLMService {
    private providerCache: Map<string, LLMProvider> = new Map();

    private configService: ConfigService

    constructor(config: ConfigService) {
        this.configService =config
    }

    private getProvider(provider: string, config?: ProviderConfig): LLMProvider {
        if (this.providerCache.has(provider)) {
            return this.providerCache.get(provider)!;
        }
        this.configService.getLLMConfigs();
        const factory = this.providerCache.get[provider];
        if (factory) {
            const instance = factory(config || this.defaultConfig);
            this.providerCache.set(provider, instance);
            return instance;
        }
        throw new Error(`Provider ${provider} not supported`);
    }

    async chat(messages: Array<{ role: string; content: string }>, provider?: string, config?: ProviderConfig) {
        const prov = this.getProvider(provider || this.defaultProvider, config);
        return prov.chat(messages);
    }

    async streamChat(messages: Array<{ role: string; content: string }>, provider?: string, config?: ProviderConfig) {
        const prov = this.getProvider(provider || this.defaultProvider, config);
        return prov.streamChat(messages);
    }

    async getModels(provider?: string) {
        const prov = this.getProvider(provider || this.defaultProvider);
        return prov.getModels();
    }
}
// 如需支持 GeminiProvider，请实现对应 Provider 并在 providerFactory 注册