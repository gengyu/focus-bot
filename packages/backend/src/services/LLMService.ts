
import {OpenAIProvider} from "../provider/OpenAIProvider";
import {LLMProvider, ProviderConfig} from "../provider/LLMProvider";

export class LLMService {
    private provider: LLMProvider;

    constructor(config: ProviderConfig) {
        // 根据配置选择不同的provider
        // 目前只实现了OpenAI，后续可以扩展其他模型
        this.provider = new OpenAIProvider(config);
    }

    async chat(messages: Array<{ role: string; content: string }>) {
        return this.provider.chat(messages);
    }

    async streamChat(messages: Array<{ role: string; content: string }>) {
        return this.provider.streamChat(messages);
    }

    async getModels() {
        return this.provider.getModels();
    }
}