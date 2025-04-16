import { API_BASE_URL } from './api';
import { TransportAdapter, TransportType } from '@mcp-connect/mcp-transport';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

const transport = new TransportAdapter(TransportType.HTTP, { serverUrl: API_BASE_URL });

export class ChatAPI {
  async sendMessage(message: string): Promise<ChatMessage> {
    const req = { method: 'sendMessage', params: { message } };
    const res = await transport.invokeDirect(req);
    if (!res.success) throw new Error(`发送消息失败: ${res.error}`);
    return res.data;
  }

  async sendImage(imageFile: File): Promise<ChatMessage> {
    // 由于TransportAdapter不直接支持FormData，这里仍需特殊处理或扩展TransportAdapter支持文件上传
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
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const req = { method: 'getChatHistory', params: {} };
    const res = await transport.invokeDirect(req);
    if (!res.success) throw new Error(`获取聊天历史失败: ${res.error}`);
    return res.data;
  }
}

export const chatAPI = new ChatAPI();