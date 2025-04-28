import fs from 'fs';
import path from 'path';
import {PersistenceService, PersistenceOptions} from './persistenceService';
import {type ChatMessage} from "../../../../share/type.ts";

import {WritableStream} from "node:stream/web";
//
// interface ChatHistory {
//   [chatId: string]: ChatMessage[];
// }


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

  private async saveChatHistory(chatHistory: ChatMessage[], chatId: string): Promise<void> {
    try {
      //@ts-ignore
      await this.persistenceService.saveData(chatHistory, chatId);
    } catch (error) {
      throw new Error(`Failed to save chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // 使用流持久化数据
   getWriteStorageStream(chatId: string): WritableStream {
    let message: ChatMessage
    return new WritableStream<ChatMessage>({
      start(chunk) {
        //  持久化缓存
        console.log('persistent cache start', chunk)
      },
      write(chunk) {
        message = chunk;
      },
      close: async () => {
        const chatHistory = await this.loadChatHistory(chatId);
        chatHistory.push(message);
        this.saveChatHistory(chatHistory, chatId);
      }
    });
  }

  private async loadChatHistory(chatId: string): Promise<ChatMessage[]> {
    try {
      return await this.persistenceService.loadData(chatId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async pushMessage(chatId: string, message: ChatMessage): Promise<void> {
    let chatHistory = await this.loadChatHistory(chatId);
    if (chatHistory) {
      chatHistory.push(message);
    } else {
      chatHistory = [message];
    }
    await this.saveChatHistory(chatHistory, chatId);
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const data = await this.loadChatHistory(chatId);
    return  data || [];
  }

}