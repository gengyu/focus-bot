<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">知识库</h1>
      <button 
        @click="showCreateModal = true"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        创建知识库
      </button>
    </div>

    <!-- 知识库列表 -->
    <div class="space-y-4">
      <div v-for="kb in knowledgeBases" :key="kb.id" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold mb-2">{{ kb.name }}</h2>
            <p class="text-gray-600">{{ kb.description }}</p>
            <div class="mt-2 text-sm text-gray-500">
              <span>文档数：{{ kb.documentCount }}</span>
              <span class="mx-2">|</span>
              <span>创建时间：{{ formatDate(kb.createdAt) }}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="openUploadModal(kb)"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              上传文档
            </button>
            <button 
              @click="openChatModal(kb)"
              class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              开始对话
            </button>
            <button 
              @click="deleteKnowledgeBase(kb)"
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建知识库模态框 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-96">
        <h2 class="text-xl font-bold mb-4">创建知识库</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">名称</label>
            <input 
              v-model="newKnowledgeBase.name"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">描述</label>
            <textarea 
              v-model="newKnowledgeBase.description"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button 
              @click="showCreateModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              取消
            </button>
            <button 
              @click="createKnowledgeBase"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传文档模态框 -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-96">
        <h2 class="text-xl font-bold mb-4">上传文档</h2>
        <div class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input 
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              class="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt"
            >
            <button 
              @click="$refs.fileInput.click()"
              class="text-blue-500 hover:text-blue-600"
            >
              选择文件
            </button>
            <p class="mt-2 text-sm text-gray-500">
              支持 PDF、Word、TXT 格式
            </p>
          </div>
          <div v-if="uploadedFiles.length > 0" class="space-y-2">
            <div v-for="file in uploadedFiles" :key="file.name" class="flex items-center justify-between">
              <span class="text-sm">{{ file.name }}</span>
              <button 
                @click="removeFile(file)"
                class="text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
          <div class="flex justify-end space-x-2">
            <button 
              @click="showUploadModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              取消
            </button>
            <button 
              @click="uploadFiles"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              :disabled="uploadedFiles.length === 0"
            >
              上传
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话模态框 -->
    <div v-if="showChatModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-[800px] h-[600px] flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">知识库对话</h2>
          <button 
            @click="showChatModal = false"
            class="text-gray-500 hover:text-gray-600"
          >
            关闭
          </button>
        </div>
        <div class="flex-1 overflow-y-auto mb-4 space-y-4">
          <div v-for="(message, index) in chatMessages" :key="index" class="flex">
            <div 
              :class="[
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
              ]"
            >
              {{ message.content }}
            </div>
          </div>
        </div>
        <div class="flex space-x-2">
          <input 
            v-model="userInput"
            type="text"
            placeholder="输入你的问题..."
            class="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            @keyup.enter="sendMessage"
          >
          <button 
            @click="sendMessage"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="!userInput.trim()"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 状态
const knowledgeBases = ref<KnowledgeBase[]>([]);
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const showChatModal = ref(false);
const currentKnowledgeBase = ref<KnowledgeBase | null>(null);
const uploadedFiles = ref<File[]>([]);
const chatMessages = ref<ChatMessage[]>([]);
const userInput = ref('');

// 新建知识库表单
const newKnowledgeBase = ref({
  name: '',
  description: ''
});

// 初始化
onMounted(async () => {
  await fetchKnowledgeBases();
});

// 获取知识库列表
const fetchKnowledgeBases = async () => {
  try {
    const response = await axios.get('/api/knowledge-bases');
    knowledgeBases.value = response.data;
  } catch (error) {
    console.error('获取知识库列表失败:', error);
  }
};

// 创建知识库
const createKnowledgeBase = async () => {
  try {
    await axios.post('/api/knowledge-bases', newKnowledgeBase.value);
    showCreateModal.value = false;
    newKnowledgeBase.value = { name: '', description: '' };
    await fetchKnowledgeBases();
  } catch (error) {
    console.error('创建知识库失败:', error);
  }
};

// 删除知识库
const deleteKnowledgeBase = async (kb: KnowledgeBase) => {
  if (!confirm('确定要删除这个知识库吗？')) return;
  
  try {
    await axios.delete(`/api/knowledge-bases/${kb.id}`);
    await fetchKnowledgeBases();
  } catch (error) {
    console.error('删除知识库失败:', error);
  }
};

// 打开上传模态框
const openUploadModal = (kb: KnowledgeBase) => {
  currentKnowledgeBase.value = kb;
  showUploadModal.value = true;
  uploadedFiles.value = [];
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    uploadedFiles.value = [...uploadedFiles.value, ...Array.from(input.files)];
  }
};

// 移除文件
const removeFile = (file: File) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f !== file);
};

// 上传文件
const uploadFiles = async () => {
  if (!currentKnowledgeBase.value) return;

  const formData = new FormData();
  uploadedFiles.value.forEach(file => {
    formData.append('files', file);
  });

  try {
    await axios.post(`/api/knowledge-bases/${currentKnowledgeBase.value.id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    showUploadModal.value = false;
    await fetchKnowledgeBases();
  } catch (error) {
    console.error('上传文件失败:', error);
  }
};

// 打开对话模态框
const openChatModal = (kb: KnowledgeBase) => {
  currentKnowledgeBase.value = kb;
  showChatModal.value = true;
  chatMessages.value = [];
  userInput.value = '';
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || !currentKnowledgeBase.value) return;

  const message = userInput.value;
  chatMessages.value.push({ role: 'user', content: message });
  userInput.value = '';

  try {
    const response = await axios.post(`/api/knowledge-bases/${currentKnowledgeBase.value.id}/chat`, {
      query: message
    });
    chatMessages.value.push({ role: 'assistant', content: response.data.answer });
  } catch (error) {
    console.error('发送消息失败:', error);
    chatMessages.value.push({ 
      role: 'assistant', 
      content: '抱歉，处理您的请求时出现错误。' 
    });
  }
};

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>