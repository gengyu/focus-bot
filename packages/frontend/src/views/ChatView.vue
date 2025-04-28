<template>
  <div class="flex min-h-screen bg-[#f5f6fa]">
    <aside
        class="transition-all duration-300 bg-white border-r border-[#e5e7eb] flex flex-col pb-5 shadow-[2px_0_8px_rgba(0,0,0,0.04)]"
        :class="[isAsideCollapsed ? 'w-10 overflow-hidden' : 'w-60']"
    >
      <div class="flex items-center h-14 px-3 border-b border-[#f0f0f0]">
        <span class="text-base mr-2.5">🧠</span>
        <span class="text-xl font-bold text-[#1f2937]">智AI助手</span>
      </div>
      <nav class="flex-1 pt-6">
        <div v-for="group in groupedChats" :key="group.title" class="mb-4">
          <div class="pl-6 text-sm text-gray-500 mb-2">{{ group.title }}</div>
          <ul class="pl-6 m-0">
            <li
                @click="handlerSelectChat(chat.dialogId)"
                v-for="chat in group.chats"
                :key="chat.dialogId"
                class="px-3 py-2.5 rounded-lg text-[#374151] cursor-pointer mb-1.5 transition-colors duration-200"
                :class="{
                'bg-[#e0e7ef] text-[#2563eb] font-semibold': dialogState.activeDialogId === chat.dialogId,
                'hover:bg-[#e0e7ef] hover:text-[#2563eb] hover:font-semibold': dialogState.activeDialogId !== chat.dialogId
              }"
            >
              {{ chat.title }}
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    <div
        ref="messageContainer"
        class="flex-1 relative flex flex-col min-w-0 h-screen scroll-smooth overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
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
            :chat-messages="activeChatMessages"
            :model="selectedModel"
            :chatId="dialogState.activeDialogId"
            @scroll="handlerScroll"
            class="max-w-260"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
import {onMounted, ref, computed, watch, nextTick} from 'vue';
import {configAPI} from '../services/api';
import {Listbox, ListboxButton, ListboxOption, ListboxOptions} from '@headlessui/vue'
import {CheckIcon, ChevronUpDownIcon} from '@heroicons/vue/20/solid'
import {useProviderStore} from "@/store/providerStore.ts";
import {type Chat, type ChatMessage, Dialog, Model} from "../../../../share/type.ts";
import {useDialogStore} from "@/store/dialogStore.ts";
import {chatAPI} from "@/services/chatApi.ts";
import log from "loglevel";


const {providerConfig} = useProviderStore();
const models = computed<Model[]>(() => {
  const models = providerConfig?.providers?.filter(provider => provider.enabled) || []
  return models.flatMap(provider => provider.models) || [];
});

const selectedModel = ref<Model>({
  providerId: '',
  id: '',
  name: '',
  description: '',
  size: '',
  enabled: false,
});

watch(() => models.value, (newModels) => {
  if(!selectedModel.value.id){
    selectedModel.value = newModels[0];
  }
})


const {dialogState, updateModel, setActiveDialog} = useDialogStore();
const activeChatMessages = computed(() => {
  const activeDialog = dialogState.dialogs.find(dialog => dialog.dialogId === dialogState.activeDialogId);
  return activeDialog?.messages || [];
});

// 监听model变化，更新activeDialog.model
const handlerSelectModel = () => {
  nextTick(() => {
    updateModel(selectedModel.value)
  });
}

const handlerSelectChat = (chatId: string)=> {
  setActiveDialog(chatId)
}

watch(() => dialogState.activeDialogId, () => {

  const activeDialog = dialogState.dialogs.find(dialog => dialog.dialogId === dialogState.activeDialogId);
  console.log(activeDialog,55555)
  if (activeDialog?.model) {
    selectedModel.value = activeDialog.model!;
  }else {
   if(models.value.length> 0) selectedModel.value = models.value[0];
  }
});




const messages = ref<ChatMessage[]>([]);
// 加载聊天历史
const loadChatHistory = async () => {
  try {
    messages.value = await chatAPI.getChatHistory();
  } catch (error) {
    log.error("Failed to load chat history:", error);
  }
};
watch(() => dialogState.activeDialogId, (newDialogs) => {
  loadChatHistory()
});



const messageContainer = ref<HTMLElement | undefined>(undefined);


const handlerScroll = () => {
  if (messageContainer.value) {
    const container: HTMLElement = messageContainer.value;
    const scrollOptions = {
      top: container.scrollHeight,
      behavior: 'smooth' as ScrollBehavior
    };
    container.scrollTo(scrollOptions);
  }
};

// 计算分组的聊天列表
const groupedChats = computed<Array<{ title: string; chats: Dialog[]}>>(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = [
    {title: '今天', chats: []},
    {title: '昨天', chats: []},
    {title: '最近7天', chats: []},
    {title: '最近30天', chats: []},
  ];

  dialogState.dialogs.forEach(chat => {
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

// onMounted(async () => {
//   try {
//     // 从配置中加载可用模型
//     const config = await configAPI.loadConfig();
//     if (config.mcpServers) {
//       // 合并所有服务器的模型列表
//       const allModels = Object.values(config.mcpServers)
//           .flatMap((server: any) => server.models || [])
//           .filter((model: string) => model); // 过滤空值
//
//       if (allModels.length > 0) {
//         availableModels.value = allModels;
//         // 如果当前选择的模型不在列表中，则选择第一个
//         if (!availableModels.value.includes(selectedModel.value)) {
//           selectedModel.value = availableModels.value[0];
//         }
//       }
//     }
//   } catch (error) {
//     log.error('Failed to load model list:', error);
//   }
// });
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