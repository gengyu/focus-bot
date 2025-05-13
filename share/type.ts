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


type MessageContentType = 'text' | 'image' | 'audio' | 'file' | 'application' | 'unknown';
type RoleType = 'user' | 'developer' | 'system' | 'assistant' | 'tool' | 'function';

export interface ChatMessageContent {
  type: MessageContentType
  text: string;
  // ChatCompletionContentPartImage.ImageURL;
  images: MessageFile | MessageFile[]
  // ChatCompletionContentPartInputAudio.InputAudio;
  files: MessageFile | MessageFile[]
}

// FileParseResult
export interface MessageFile  {
  content?: string;  // 文件内容
  metadata: FileMetadata;  // 其他自定义元数据
  url?: string;          // 文件URL（如果是远程文件）
  path?: string;         // 文件本地路径（如果是本地文件）
}

export interface ChatMessage {
  provider?: string
  timestamp: number;
  type: 'text';
  role: RoleType;
  content: string | ChatMessageContent[];
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



/**
 * 文件元信息接口
 */
export interface FileMetadata {
  fileName: string; // 文件名
  originalname?: string; // 原始文件名（可选）
  fileSize?: number; // 文件大小（字节）
  fileType?: string; // 文件类型
  createdAt?: number; // 创建时间
  modifiedAt?: number; // 最后修改时间
  accessedAt?: number; // 最后访问时间
  mimeType?: string; // MIME类型（可选）
  author?: string; // 作者信息（可选）
  pageCount?: number; // 页数（可选）
  wordCount?: number; // 字数统计（可选）
  additionalInfo?: Record<string, any>; // 其他自定义元数据（可选）
}


