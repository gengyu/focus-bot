import {defineStore} from 'pinia';
import {ref} from "vue";
import {type ChatMessage, type DialogId, type Model} from "../../../../share/type.ts";
import {chatAPI} from "../services/chatApi.ts";

// 创建单例实例
// const contextManager = new ContextManager();

/**
 * 会话存储
 * 负责会话数据的状态管理和持久化
 */
export const useMessageStore = defineStore<string, {
  // conversation: Ref<Conversation>,
  // updateModel: (model: Model) => Promise<void>,
  // setActiveDialog: (dailogId: string) => Promise<void>,
  // createConversation: (title: string, model?: Model) => Promise<Conversation>,
  sendMessage: (content: string, model: Model, dialogId: DialogId) => Promise<void>,
  sendImage: (imageFile: File) => Promise<ChatMessage>,
  getChatHistory: (dialogId: DialogId) => Promise<ChatMessage[]>
}>('message', () => {


  const messages = ref<Record<DialogId, ChatMessage[]>>({});


  /**
   * 发送消息
   * @param content 消息内容
   * @param model 模型信息
   * @param dialogId 对话ID
   * @returns 消息流
   */
  const sendMessage = async (content: string, model: Model, dialogId: DialogId) => {
    // 创建用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    const chatMessages: ChatMessage[] = messages.value[dialogId] || [];
    chatMessages.push(userMessage);
    messages.value[dialogId] = chatMessages;

    // 调用API发送消息
    const readableStream: ReadableStream = chatAPI.sendMessage(userMessage, model, dialogId);
    const reader = readableStream.getReader();
    try {
      let assistantMessage: ChatMessage = {
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text'
      };
      chatMessages.push(assistantMessage);
      while (true) {
        const {done, value} = await reader.read();
         assistantMessage.content = value.content;
        if (done) {
          break;
        }
      }
    } catch (error) {
      console.error('读取消息流失败:', error);
      // 可在此添加用户提示或重试机制

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 发送图片
   * @param imageFile 图片文件
   * @returns 消息对象
   */
  const sendImage = async (imageFile: File) => {
    return await chatAPI.sendImage(imageFile);
  }

  /**
   * 获取聊天历史
   * @param dialogId 对话ID
   * @returns 消息数组
   */
  const getChatHistory = async (dialogId: DialogId) => {
    const res = await chatAPI.getChatHistory(dialogId);
    messages.value[dialogId] = res;
    return res;
  }

  return {
    messages,
    sendMessage,
    sendImage,
    getChatHistory
  }
});