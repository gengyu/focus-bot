import {ChatService} from "./chatService.ts";
import {ConfigService} from "./configService.ts";
import {LLMService} from "./LLMService.ts";
import {type ChatMessage} from "../../../share/type.ts";


export class Service {
    chatService: ChatService;
    configService: ConfigService;
    llmService: LLMService;

    constructor() {
        // 初始化服务，保持清晰的依赖关系
        this.configService = new ConfigService();
        this.llmService = new LLMService(this.configService.getLLMConfigs()); // 传递配置
        this.chatService = new ChatService(this.llmService);
    }

    // 独立操作 ConfigService
    async updateConfig(newConfig: any) {
        await this.configService.updateConfig(newConfig);
        // 配置变更后，重载 LLMService
        this.llmService = new LLMService(await this.configService.getLLMConfigs());
        // 重新创建ChatService，传入更新后的LLMService
        this.chatService = new ChatService(this.llmService);
    }

    // 独立操作 LLMService
    async getLLMModels(provider?: string) {
        return this.llmService.getModels(provider);
    }
    async chatWithLLM(messages: Array<{ role: string; content: string }>, provider?: string, config?: any) {
        return this.llmService.chat(messages, provider, config);
    }
    async streamChatWithLLM(messages: Array<{ role: string; content: string }>, provider?: string, config?: any) {
        return this.llmService.streamChat(messages, provider, config);
    }
    // 动态添加/停用 provider
    reloadLLMProviders(configs: any[]) {
        // 使用新配置重新创建LLMService
        this.llmService = new LLMService(configs);
        // 更新ChatService，确保它使用最新的LLMService
        this.chatService = new ChatService(this.llmService);
    }

    // 独立操作 ChatService
    async chat(messages: Array<{ role: string; content: string }>, chatId?: string) {
        // 如果提供了chatId，可以将消息保存到历史记录
        if (chatId) {
            const userMessage = messages[messages.length - 1];
            if (userMessage && userMessage.role === 'user') {
                await this.chatService.pushMessage(chatId, userMessage as ChatMessage);
            }
        }
        // 调用ChatService处理聊天请求
        return this.chatService.chat(messages);
    }
}