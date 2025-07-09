import {defineStore} from 'pinia';
import {reactive, type Ref, ref} from "vue";
import {type ChatMessage, type DialogId} from "../../../../share/type.ts";
import {chatAPI} from "../services/chatApi.ts";
import {generateUUID4} from "../utils/uuid.ts";
import type {ChatOptions} from "../../../../share/type.ts";
import {getChatHistory} from "../services/api.ts";

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
  sendMessage(message: ChatMessage, chatOptions: ChatOptions, resendId?: string): Promise<ReadableStream<ChatMessage>>,
  stopMessage(dialogId: DialogId): void,
  // sendImage: (imageFile: File) => Promise<ChatMessage>,
  refreshChatHistory: (dialogId: DialogId) => Promise<void>
}>('message', () => {

  const messages = ref<Record<DialogId, ChatMessage[]>>({});

  const updateMessage = async (readableStream: ReadableStream, dialogId: DialogId) => {
    const reader = readableStream.getReader();
    try {
      let assistantMessage = reactive<ChatMessage>({
        id: generateUUID4(),
        content: '',
        type: 'text',
        role: 'assistant',
        timestamp: Date.now(),
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
          assistantMessage.timestamp = result.timestamp;
          if (typeof result.content === 'string') {
            if (Array.isArray(assistantMessage.content)) {
              assistantMessage.content[0].text += result.content;
            } else {
              assistantMessage.content = [{
                type: 'text',
                text: result.content,
                images: [],
                files: []
              }];
            }
          } else if (Array.isArray(result.content)) {
            assistantMessage.content = result.content;
          }
        }
      }
    } catch (error) {
      console.error('读取消息流失败:', error);
      // 可在此添加用户提示或重试机制
    } finally {
      reader.releaseLock();
    }
  }

  const messageReaders = new Map<DialogId, (reson?: any) => void>();


  /**
   * 停止指定对话的消息流
   * @param dialogId 对话ID
   */
  const stopMessage = async (dialogId: DialogId) => {
    if (!dialogId) return;
    const abort = messageReaders.get(dialogId);
    if (abort) {
      abort();
      messageReaders.delete(dialogId);
    }
  }


  /**
   * 发送消息
   * @param userMessage 消息内容
   * @param chatOptions
   * @param resendId
   * @returns 消息流
   */
  const sendMessage = async (userMessage: ChatMessage, chatOptions: ChatOptions, resendId?: string) => {
    // 创建用户消息
    userMessage.timestamp = Date.now();
    const dialogId = chatOptions.dialogId!;
    messages.value[dialogId] = messages.value[dialogId] || [];
    if (resendId) {
      const resetIndex = messages.value[dialogId].findIndex(message => message.id === resendId);
      if (resetIndex > -1) {
        messages.value[dialogId] = messages.value[dialogId].slice(0, resetIndex);
      }
    }
    messages.value[dialogId].push(userMessage);

    // 调用API发送消息
    const [abort, readableStream] = chatAPI.sendMessage(userMessage, chatOptions, resendId);
    messageReaders.set(dialogId, abort);
    const [assistantStream1, assistantStream2] = readableStream.tee();
    updateMessage(assistantStream1, dialogId);
    return assistantStream2
  }

  /**
   * 获取聊天历史
   * @param dialogId 对话ID
   * @returns 消息数组
   */
  const refreshChatHistory = async (dialogId: DialogId) => {
    if (messages.value[dialogId]) return;
    messages.value[dialogId] = await getChatHistory(dialogId);
  }

  return {
    stopMessage,
    messages,
    sendMessage,
    refreshChatHistory
  }
});