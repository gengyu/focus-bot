import {defineStore} from 'pinia';
import {ref, type Ref} from "vue";
import type {ChatMessage, Dialog, Conversation, Model} from "../../../../share/type.ts";
import { ConversationStore, ContextManager, MessageHandler } from "./conversationManager";

// 创建单例实例
const contextManager = new ContextManager();
const conversationStore = new ConversationStore();
const messageHandler = new MessageHandler(contextManager);

export const useDialogStore = defineStore<string, {
  dialogState: Ref<Conversation>,
  updateModel: (model: Model) => Promise<void>,
  setActiveDialog: (id: string) => Promise<void>,
  createConversation: (title: string, model?: Model) => Promise<Dialog>,
  sendMessage: (content: string, model: Model, conversationId: string) => ReadableStream<ChatMessage>,
  sendImage: (imageFile: File) => Promise<ChatMessage>,
  getChatHistory: (conversationId: string) => Promise<ChatMessage[]>
}>('dialog', () => {

  // 获取对话状态引用
  const dialogState = ref(conversationStore.getDialogState());

  /**
   * 更新模型
   * @param model 模型信息
   */
  const updateModel = async (model: Model) => {
    await conversationStore.updateModel(model);
  }

  /**
   * 设置活动对话
   * @param chatId 对话ID
   */
  const setActiveDialog = async (chatId: string) => {
    await conversationStore.setActiveConversation(chatId);
  }

  /**
   * 创建新对话
   * @param title 对话标题
   * @param model 模型信息
   * @returns 新对话对象
   */
  const createConversation = async (title: string, model?: Model) => {
    return await conversationStore.createConversation(title, model);
  }

  /**
   * 发送消息
   * @param content 消息内容
   * @param model 模型信息
   * @param conversationId 对话ID
   * @returns 消息流
   */
  const sendMessage = (content: string, model: Model, conversationId: string) => {
    return messageHandler.sendMessage(conversationId, content, model);
  }

  /**
   * 发送图片
   * @param imageFile 图片文件
   * @returns 消息对象
   */
  const sendImage = async (imageFile: File) => {
    return await messageHandler.sendImage(imageFile);
  }

  /**
   * 获取聊天历史
   * @param conversationId 对话ID
   * @returns 消息数组
   */
  const getChatHistory = async (conversationId: string) => {
    return await messageHandler.getChatHistory(conversationId);
  }

  return {
    dialogState,
    updateModel,
    setActiveDialog,
    createConversation,
    sendMessage,
    sendImage,
    getChatHistory
  }
});