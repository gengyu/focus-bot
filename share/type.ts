export interface Model {
  id: string;
  providerId: string;
  name: string;
  description: string;
  size: string;
  enabled: boolean;
}
export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  models: Model[];

  temperature?: number;
  maxTokens?: number;
}

// export interface ProviderConfig {
//   apiKey: string;
//   model?: string;
//   temperature?: number;
//   maxTokens?: number;
//   baseURL?: string;
// }

export interface AppSetting {
  providers: ProviderConfig[];
}


export interface ChatMessage {
  role: 'user' | 'assistant';
  provider?: string
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface Chat {
  chatId: string;
  messages: ChatMessage[];
  create_time: string;
  update_time: string;
  content_hash?: string;
  share_id?: string;
}


export interface Dialog {
  dialogId: string;
  title: string;
  // messages: ChatMessage[];
  // chatId: string,
  timestamp: number;
  model?: Model
}

export interface DialogState {
  dialogs: Dialog[];
  activeDialogId: string;
}