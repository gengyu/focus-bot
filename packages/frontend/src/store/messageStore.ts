import {defineStore} from 'pinia';
import {reactive, type Ref, ref} from "vue";
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
  messages: Ref<Record<DialogId, ChatMessage[]>>,
  sendMessage: (content: string, model: Model, dialogId: DialogId) => Promise<ReadableStream<ChatMessage>>,
  sendImage: (imageFile: File) => Promise<ChatMessage>,
  refreshChatHistory: (dialogId: DialogId) => Promise<void>
}>('message', () => {


  const messages = ref<Record<DialogId, ChatMessage[]>>({});

  const updateMessage = async (readableStream: ReadableStream, dialogId: DialogId) => {
    const reader = readableStream.getReader();
    try {
      let assistantMessage = reactive<ChatMessage>({
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text'
      });
      messages.value[dialogId] = messages.value[dialogId] || []
      messages.value[dialogId].push(assistantMessage);
      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const result = JSON.parse(value);
          assistantMessage.content += result?.content ?? '';
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
    messages.value[dialogId] = messages.value[dialogId] || [];
    messages.value[dialogId].push(userMessage);

    // 调用API发送消息
    const readableStream: ReadableStream = chatAPI.sendMessage(userMessage, model, dialogId);
    const [assistantStream1, assistantStream2] = readableStream.tee();
    updateMessage(assistantStream1, dialogId);
    return assistantStream2
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
  const refreshChatHistory = async (dialogId: DialogId) => {
    if (messages.value[dialogId]) return;
    messages.value[dialogId] = await chatAPI.getChatHistory(dialogId);
  }

  return {
    messages,
    sendMessage,
    sendImage,
    refreshChatHistory
  }
});