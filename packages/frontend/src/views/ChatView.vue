<template>
  <div class="chat-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo">🧠</span>
        <span class="sidebar-title">智AI助手</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li class="nav-item active">默认助手</li>
          <li class="nav-item">demo</li>
          <li class="nav-item">网页生成</li>
          <li class="nav-item">One Word One...</li>
        </ul>
      </nav>
    </aside>
    <div class="main-panel">
      <header class="app-header">
        <div class="flex items-center">
          <h1 class="mr-4">Ollama</h1>

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
      <main class="main-content">
        <ChatWindow :model="selectedModel" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
import {onMounted, ref} from 'vue';
import {configAPI} from '../services/api';
import {Listbox, ListboxButton, ListboxOption, ListboxOptions,} from '@headlessui/vue'
import {CheckIcon, ChevronUpDownIcon} from '@heroicons/vue/20/solid'

const people = [
  { name: 'Wade Cooper' },
  { name: 'Arlene Mccoy' },
  { name: 'Devon Webb' },
  { name: 'Tom Cook' },
  { name: 'Tanya Fox' },
  { name: 'Hellen Schmidt' },
]
const selectedPerson = ref(people[0])




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

<style>
.chat-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f6fa;
}
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 0 0 20px 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 32px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.logo {
  font-size: 2rem;
  margin-right: 10px;
}
.sidebar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}
.sidebar-nav {
  flex: 1;
  padding: 24px 0 0 0;
}
.sidebar-nav ul {
  list-style: none;
  padding: 0 0 0 24px;
  margin: 0;
}
.nav-item {
  padding: 10px 0 10px 12px;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.2s;
}
.nav-item.active, .nav-item:hover {
  background: #e0e7ef;
  color: #2563eb;
  font-weight: 600;
}
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-header {
  background: #fff;
  padding: 18px 32px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}
.app-header .flex {
  display: flex;
  align-items: center;
}
.app-header h1 {
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.main-content {
  flex: 1;
  padding: 32px 32px 0 32px;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  margin: 0 24px 24px 24px;
  min-height: 0;
  overflow-y: auto;
}
.model-select {
  min-width: 240px;
}

@media (max-width: 900px) {
  .chat-layout { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; border-right: none; border-bottom: 1px solid #e5e7eb; }
  .main-panel { margin: 0; }
  .main-content { margin: 0; border-radius: 0; padding: 16px 8px 0 8px; }
}
</style>