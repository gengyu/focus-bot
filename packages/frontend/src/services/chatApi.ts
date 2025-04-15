import { API_BASE_URL } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export class ChatAPI {
  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`发送消息失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async sendImage(imageFile: File): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/chat/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`发送图片失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`发送图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/history`);

      if (!response.ok) {
        throw new Error(`获取聊天历史失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`获取聊天历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}