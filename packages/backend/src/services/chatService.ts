import fs from 'fs';
import path from 'path';
import {PersistenceService, PersistenceOptions} from './persistenceService';
import {type ChatMessage} from "../../../../share/type.ts";

import {WritableStream} from "node:stream/web";

interface ChatHistory {
  [chatId: string]: ChatMessage[];
}


export class ChatService {

  // private chat: Chat;
  private persistenceService: PersistenceService;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'chat_history.json',
      backupInterval: options?.backupInterval ?? 3600000, // 默认1小时
      maxBackups: options?.maxBackups ?? 24 // 默认24个备份
    });
  }

  // async initialize(): Promise<void> {
  //   try {
  //     await this.persistenceService.initialize();
  //     // Initialize with empty array if needed
  //     const history = await this.getMessages();
  //     if (!history || !Array.isArray(history)) {
  //       await this.saveChatHistory({});
  //     }
  //   } catch (error) {
  //     console.error('Chat service initialization error:', error);
  //     // Initialize with empty array on error
  //     await this.saveChatHistory({});
  //   }
  // }

  private async saveChatHistory(chatHistory: ChatHistory): Promise<void> {
    try {
      //@ts-ignore
      await this.persistenceService.saveData(chatHistory);
    } catch (error) {
      throw new Error(`Failed to save chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // 使用流持久化数据
   getWriteStorageStream(chatId: string): WritableStream {
    let message: ChatMessage
    return new WritableStream<ChatMessage>({
      start() {
        //  持久化缓存
        console.log('persistent cache start')
      },
      write(chunk) {
        message = chunk;
      },
      close: async () => {
        const chatHistory = await this.loadChatHistory();
        chatHistory[chatId] = chatHistory[chatId] || [];
        chatHistory[chatId].push(message);
        this.saveChatHistory(chatHistory);
      }
    });
  }

  private async loadChatHistory(): Promise<ChatHistory> {
    try {
      return await this.persistenceService.loadData();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to load chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async pushMessage(chatId: string, message: ChatMessage): Promise<void> {
    const chatHistory = await this.loadChatHistory();
    if (chatHistory[chatId]) {
      chatHistory[chatId].push(message);
    } else {
      chatHistory[chatId] = [message];
    }
    await this.saveChatHistory(chatHistory);
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const data = await this.loadChatHistory();
    return data[chatId] || [];
  }


}