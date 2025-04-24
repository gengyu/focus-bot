import {defineStore} from 'pinia';
import {type Ref, ref} from "vue";
import type {DialogState, Model} from "../../../../share/type.ts";


export const useDialogStore = defineStore<string, {
  dialogState: Ref<DialogState>,
  updateModel: ( model: Model) => void
  setActiveDialog: (id: string) => void
}>('dialog', () => {
  const dialogState = ref<DialogState>({
    dialogs: [
      {
        id: '1',
        messages: [
          {
            id: '1',
            role: 'user',
            content: '你好',
            timestamp: Date.now(),
            type: 'text',
            imageUrl: ''
          },
          {
            id: '2',
            role: 'assistant',
            content: '你好，我是一个AI助手，你可以问我任何问题。',
            timestamp: Date.now(),
            type: 'text',
            imageUrl: ''
          }
        ], title: '默认助手1', timestamp: new Date().getTime()
      },
      {id: '2', messages: [], title: 'demo1', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).getTime()},
      {id: '3', messages: [], title: '网页生成', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime()},
      {
        id: '4',
        messages: [],
        title: 'One Word One...',
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getTime()
      },

    ],
    activeDialogId: '1',
  });



  const updateModel = (model: Model)=> {
    const dialog = dialogState.value.dialogs.find(d => d.id === dialogState.value.activeDialogId);
    if (!dialog) {
      return;
    }
    dialog.model = model;
  }

  const setActiveDialog = (chatId: string) => {
    dialogState.value.activeDialogId = chatId;
  }

  return {

    dialogState,
    updateModel,
    setActiveDialog,
  }

  // actions: {
  //   addDialog(dialog: Dialog) {
  //     this.dialogs.unshift(dialog);
  //     this.activeDialogId = dialog.id;
  //   },
  //   removeDialog(id: string) {
  //     this.dialogs = this.dialogs.filter(d => d.id !== id);
  //     if (this.activeDialogId === id) {
  //       this.activeDialogId = this.dialogs.length > 0 ? this.dialogs[0].id : null;
  //     }
  //   },
  //   updateDialog(dialog: Dialog) {
  //     const idx = this.dialogs.findIndex(d => d.id === dialog.id);
  //     if (idx !== -1) {
  //       this.dialogs[idx] = dialog;
  //     }
  //   },
  //   setActiveDialog(id: string) {
  //     this.activeDialogId = id;
  //   },
  //   addMessageToDialog(dialogId: string, message: Message) {
  //     const dialog = this.dialogs.find(d => d.id === dialogId);
  //     if (dialog) {
  //       dialog.messages.push(message);
  //       dialog.timestamp = Date.now();
  //     }
  //   },
  //   clearDialogs() {
  //     this.dialogs = [];
  //     this.activeDialogId = null;
  //   }
  // }
});