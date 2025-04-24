import {defineStore} from 'pinia';
import {type Ref, ref} from "vue";
import type {DialogState, Model} from "../../../../share/type.ts";
import {chatAPI} from "../services/chatApi.ts";


export const useDialogStore = defineStore<string, {
  dialogState: Ref<DialogState>,
  updateModel: (model: Model) => void
  setActiveDialog: (id: string) => void
}>('dialog', () => {


  const dialogState = ref<DialogState>({
    dialogs: [],
    activeDialogId: '',
  });

  const initialize = async () => {
    const dialogs = await chatAPI.getDialogList()
    dialogState.value.dialogs = dialogs.dialogs
    dialogState.value.activeDialogId = dialogs.activeDialogId
  }
  initialize();

  const saveDialog = async () => {
    await chatAPI.saveDialogList(dialogState.value)
  }


  const updateModel = (model: Model) => {
    const dialog = dialogState.value.dialogs.find(d => d.dialogId === dialogState.value.activeDialogId);
    if (!dialog) {
      return;
    }
    dialog.model = model;
    saveDialog();
  }

  const setActiveDialog = (chatId: string) => {
    dialogState.value.activeDialogId = chatId;
    saveDialog();
  }

  return {
    dialogState,
    updateModel,
    setActiveDialog,
  }
});