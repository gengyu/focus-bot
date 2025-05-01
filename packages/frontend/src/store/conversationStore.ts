import {defineStore} from 'pinia';
import {ref, type Ref} from "vue";
import type {Conversation, Model} from "../../../../share/type.ts";
import {chatAPI} from "../services/chatApi.ts";
import {useMessageStore} from "./messageStore.ts";

// 创建单例实例

/**
 * 会话存储
 * 负责会话数据的状态管理和持久化
 */
export const useConversationStore = defineStore<string, {
  conversation: Ref<Conversation>,
  updateModel: (model: Model) => Promise<void>,
  setActiveDialog: (dailogId: string) => Promise<void>,
  createConversation: (title: string, model?: Model) => Promise<Conversation>,

}>('conversation', () => {
  const conversation = ref<Conversation>({
    dialogs: [],
    activeDialogId: '',
  });
  const messaageStore = useMessageStore();

  const initialize = async () => {
    const dialogState = await chatAPI.getDialogList()
    conversation.value.dialogs = dialogState.dialogs
    conversation.value.activeDialogId = dialogState.activeDialogId;
    await messaageStore.refreshChatHistory(dialogState.activeDialogId);
  }
  initialize();

  /**
   * 更新模型
   * @param model 模型信息
   */
  const updateModel = async (model: Model) => {
    if (!conversation.value.activeDialogId) return;
    const dialog = conversation.value.dialogs.find(dialog => dialog.id === conversation.value.activeDialogId);
    if (!dialog) return;
    dialog.model = model;
    // 保存到存储
    await chatAPI.saveDialogList(conversation.value);

  }


  /**
   * 设置活动对话
   * @param dailogId 对话ID
   */
  const setActiveDialog = async (dailogId: string) => {
    conversation.value.activeDialogId = dailogId;
    await chatAPI.saveDialogList(conversation.value);
    await messaageStore.refreshChatHistory( conversation.value.activeDialogId);
  }


  /**
   * 创建新对话
   * @param title 对话标题
   * @param model 模型信息
   * @returns 新对话对象
   */
    // @ts-ignore
  const createConversation = async (title: string, model?: Model):Promise<Conversation> => {
    console.log(title, model)
    // return await conversationStore.createConversation(title, model);

  }


  return {
    conversation,
    updateModel,
    setActiveDialog,
    createConversation,
    // sendMessage,
    // sendImage,
    // getChatHistory
  }
});