<template>
  <div class="flex flex-col h-full bg-gray-100 rounded-lg p-4">
    <!-- 消息列表区域 -->
    <div class="flex-1 overflow-y-auto mb-4" ref="messageContainer">
      <div v-for="message in messages" :key="message.timestamp" class="mb-4">
        <div :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
          <div :class="[
            'max-w-[70%] rounded-lg p-3',
            message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
          ]">
            <!-- 文本消息 -->
            <div v-if="message.type === 'text'" class="break-words">
              {{ message.content }}
            </div>
            <!-- 图片消息 -->
            <div v-else-if="message.type === 'image'" class="max-w-sm">
              <img :src="message.imageUrl" alt="聊天图片" class="rounded-lg">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="flex gap-2">
      <!-- 图片上传按钮 -->
      <label class="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300">
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleImageUpload"
        >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </label>

      <!-- 文本输入框 -->
      <div class="flex-1 relative">
        <input
          v-model="messageInput"
          type="text"
          placeholder="输入消息..."
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          @keyup.enter="sendMessage"
        >
      </div>

      <!-- 发送按钮 -->
      <button
        @click="sendMessage"
        class="w-20 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ChatAPI, type ChatMessage } from '../services/chatApi';

const chatApi = new ChatAPI();
const messages = ref<ChatMessage[]>([]);
const messageInput = ref('');
const messageContainer = ref<HTMLElement | null>(null);

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

  try {
    const response = await chatApi.sendMessage(messageInput.value);
    messages.value.push(response);
    messageInput.value = '';
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