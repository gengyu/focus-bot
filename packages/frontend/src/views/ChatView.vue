<template>
  <div class="flex h-screen bg-[#f5f6fa]">
    <aside
        class="transition-all duration-300 bg-white border-r border-[#e5e7eb] flex flex-col pb-5 shadow-[2px_0_8px_rgba(0,0,0,0.04)]"
        :class="[isAsideCollapsed ? 'w-10 overflow-hidden' : 'w-60']"
    >
      <div class="flex items-center h-14 px-3 border-b border-[#f0f0f0]">
        <svg class="w-6 h-6 mr-2.5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L14.5 9.5L20 12L14.5 14.5L12 20L9.5 14.5L4 12L9.5 9.5L12 4Z" fill="currentColor"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
        <span class="text-xl font-bold text-[#1f2937]">Focus Bot</span>
      </div>
      <div class="px-3 py-4 border-b border-[#f0f0f0]">
        <button @click="createNewChat"
                class="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          新建对话
        </button>
      </div>
      <nav class="flex-1 pt-4">
        <div v-for="group in groupedChats" :key="group.title" class="mb-4">
          <div class="pl-6 text-sm text-gray-500 mb-2">{{ group.title }}</div>
          <ul class="pl-6 m-0">
            <li
                v-for="chat in group.chats"
                :key="chat.id"
                class="group relative flex items-center px-3 py-2 mr-2.5 rounded-sm text-[#374151] cursor-pointer mb-1.5 transition-colors duration-200"
                :class="{
                'bg-[#e0e7ef] text-[#2563eb] font-semibold ': conversation.activeDialogId === chat.id,
                'hover:bg-[#e0e7ef] hover:text-[#2563eb] hover:font-semibold': conversation.activeDialogId !== chat.id
              }"
            >
              <div class="flex-1 flex items-center" @click="handlerSelectChat(chat.id)">
                <input v-if="isEditing && chat.id == editDialog.id"
                       v-model="editDialog.title"
                       @blur="saveTitle()"
                       @keyup.enter="saveTitle()"
                       class="w-full bg-transparent border-none focus:ring-0 px-0 "
                       type="text"
                />
                <span v-else class="truncate">{{ chat.title }}</span>
              </div>
              <div class="hidden group-hover:flex items-center gap-1">
                <button @click="startEditTitle(chat)" class="p-1 hover:text-blue-600 rounded">
                  <svg v-if="isEditing && chat.id === editDialog.id" class="w-4 h-4" fill="none" stroke="currentColor"
                       viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button @click="deleteChat(chat.id)" class="p-1 hover:text-red-600 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    <div
        ref="messageContainer"
        class="flex-1 relative flex flex-col

         min-w-0
         h-screen
          scroll-smooth
         overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300
         hover:scrollbar-thumb-gray-400"
    >
      <header class="h-14 flex items-center px-8 text-left sticky top-0 z-10">
        <div class="flex items-center">
          <button
              @click="toggleAside"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 class="text-md font-bold text-[#1f2937] m-0 mr-4">Ollama</h1>

          <div class="model-select px-3 py-1">
            <Listbox v-model="selectedModel" @update:model-value="handlerSelectModel">
              <div class="relative">
                <ListboxButton
                    class="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate">{{ selectedModel.name }}</span>
                  <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <ChevronUpDownIcon
                        class="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                    />
                  </span>
                </ListboxButton>

                <transition
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                >
                  <ListboxOptions
                      class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                        v-slot="{ active, selected }"
                        v-for="model in models"
                        :key="model.name"
                        :value="model"
                        as="template"
                    >
                      <li
                          :class="[
                          active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span
                            :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                        >{{ model.name }}</span>
                        <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                        >
                          <CheckIcon class="h-5 w-5" aria-hidden="true"/>
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>
          </div>
        </div>
      </header>
      <main class="flex-1 flex justify-center rounded-b-xl mx-6 mb-6 min-h-0">
        <ChatWindow
            :model="selectedModel"
            :activeDialogId="conversation.activeDialogId"
            @scroll="handlerScroll"
            class="max-w-260"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
import {computed, nextTick, onMounted, ref} from 'vue';
import {Listbox, ListboxButton, ListboxOption, ListboxOptions} from '@headlessui/vue'
import {CheckIcon, ChevronUpDownIcon} from '@heroicons/vue/20/solid'
import {useAppSettingStore} from "../store/appSettingStore.js";
import {type Dialog, type DialogId, type Model} from "../../../../share/type.ts";
import {useConversationStore} from "../store/conversationStore.ts";

import {toast} from "vue3-toastify";


const {appSetting} = useAppSettingStore();

const models = computed<Model[]>(() => {
  const models = appSetting?.providers?.filter(provider => provider.enabled) || []
  return models.flatMap(provider => provider.models) || [];
});

const {conversation, updateModel, setActiveDialog, createDialog, deleteDialog, updateDialog} = useConversationStore();


// 设置 model
const selectedModel = ref<Model>(models.value[0] ? models.value[0] : {
  providerId: '',
  id: '',
  name: '',
  description: '',
  size: '',
  enabled: false,
});
onMounted(() => {
  const activeDialog = conversation.dialogs.find(dialog => dialog.id === conversation.activeDialogId);
  if(activeDialog?.model){
    selectedModel.value = activeDialog?.model;
  }
})



// watch(() => conversation.activeDialogId, () => {
//   const activeDialog = conversation.dialogs.find(dialog => dialog.id === conversation.activeDialogId);
//   if (activeDialog?.model) {
//     selectedModel.value = activeDialog.model!;
//   } else {
//     if (models.value.length > 0) selectedModel.value = models.value[0];
//   }
// });


