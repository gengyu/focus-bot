
import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider, ProviderConfig} from "../provider/LLMProvider";
// import {Ollama} from "ollama";
//
// console.log(Ollama)

export class LLMService {
    private providerCache: Map<string, LLMProvider> = new Map();
    private providerFactory: Record<string, (config: ProviderConfig) => LLMProvider> = {
        openai: (config: ProviderConfig) => new OpenAIProvider(config),
        // gemini: (config: ProviderConfig) => new GeminiProvider(config), // 需要实现 GeminiProvider
    };
    private defaultProvider: string;
    private defaultConfig: ProviderConfig;

    constructor(configs: ProviderConfig[] | ProviderConfig) {
        if (Array.isArray(configs)) {
            configs.forEach(cfg => {
                if (cfg.provider) {
                    const factory = this.providerFactory[cfg.provider];
                    if (factory) {
                        this.providerCache.set(cfg.provider, factory(cfg));
                    }
                }
            });
            this.defaultProvider = configs[0]?.provider || 'openai';
            this.defaultConfig = configs[0];
        } else {
            const factory = this.providerFactory[configs.provider];
            if (factory) {
                this.providerCache.set(configs.provider, factory(configs));
            }
            this.defaultProvider = configs.provider || 'openai';
            this.defaultConfig = configs;
        }
    }

    private getProvider(provider: string, config?: ProviderConfig): LLMProvider {
        if (this.providerCache.has(provider)) {
            return this.providerCache.get(provider)!;
        }
        const factory = this.providerFactory[provider];
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