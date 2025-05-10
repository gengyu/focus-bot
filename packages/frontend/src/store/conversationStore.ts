import {defineStore} from 'pinia';
import {ref, type Ref} from "vue";
import type {Conversation, Dialog, DialogId, Model} from "../../../../share/type.ts";
import {chatAPI} from "../services/chatApi.ts";
import {useMessageStore} from "./messageStore.ts";
import {generateUUID} from "../utils/uuid.ts";
import {useAppSettingStore} from "./appSettingStore.ts";

// 创建单例实例

/**
 * 会话存储 conversationStore 包含的所有对话数据，包括对话列表、活动对话ID等。
 * 提供创建、删除、更新对话等功能，并管理对话列表的状态。
 * 负责会话数据的状态管理和持久化
 */
export const useConversationStore = defineStore<string, {
  conversation: Ref<Conversation>,
  updateModel: (model: Model) => Promise<void>,
  setActiveDialog: (dailogId: string) => Promise<void>,

  createDialog: () => Promise<void>,
  deleteDialog: (dialogId: DialogId) => Promise<void>,
  updateDialog: (dialogId: DialogId, dialog: Partial<Dialog>) => Promise<void>,

  initialize: () => Promise<void>,
}>('conversation', () => {
  const conversation = ref<Conversation>({
    dialogs: [
      //     id: DialogId;
      //     title: string;
      //     conversationId: string,
      //     timestamp: number;
      //     model?: Model
    ],
    activeDialogId: '',
    id: '',
  });

  const messaageStore = useMessageStore();
  const appSettingStore = useAppSettingStore();

  const initialize = async () => {
    const dialogState = await chatAPI.getDialogList()
    conversation.value.dialogs = dialogState.dialogs || []
    conversation.value.activeDialogId = dialogState.activeDialogId ?? '';
    if (conversation.value.activeDialogId) {
      const dialog = conversation.value.dialogs.find(
        (dialog) => dialog.id == conversation.value.activeDialogId
      );
      if (dialog && !dialog.model) {
        const defaultModel = appSettingStore.appSetting?.providers?.[0].models?.[0];
        defaultModel && updateModel(defaultModel);
      }
    }
    await messaageStore.refreshChatHistory(dialogState.activeDialogId);
  }


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
    await messaageStore.refreshChatHistory(conversation.value.activeDialogId);
  }


  /**
   * 创建新对话
   * @returns 新对话对象
   */

  const createDialog = async () => {
    const dialogId = generateUUID();
    const model = appSettingStore.appSetting?.providers?.[0]?.models?.[0];
    conversation.value.dialogs.unshift({
      id: dialogId,
      title: '新会话',
      timestamp: Date.now(),
      conversationId: conversation.value.id,
      model,
    })
    conversation.value.activeDialogId = dialogId;
    await chatAPI.saveDialogList(conversation.value);
  }

  /**
   * 删除对话
   * @param dialogId
   */
  const deleteDialog = async (dialogId: DialogId) => {
    if (!dialogId) return;

    conversation.value.dialogs = conversation.value.dialogs.filter(dialog => dialog.id !== dialogId);
    if (dialogId === conversation.value.activeDialogId) {
      conversation.value.activeDialogId = conversation.value.dialogs[0]?.id;
    }
    if (!conversation.value.activeDialogId) {
      await createDialog();
    } else {
      await chatAPI.saveDialogList(conversation.value);
    }
  }

  /**
   * 更新对话
   * @param dialogId
   * @param dialog
   */
  const updateDialog = async (dialogId: DialogId, dialog: Partial<Dialog>) => {
    if (!dialogId) return;
    conversation.value.dialogs = conversation.value.dialogs.map(item => {
      if (item.id === dialogId) {
        return {...item, ...dialog}
      }
      return item;
    });
    await chatAPI.saveDialogList(conversation.value);
  }

  // createDialog, deleteDialog, updateDialog

  return {
    conversation,
    updateModel,
    setActiveDialog,
    createDialog,
    deleteDialog,
    updateDialog,
    initialize,
    // sendMessage,
    // sendImage,
    // getChatHistory
  }
});