<template>
  <div class="flex flex-1 flex-col rounded-xl ">
    <!-- 消息列表区域 -->
    <div class="flex-1 px-6 py-4" ref="messageContainer">

      <div v-for="message in chatMessages" :key="message.timestamp" class="mb-6">
        <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <!-- 头像 -->
          <div v-if="message.role !== 'user'"
               class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
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
          <div v-if="message.role === 'user'"
               class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-3">
            <span class="text-blue-600 text-sm">我</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class=" bg-white border-b border-[#e5e7eb] sticky bottom-4 shadow-[0_2px_4px_rgba(0,0,0,0.04)]
    border-t mb px-4 py-3 rounded-xl ring-1 ring-transparent
    focus-within:ring-blue-500 focus-within:ring-opacity-50 focus-within:shadow-[0_2px_8px_rgba(37,99,235,0.15)] transition-all duration-200">


      <!-- 图片预览区域 -->
      <div v-if="imagePreview" class="mb-3 flex items-center gap-2">
        <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
          <img :src="imagePreview" alt="图片预览" class="w-full h-full object-cover">
          <button @click="cancelImageUpload"
                  class="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <span class="text-sm text-gray-500">{{ imageFileName }}</span>
      </div>

      <!-- 输入框区域 -->
      <div>
        <!-- 服务商选择 -->
        <!--        <select v-model="selectedProvider" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">-->
        <!--          <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>-->
        <!--        </select>-->
        <!-- 模型选择 -->
        <!--        <select v-if="!props.model" v-model="selectedModel" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-blue-500">-->
        <!--          <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>-->
        <!--        </select>-->
        <!-- 文本输入框 -->


        <!--          bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors overflow-y-auto-->
        <div ref="editableDiv"
             contenteditable="true"
             class="min-h-[72px] max-h-[200px] w-full px-4 py-2.5  focus:outline-none"
             :class="{'empty-content': !messageInput}"
             @input="handleInput"
             @keydown.enter.ctrl.prevent="sendMessage"
             @paste.prevent="handlePaste"
        ></div>
        <div class="flex justify-between">
          <!-- 功能按钮区 -->
          <div class=" bottom-2 left-3 flex items-center gap-2">
            <!-- 搜索按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isSearchActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleSearch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isSearchActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <!-- 推理按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isReasoningActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleReasoning"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isReasoningActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </button>
            <!-- 图片上传按钮 -->
            <label
                class="p-1.5 rounded-lg transition-colors cursor-pointer"
                :class="[isImageUploadActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
            >
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isImageUploadActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </label>

          </div>
          <!--          <div class="text-xs text-gray-400 mt-1 text-right">按 Ctrl + Enter 发送</div>-->

          <!-- 发送按钮 -->
          <div class="flex items-center gap-2">
            <!-- 语音输入按钮 -->
            <button
                class="p-1.5 rounded-lg transition-colors"
                :class="[isVoiceInputActive ? 'bg-blue-100' : 'hover:bg-gray-200']"
                @click="toggleVoiceInput"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                   :class="[isVoiceInputActive ? 'text-blue-500' : 'text-gray-500']" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </button>
            <button
                @click="sendMessage"
                class="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none transition-colors self-end"
            >
              发送
            </button>
          </div>

        </div>

      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, defineProps, ref, watch} from 'vue';
import type {ChatMessage, Model} from "../../../../share/type.ts";
import {chatAPI} from "@/services/chatApi.ts";
import log from "loglevel";

const props = defineProps<{
  model?: Model
  chatId?: string
  chatMessages?: ChatMessage[]
}>();


const messageInput = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const editableDiv = ref<HTMLElement | null>(null);
const imagePreview = ref<string | null>(null);
const imageFileName = ref<string>('');
const imageFile = ref<File | null>(null);

// 功能开关状态
const isSearchActive = ref(false);
const isReasoningActive = ref(false);
const isVoiceInputActive = ref(false);
const isImageUploadActive = ref(false);

// 处理输入框内容变化
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement;
  messageInput.value = target.innerText.trim();
};

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
};

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
const providers = ref<{ id: string, name: string, models: string[] }[]>([]);
const selectedProvider = ref('');

const availableModels = computed(() => {
  const p = providers.value.find(p => p.id === selectedProvider.value);
  return p ? p.models : [];
});

// 发送文本消息
const sendMessage = async () => {
  chatAPI.sendMessage('who are you', props.model, props.chatId);
  // 如果既没有文本消息也没有图片，则不发送
  return ;
  if (!messageInput.value.trim() && !imageFile.value) return;

  try {
    // 如果有图片，先发送图片
    // if (imageFile.value) {
    //   await handleImageMessage();
    // }

    // 如果有文本消息，发送文本
    if (messageInput.value.trim()) {
      // 添加用户消息
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageInput.value as string,
        type: 'text',
        timestamp: Date.now(),
      };
      // messages.value.push(userMessage);
      messageInput.value = '';
      scrollToBottom();

      // 使用选定的模型
      const modelToUse = props.model

      const response = await chatAPI.sendMessage(userMessage.content, modelToUse, props.chatId);
      // messages.value.push(response);
      scrollToBottom();
    }
  } catch (error) {
    log.error("Failed to send message:", error);
  }
};

// 处理图片上传
  const handleImageUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    imageFile.value = file;
    imageFileName.value = file.name;
    isImageUploadActive.value = true;

    // 创建本地预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // 清除input的value，允许上传相同的文件
    input.value = '';
  };

  const cancelImageUpload = () => {
    imagePreview.value = null;
    imageFileName.value = '';
    imageFile.value = null;
    isImageUploadActive.value = false;
  };

// 发送消息时处理图片上传
const handleImageMessage = async () => {
  if (!imageFile.value) return;

  try {
    const response = await chatApi.sendImage(imageFile.value);
    messages.value.push(response);
    scrollToBottom();
    cancelImageUpload(); // 清除预览
  } catch (error) {
    log.error("Failed to upload image:", error);
  }
};

// 定义emit事件
  const emit = defineEmits<{
    (e: 'scroll'): void
  }>();

// 滚动到底部
  const scrollToBottom = () => {

    // 发送滚动事件给父组件
    emit('scroll');

  };

// 更新输入框内容
  const updateEditableContent = () => {
    if (editableDiv.value) {
      // editableDiv.value.innerText = messageInput.value;
    }
  };

// 监听输入框内容变化
  watch(messageInput, updateEditableContent);


</script>

<style scoped>
.empty-content:empty:before {
  content: '输入消息...';
  color: #9CA3AF;
  position: absolute;
  pointer-events: none;
}

/* 添加文本选中样式 */
#editableDiv::selection {
  background-color: #3b82f6;
  color: white;
}

#editableDiv::-moz-selection {
  background-color: #3b82f6;
  color: white;
}
</style>
