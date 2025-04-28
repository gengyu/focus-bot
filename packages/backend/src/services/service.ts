import {ChatService} from "./chatService.ts";
import {ConfigService} from "./configService.ts";
import {LLMService} from "./LLMService.ts";


export class Service {
    chatService: ChatService;
    configService: ConfigService;
    llmService: LLMService;

    constructor() {
        this.configService = new ConfigService();
        this.chatService = new ChatService();
        this.llmService = new LLMService([]); // 这里可根据实际需要传递 ProviderConfig
    }
}