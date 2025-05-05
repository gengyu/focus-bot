export type ModelId = string;
export type ProviderId = string;
export interface Model {
  id: ModelId;
  providerId: ProviderId;
  name: string;
  description: string;
  size: string;
  enabled: boolean;
}
export interface ProviderConfig {
  id: ProviderId;
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


type MessageType = string;
type RoleType = 'user' | 'developer' | 'system' |'assistant' | 'tool' | 'function';

interface ChartMessageText {
  text: string;
  type: 'text';
}

export interface ChatMessage {
  role: RoleType;
  provider?: string
  content: string;jhhgkiju8hygbmkomU几六级哦哦可鱼irty87tft🦢6如果客户火锅V姐一股让他都是粗人感觉大概要过节费大概风格的方法的风格非会员
  timestamp: number;
  type: 'text' | 'image';
  images?: Uint8Array[] | string[];
  tool_calls?: any[];
}

// export interface Chat {
//   id: string
//   dialogId: string;
//   messages: Array<ChatMessage[]>;
//   create_time: string;
//   update_time: string;
//   content_hash?: string;
//   share_id?: string;
// }

export type DialogId = string
// export type ConversationId = string

export interface Dialog {
  id: DialogId;
  title: string;
  conversationId: string,
  timestamp: number;
  model?: Model
}

// message 是最小单位（一条信息）；
// 多条 message 可组成一轮 dialog；
// 多个 dialog 构成一个完整 conversation；
// chat 是一种非正式的 conversation，通常包含许多 dialog 和 message。
// 会话

export interface Conversation {
  id: string,                     // 会话 ID（唯一）
  dialogs: Dialog[];
  activeDialogId: DialogId;

  // createdAt: number,     // 会话创建时间
  // updatedAt: number,     // 最近更新时间（通常是最后一条消息时间）
  // title: string,      // 会话标题（可供用户查看、AI生成）
  // isArchived: false,                  // 是否归档（用于用户隐藏旧对话）
  // tags: ['客服', '高优先级'],         // 标签分类（可用于搜索、筛选）
}

