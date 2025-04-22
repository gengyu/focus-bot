<template>
  <div class="flex min-h-screen bg-[#f5f6fa]">
    <aside class="w-60 bg-white border-r border-[#e5e7eb] flex flex-col pb-5 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
      <div class="flex items-center h-14 px-3 border-b border-[#f0f0f0]">
        <span class="text-base mr-2.5">🧠</span>
        <span class="text-xl font-bold text-[#1f2937]">智AI助手</span>
      </div>
      <nav class="flex-1 pt-6">
        <div v-for="group in groupedChats" :key="group.title" class="mb-4">
          <div class="pl-6 text-sm text-gray-500 mb-2">{{ group.title }}</div>
          <ul class="pl-6 m-0">
            <li v-for="chat in group.chats" :key="chat.id" 
                class="px-3 py-2.5 rounded-lg text-[#374151] cursor-pointer mb-1.5 transition-colors duration-200"
                :class="{
                  'bg-[#e0e7ef] text-[#2563eb] font-semibold': chat.isActive,
                  'hover:bg-[#e0e7ef] hover:text-[#2563eb] hover:font-semibold': !chat.isActive
                }">
              {{ chat.title }}
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white py-4.5 px-8 border-b border-[#e5e7eb] shadow-[0_2px_4px_rgba(0,0,0,0.04)] text-left sticky top-0 z-10">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-[#1f2937] m-0 mr-4">Ollama</h1>

          <div class="model-select px-3 py-1   " >
            <Listbox v-model="selectedPerson">
              <div class="relative mt-1">
                <ListboxButton
                    class="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate">{{ selectedPerson.name }}</span>
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
                        v-for="person in people"
                        :key="person.name"
                        :value="person"
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
                >{{ person.name }}</span
                >
                        <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                        >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
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
      <main class="flex-1 px-8 pt-8 pb-0 bg-[#f9fafb] rounded-b-xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] mx-6 mb-6 min-h-0 overflow-y-auto">
        <ChatWindow :model="selectedModel" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
import { onMounted, ref, computed } from 'vue';
import { configAPI } from '../services/api';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'

// 模拟聊天数据
const chats = ref([
  { id: 1, title: '默认助手', timestamp: new Date(), isActive: true },
  { id: 2, title: 'demo', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), isActive: false },
  { id: 3, title: '网页生成', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), isActive: false },
  { id: 4, title: 'One Word One...', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), isActive: false },
]);

// 计算分组的聊天列表
const groupedChats = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = [
    { title: '今天', chats: [] },
    { title: '昨天', chats: [] },
    { title: '最近7天', chats: [] },
    { title: '最近30天', chats: [] },
  ];

  chats.value.forEach(chat => {
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

const people = [
  { name: 'Wade Cooper' },
  { name: 'Arlene Mccoy' },
  { name: 'Devon Webb' },
  { name: 'Tom Cook' },
  { name: 'Tanya Fox' },
  { name: 'Hellen Schmidt' },
];
const selectedPerson = ref(people[0]);




const selectedModel = ref('gemma-3:latest');
const availableModels = ref(['gemma-3:latest', 'llama3', 'mistral', 'phi-3']);

onMounted(async () => {
  try {
    // 从配置中加载可用模型
    const config = await configAPI.loadConfig();
    if (config.mcpServers) {
      // 合并所有服务器的模型列表
      const allModels = Object.values(config.mcpServers)
        .flatMap((server: any) => server.models || [])
        .filter((model: string) => model); // 过滤空值
      
      if (allModels.length > 0) {
        availableModels.value = allModels;
        // 如果当前选择的模型不在列表中，则选择第一个
        if (!availableModels.value.includes(selectedModel.value)) {
          selectedModel.value = availableModels.value[0];
        }
      }
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
  }
});
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