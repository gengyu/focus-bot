<template>
  <div class="flex flex-1 flex-col rounded-xl ">
    <!-- 消息列表区域 -->
    <div class="flex-1 px-6 py-4" ref="messageContainer">
      <div v-for="message in messages" :key="message.timestamp" class="mb-6">
        <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <!-- 头像 -->
          <div v-if="message.role !== 'user'" class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <span class="text-green-600 text-sm">AI</span>
          </div>
          <!-- 消息气泡 -->
          <div :class="[
            'max-w-[70%] rounded-2xl px-4 py-3',
            message.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          ]">
            <!-- 文本消息 -->
            <div v-if="message.type === 'text'" class="break-words text-[15px] leading-relaxed">
              {{ message.content }}
            </div>
            <!-- 图片消息 -->
            <div v-else-if="message.type === 'image'" class="max-w-sm rounded-lg overflow-hidden">
              <img :src="message.imageUrl" alt="聊天图片" class="w-full">
            </div>
            <!-- 消息时间 -->
            <div class="text-xs mt-1 opacity-60">
              {{ new Date(message.timestamp).toLocaleTimeString() }}
            </div>
          </div>
          <!-- 用户头像 -->
          <div v-if="message.role === 'user'" class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-3">
            <span class="text-blue-600 text-sm">我</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class=" bg-white border-b border-[#e5e7eb] sticky bottom-4 shadow-[0_2px_4px_rgba(0,0,0,0.04)]
    border-t mb  px-4 py-3 rounded-xl">
      <!-- 功能按钮区 -->
      <div class="flex gap-2 mb-3">
        <!-- 搜索按钮 -->
        <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" @click="toggleSearch">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <!-- 推理按钮 -->
        <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" @click="toggleReasoning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
        <!-- 图片上传按钮 -->
        <label class="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <input type="file" accept="image/*" class="hidden" @change="handleImageUpload">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </label>
        <!-- 语音输入按钮 -->
        <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" @click="toggleVoiceInput">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      <!-- 输入框区域 -->
      <div class="flex gap-2 items-center">
        <!-- 服务商选择 -->
        <select v-model="selectedProvider" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
        </select>
        <!-- 模型选择 -->
        <select v-if="!props.model" v-model="selectedModel" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">
          <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>
        </select>
        <!-- 文本输入框 -->
        <div class="flex-1 relative">
          <input
            v-model="messageInput"
            type="text"
            placeholder="输入消息..."
            class="w-full px-4 py-2.5 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            @keyup.enter="sendMessage"
          >
        </div>
        <!-- 发送按钮 -->
        <button
          @click="sendMessage"
          class="px-6 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none transition-colors"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps } from 'vue';
import { ChatAPI, type ChatMessage } from '../services/chatApi';
import { configAPI } from '../services/api';

const props = defineProps<{
  model?: string
}>();

const chatApi = new ChatAPI();
const messages = ref<ChatMessage[]>([]);
const messageInput = ref('');
const messageContainer = ref<HTMLElement | null>(null);

// 功能开关状态
const isSearchActive = ref(false);
const isReasoningActive = ref(false);
const isVoiceInputActive = ref(false);

// 功能切换方法
const toggleSearch = () => {
  isSearchActive.value = !isSearchActive.value;
  // TODO: 实现搜索功能
};

const toggleReasoning = () => {
  isReasoningActive.value = !isReasoningActive.value;
  // TODO: 实现推理功能
};

const toggleVoiceInput = () => {
  isVoiceInputActive.value = !isVoiceInputActive.value;
  // TODO: 实现语音输入功能
};

// 服务商与模型相关
const providers = ref<{id: string, name: string, models: string[]}[]>([]);
const selectedProvider = ref('');
const selectedModel = ref(props.model || '');
const availableModels = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value);
  return p ? p.models : [];
});

// 加载服务商配置
const loadProviders = async () => {
  // 假设 configAPI.loadConfig() 返回包含 mcpServers，每个 server 有 models 字段
  const config = await configAPI.loadConfig();
  providers.value = Object.entries(config.mcpServers || {}).map(([id, server]: [string, any]) => ({
    id,
    name: server.name || id,
    models: server.models || ['gpt-3.5-turbo']
  }));
  if (providers.value.length > 0) {
    selectedProvider.value = providers.value[0].id;
    // 如果从父组件传入model，则使用传入的model，否则使用第一个可用的模型
    if (props.model) {
      selectedModel.value = props.model;
    } else if (availableModels.value.length > 0) {
      selectedModel.value = availableModels.value[0];
    }
  }
};

// 加载聊天历史
const loadChatHistory = async () => {
  try {
    messages.value = await chatApi.getChatHistory();
    scrollToBottom();
  } catch (error) {
    console.error('加载聊天历史失败:', error);
  }
};

// 发送文本消息
const sendMessage = async () => {
  if (!messageInput.value.trim()) return;
  
  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: messageInput.value,
    type: 'text',
    timestamp: Date.now()
  };
  messages.value.push(userMessage);
  messageInput.value = '';
  scrollToBottom();
  
  // 使用选定的模型
  const modelToUse = props.model || selectedModel.value;
  
  try {
    const response = await chatApi.sendMessage(userMessage.content, selectedProvider.value, modelToUse);
    messages.value.push(response);
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  try {
    const response = await chatApi.sendImage(input.files[0]);
    messages.value.push(response);
    scrollToBottom();
  } catch (error) {
    console.error('上传图片失败:', error);
  }

  // 清除input的value，允许上传相同的文件
  input.value = '';
};

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  }, 100);
};

onMounted(() => {
  loadChatHistory();
});
</script>
