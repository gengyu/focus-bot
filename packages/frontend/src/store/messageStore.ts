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
  sendMessage(message: ChatMessage, model: Model, dialogId: DialogId): Promise<ReadableStream<ChatMessage>>,
  stopMessage(dialogId: DialogId): void,
  // sendImage: (imageFile: File) => Promise<ChatMessage>,
  refreshChatHistory: (dialogId: DialogId) => Promise<void>
}>('message', () => {

  const messages = ref<Record<DialogId, ChatMessage[]>>({});

  const updateMessage = async (readableStream: ReadableStream, dialogId: DialogId) => {
    const reader = readableStream.getReader();
    try {
      let assistantMessage = reactive<ChatMessage>({
        content: [{
          type: 'text',
          text: '',
          images: [],
          files: []
        }],
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
   * 删除指定对话中的某条消息
   * @param dialogId 对话ID
   * @param messageIndex 消息索引
   */
  const deleteMessage = (dialogId: DialogId, messageiId: number) => {
    const dialogMessages = messages.value[dialogId];
    if (dialogMessages && dialogMessages[messageIndex]) {
      dialogMessages.splice(messageIndex, 1);
    }
  };

  /**
   * 停止指定对话的消息流
   * @param dialogId 对话ID
   */
  const stopMessage = async (dialogId: DialogId) => {
    if(!dialogId) return;
    const abort = messageReaders.get(dialogId);
    if (abort) {
      abort();
      messageReaders.delete(dialogId);
    }
  }


  /**
   * 发送消息
   * @param userMessage 消息内容
   * @param model 模型信息
   * @param dialogId 对话ID
   * @returns 消息流
   */
  const sendMessage = async (userMessage: ChatMessage, model: Model, dialogId: DialogId) => {
    // 创建用户消息
    userMessage.timestamp = Date.now();
    messages.value[dialogId] = messages.value[dialogId] || [];
    messages.value[dialogId].push(userMessage);

    // 调用API发送消息
    const [abort, readableStream] = chatAPI.sendMessage(userMessage, model, dialogId);
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
    messages.value[dialogId] = await chatAPI.getChatHistory(dialogId);
  }

  return {
    stopMessage,
    messages,
    sendMessage,
    refreshChatHistory
  }
});