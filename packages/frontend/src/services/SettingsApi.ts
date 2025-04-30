import {API_BASE_URL} from './api';
import {TransportAdapter, TransportType} from "../transports";
import type {ChatMessage} from "../../../../share/type.ts";

// export interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
//   timestamp: number;
//   type: 'text' | 'image';
//   imageUrl?: string;
// }


export class SettingsAPI {

  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'setting'
  });

  async getModels(): Promise<ChatMessage[]> {
    const response = await this.transport.invokeDirect({
      method: 'getModels',
      payload: {
        path: 'ollama',
      },
    });

    return response.data as ChatMessage[];
  }




}

export const settingsAPI = new SettingsAPI();
