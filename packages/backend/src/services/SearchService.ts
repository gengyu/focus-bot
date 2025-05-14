import axios from 'axios';
import { ChatMessage } from '../../../../share/type';
import { v4 as uuidv4 } from 'uuid';

export class SearchService {
  private readonly apiKey: string;
  private readonly searchEngineId: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  async search(query: string): Promise<string[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: 5 // 获取前5个结果
        }
      });

      const results = response.data.items || [];
      return results.map((item: any) => {
        return `标题: ${item.title}\n摘要: ${item.snippet}\n链接: ${item.link}\n\n`;
      });
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  }

  async enhanceWithSearch(query: string, messages: ChatMessage[]): Promise<ChatMessage[]> {
    const searchResults = await this.search(query);
    
    if (searchResults.length > 0) {
      const searchContext = `以下是相关的搜索结果，请参考这些信息来回答问题：\n\n${searchResults.join('\n')}`;
      
      // 在用户消息前添加上下文
      const enhancedMessages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: 'system',
          content: searchContext,
          timestamp: Date.now(),
          type: 'text'
        },
        ...messages
      ];
      
      return enhancedMessages;
    }
    
    return messages;
  }
} 