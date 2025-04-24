export interface Model {
  id: string;
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
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}


export interface Dialog {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  model?: Model
}

export interface DialogState {
  dialogs: Dialog[];
  activeDialogId: string | null;
}