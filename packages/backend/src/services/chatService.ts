import fs from 'fs';
import path from 'path';
import {PersistenceService, PersistenceOptions} from './persistenceService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export class ChatService {
  private persistenceService: PersistenceService;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'chat_history.json',
      backupInterval: options?.backupInterval ?? 3600000, // 默认1小时
      maxBackups: options?.maxBackups ?? 24 // 默认24个备份
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.persistenceService.initialize();
      // Initialize with empty array if needed
      const history = await this.getMessages();
      if (!history || !Array.isArray(history)) {
        await this.saveChatHistory([]);
      }
    } catch (error) {
      console.error('Chat service initialization error:', error);
      // Initialize with empty array on error
      await this.saveChatHistory([]);
    }
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      //@ts-ignore
      await this.persistenceService.saveData(messages);
    } catch (error) {
      throw new Error(`Failed to save chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadChatHistory(): Promise<ChatMessage[]> {
    try {
      const data = await this.persistenceService.loadData();
      return (data as ChatMessage[]).map(msg => ({
        role: msg.role || 'user',
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
        ...(msg.imageUrl && {imageUrl: msg.imageUrl})
      }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addMessage(message: ChatMessage): Promise<void> {
    const history = await this.loadChatHistory();
    history.push(message);
    await this.saveChatHistory(history);
  }

  async getMessages(): Promise<ChatMessage[]> {
    return await this.loadChatHistory();
  }

  public stopAutoBackup(): void {
    this.persistenceService.stopAutoBackup();
  }
}