// 监听model变化，更新activeDialog.model
const handlerSelectModel = async () => {
  await updateModel(selectedModel.value);
}

const handlerSelectChat = async (dailogId: DialogId) => {
  await setActiveDialog(dailogId);
  const activeDialog = conversation.dialogs.find(dialog => dialog.id === conversation.activeDialogId);
    if (activeDialog?.model) {
    selectedModel.value = activeDialog.model!;
  } else {
    if (models.value.length > 0) selectedModel.value = models.value[0];
  }

  await nextTick();
  handlerScroll();
}


const messageContainer = ref<HTMLElement | undefined>(undefined);


const isUserScrolling = ref(false);
const isAutoScrolling = ref(false);
let scrollTimeout: number | undefined;

const handlerScroll = (arg?:{force:boolean}) => {
  if(arg?.force){
    isUserScrolling.value = false;
  }

  // 手动触发，不触发自动滚动
  if(isUserScrolling.value) return;

  if (messageContainer.value ) {
    const container: HTMLElement = messageContainer.value;
    const documentHeight = container.scrollHeight;   // 获取页面总高度
    const scrollTop = container.scrollTop;  // 获取当前滚动距离
    const windowHeight = container.clientHeight;   // 获取视口高度
    const distanceFromBottom = documentHeight - scrollTop - windowHeight;
    // 只有当距离底部超过110px时才自动滚动
    if (distanceFromBottom > 110) {
      isAutoScrolling.value = true;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
};

onMounted(() => {
  if (messageContainer.value) {
    const container = messageContainer.value;
    
    // 监听滚动事件
    container.addEventListener('scroll', () => {
      // 自动滚动
      if (isAutoScrolling.value) {
        isAutoScrolling.value = false;
      }
    });
    
    // 监听鼠标事件
    container.addEventListener('mousedown', () => {
      isUserScrolling.value = true;
    });
    
    container.addEventListener('mouseup', () => {
      // 增加延迟，防止mouseup后立即执行的代码滚动被错误地认为是用户滚动
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling.value = false;
      }, 100);
    });
    
    // 监听触摸事件
    container.addEventListener('touchstart', () => {
      isUserScrolling.value = true;
    });
    
    container.addEventListener('touchend', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling.value = false;
      }, 100);
    });
    
    // 监听键盘事件
    container.addEventListener('keydown', (event) => {
      // 监听可能触发滚动的键盘按键
      if (
        event.key === 'PageUp' || 
        event.key === 'PageDown' || 
        event.key === 'ArrowUp' || 
        event.key === 'ArrowDown' || 
        event.key === 'Home' || 
        event.key === 'End' || 
        event.key === ' '
      ) {
        isUserScrolling.value = true;
        // 键盘操作可能触发多次滚动事件，需要延迟重置
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isUserScrolling.value = false;
        }, 200);
      }
    });
  }
  
  // 初始滚动
  handlerScroll();
});


onMounted(handlerScroll);

// 计算分组的聊天列表
const groupedChats = computed<Array<{ title: string; chats: Dialog[] }>>(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups: Array<{ title: string; chats: Dialog[] }> = [
    {title: '今天', chats: []},
    {title: '昨天', chats: []},
    {title: '最近7天', chats: []},
    {title: '最近30天', chats: []},
  ];

  conversation.dialogs.forEach(chat => {
    const chatDate = new Date(chat.timestamp);
    if (chatDate >= today) {
      groups[0].chats.push(chat);
    } else if (chatDate >= yesterday) {
      groups[1].chats.push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      groups[2].chats.push(chat);
    } else if (chatDate >= thirtyDaysAgo) {
      groups[3].chats.push(chat);
    }
  });

  // 只返回有聊天记录的分组
  return groups.filter(group => group.chats.length > 0);
});


// const selectedModel = ref('gemma-3:latest');
// const availableModels = ref(['gemma-3:latest', 'llama3', 'mistral', 'phi-3']);
const isAsideCollapsed = ref(false);

const toggleAside = () => {
  isAsideCollapsed.value = !isAsideCollapsed.value;
};

const createNewChat = async () => {
  await createDialog();
};

const deleteChat = async (chatId: string) => {
  if (confirm('确定要删除这个对话吗？')) {
    toast.promise(
        () => deleteDialog(chatId),
        {
          loading: '正在删除对话...',
          success: '对话已删除',
          error: '删除失败',
        }
    );
  }
};


const isEditing = ref(false);
const editDialog = ref<Partial<Dialog>>({
  id: '',
  title: '',
});
const startEditTitle = (chat: Dialog) => {
  editDialog.value = {...chat,}
  isEditing.value = true;
  nextTick(() => {
    const input = document.querySelector(`input[type="text"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const saveTitle = async () => {
  // const title =  editDialog.value.title.trim()
  if (editDialog.value.id && editDialog.value.title && editDialog.value.title.trim() !== '') {
    await updateDialog(editDialog.value.id, {title: editDialog.value.title});
  }
  isEditing.value = false;
};
</script>

<style lang="less">
.model-select {
  min-width: 240px;
}

//@media (max-width: 900px) {
//  aside {
//    @apply w-full flex-row border-r-0 border-b;
//  }
//  .main-panel {
//    @apply m-0;
//  }
//  main {
//    @apply m-0 rounded-none px-2 pt-4;
//  }
//}
</style>
