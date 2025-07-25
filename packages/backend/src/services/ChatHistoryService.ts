import path from 'path';
import {PersistenceOptions, PersistenceService} from './PersistenceService.ts';
import {type ChatMessage} from "../../../../share/type.ts";

import {WritableStream} from "node:stream/web";
import {ChatService} from "./ChatService.ts";
import {Singleton} from "../decorators/Singleton.ts";


@Singleton()
export class ChatHistoryService {

  // private chat: Chat;
  private persistenceService: PersistenceService;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'chat_history.json',
    });
  }

  private async saveChatHistory(chatHistory: ChatMessage[], chatId: string): Promise<void> {
    try {
      await this.persistenceService.saveData({[chatId]: chatHistory}, chatId);
    } catch (error) {
      throw new Error(`保存聊天历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async loadChatHistory(chatId: string): Promise<ChatMessage[]> {
    try {
      const chatHistory = await this.persistenceService.loadData(chatId);
      if (chatHistory) return chatHistory[chatId] || []
      return []
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      console.log(`加载聊天历史失败: ${error instanceof Error ? error.message : '未知错误'}`)
      throw new Error(`加载聊天历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 使用流持久化数据
  getWriteStorageStream(chatId: string): WritableStream {
    let message: ChatMessage
    return new WritableStream<ChatMessage>({
      // start(chunk) {
      // 	//  持久化缓存
      // 	console.log('persistent cache start', chunk.)
      // },
      write(chunk) {
        if (!message) message = {...chunk};
        else message.content += chunk.content as string;
      },
      close: async () => {
        const chatHistory = await this.loadChatHistory(chatId);
        chatHistory.push(message);
        await this.saveChatHistory(chatHistory, chatId);
      }
    });
  }

  async pushMessage(chatId: string, message: ChatMessage, messageId?: string): Promise<void> {
    let chatHistory = await this.loadChatHistory(chatId) || [];
    if (messageId ) {
      const findIndex = chatHistory.findIndex(item => item.id === messageId);
      if (findIndex > -1) {
        chatHistory = chatHistory.slice(0, findIndex)
      }
    }
    chatHistory.push(message);
    await this.saveChatHistory(chatHistory, chatId);
  }


  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const data = await this.loadChatHistory(chatId);
    return data || [];
  }

}