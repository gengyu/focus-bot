export interface Model {
  id: string;
  providerId: string;
  name: string;
  description: string;
  size: string;
  enabled: boolean;
}
export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  models: Model[];
}

export interface ProviderConfig {
  providers: Provider[];
}


export interface ChatMessage {
  role: 'user' | 'assistant';
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
  activeDialogId: string | null;
}