import { chatAPI } from "../services/chatApi";
import type { ChatMessage, Dialog, Conversation, Model } from "../../../../share/type";
import { ref } from "vue";
import { generateUUID } from "../utils/uuid";

/**
 * 上下文管理器
 * 负责管理对话上下文和历史记录
 */
export class ContextManager {
  private contextSize: number;
  private contextWindow: Map<string, ChatMessage[]>;

  constructor(contextSize: number = 10) {
    this.contextSize = contextSize;
    this.contextWindow = new Map();
  }

  /**
   * 更新对话上下文
   * @param conversationId 会话ID
   * @param message 消息
   */
  updateContext(conversationId: string, message: ChatMessage): void {
    let context = this.contextWindow.get(conversationId) || [];
    context.push(message);
    
    // 维护上下文窗口大小
    if (context.length > this.contextSize) {
      context = context.slice(-this.contextSize);
    }
    
    this.contextWindow.set(conversationId, context);
  }

  /**
   * 获取对话上下文
   * @param conversationId 会话ID
   * @returns 上下文消息数组
   */
  getContext(conversationId: string): ChatMessage[] {
    return this.contextWindow.get(conversationId) || [];
  }
}

/**
 * 消息处理器
 * 处理消息的发送、接收和格式化
 */
export class MessageHandler {
  private contextManager: ContextManager;

  constructor(contextManager: ContextManager) {
    this.contextManager = contextManager;
  }

  /**
   * 发送消息
   * @param conversationId 会话ID
   * @param content 消息内容
   * @param model 模型信息
   * @returns 消息流
   */
  sendMessage(conversationId: string, content: string, model: Model): ReadableStream<ChatMessage> {
    // 创建用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    
    // 更新上下文
    this.contextManager.updateContext(conversationId, userMessage);
    
    // 调用API发送消息
    return chatAPI.sendMessage(content, model, conversationId);
  }

  /**
   * 发送图片
   * @param imageFile 图片文件
   * @returns 消息对象
   */
  async sendImage(imageFile: File): Promise<ChatMessage> {
    return await chatAPI.sendImage(imageFile);
  }

  /**
   * 获取聊天历史
   * @param conversationId 会话ID
   * @returns 消息数组
   */
  async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    return await chatAPI.getChatHistory(conversationId);
  }
}

/**
 * 会话存储
 * 负责会话数据的状态管理和持久化
 */
export class ConversationStore {
  private conversations: Map<string, Dialog>;
  private activeConversationId: string | null;
  private dialogState = ref<Conversation>({
    dialogs: [],
    activeDialogId: '',
  });

  constructor() {
    this.conversations = new Map();
    this.activeConversationId = null;
    this.init();
  }

  /**
   * 初始化会话存储
   */
  async init(): Promise<void> {
    // 从存储加载会话数据
    const dialogData = await chatAPI.getDialogList();
    this.dialogState.value = dialogData;
    
    // 初始化会话Map
    dialogData.dialogs.forEach(dialog => {
      this.conversations.set(dialog.id, dialog);
    });
    
    this.activeConversationId = dialogData.activeDialogId;
  }

  /**
   * 保存会话
   * @param conversation 会话对象
   */
  async saveConversation(conversation: Dialog): Promise<void> {
    this.conversations.set(conversation.id, conversation);
    
    // 更新dialogState
    const index = this.dialogState.value.dialogs.findIndex(d => d.id === conversation.id);
    if (index !== -1) {
      this.dialogState.value.dialogs[index] = conversation;
    } else {
      this.dialogState.value.dialogs.push(conversation);
    }
    
    // 保存到存储
    await chatAPI.saveDialogList(this.dialogState.value);
  }

  /**
   * 创建新会话
   * @param title 会话标题
   * @param model 模型信息
   * @returns 新会话对象
   */
  async createConversation(title: string, model?: Model): Promise<Dialog> {
    const id = generateUUID();
    const newConversation: Dialog = {
      id,
      title,
      chatId: id,
      timestamp: Date.now(),
      model
    };
    
    await this.saveConversation(newConversation);
    return newConversation;
  }

  /**
   * 设置活动会话
   * @param conversationId 会话ID
   */
  async setActiveConversation(conversationId: string): Promise<void> {
    this.activeConversationId = conversationId;
    this.dialogState.value.activeDialogId = conversationId;
    await chatAPI.saveDialogList(this.dialogState.value);
  }

  /**
   * 获取会话列表
   * @returns 会话数组
   */
  getConversations(): Dialog[] {
    return this.dialogState.value.dialogs;
  }

  /**
   * 获取活动会话ID
   * @returns 活动会话ID
   */
  getActiveConversationId(): string | null {
    return this.activeConversationId;
  }

  /**
   * 获取会话状态
   * @returns 会话状态引用
   */
  getDialogState() {
    return this.dialogState;
  }

  /**
   * 更新模型
   * @param model 模型信息
   */
  async updateModel(model: Model): Promise<void> {
    if (!this.activeConversationId) return;
    
    const conversation = this.conversations.get(this.activeConversationId);
    if (!conversation) return;
    
    conversation.model = model;
    await this.saveConversation(conversation);
  }
}

// /**
//  * 生成UUID
//  * @returns UUID字符串
//  */
// export function generateUUID(): string {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }