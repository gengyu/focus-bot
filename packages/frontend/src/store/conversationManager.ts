import {chatAPI} from "../services/chatApi";
import type {ChatMessage, DialogId, Model} from "../../../../share/type";

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
   * @param dialogId 会话ID
   * @returns 消息数组
   */
  async getChatHistory(dialogId: DialogId): Promise<ChatMessage[]> {
    return await chatAPI.getChatHistory(dialogId);
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