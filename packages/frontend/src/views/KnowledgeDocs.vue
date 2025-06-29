<template>


  <div class=" mx-auto px-4 pt-8">
    <div class="flex justify-between items-center mb-6">
      <router-link to="/knowledge"
                   class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
        返回
      </router-link>
    </div>
  </div>

  <div  class=" inset-0 ">
    <div class="bg-white rounded-lg p-6 flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">文档列表</h2>
        <div>
          <input type="file"
              ref="fileInput"
              @change="handleFileUpload"
              class="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
          >
          <button 
              @click="() => fileInput?.click()"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
             选择文件
          </button>
        </div>

      </div>

      <div class="mb-4">
        <div class="flex space-x-2 items-center">
          <div class="flex-1">
            <Input v-model:model-value="searchQuery" @input="searchDocuments" placeholder="搜索文档..."></Input>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="documents && documents.length > 0" class="space-y-2">
          <div v-for="doc in documents" :key="doc.id"
               class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-4">
              <span class="text-gray-600">{{ doc.name }}</span>
              <span class="text-sm text-gray-500">{{ formatFileSize(doc.size) }}</span>
              <span class="text-sm text-gray-500">{{ formatDate(doc.createdAt) }}</span>
            </div>
            <div class="flex space-x-2">
              <button 
                @click="deleteDocument(doc.id)"
                class="text-red-500 hover:text-red-700 transition-colors">
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-gray-600">暂无文档，请上传文档</p>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="space-y-4 mt-4">
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p class=" text-gray-600">正在搜索...</p>
      </div>

      <div v-else-if="searchResults.length === 0 && hasSearched" class="text-center py-8">
        <p class="text-gray-600">未找到相关文档</p>
      </div>


      <div v-else-if="searchResults.length > 0" class="space-y-4">
        <div v-for="doc in searchResults" :key="doc.id" class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold mb-2">{{ doc.name }}</h3>
              <div class="flex space-x-4 text-sm text-gray-500">
                <span>{{ formatFileSize(doc.size) }}</span>
                <span>{{ formatDate(doc.createdAt) }}</span>
                <span>相关度: {{ (doc.score * 100).toFixed(2) }}%</span>
              </div>
              <p v-if="doc.content" class="mt-2 text-gray-700 line-clamp-3">
                {{ doc.content }}
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>



</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {documentApi} from '../services/documentApi.ts';
import type {KnowledgeDocument} from '../../../../share/knowledge.ts';
import {useRoute} from 'vue-router';
import {Button, Input} from "@/components/ui";
import {debounce} from "lodash";
import {useAppSettingStore} from "@/store/appSettingStore.ts";

const route = useRoute();

const searchQuery = ref('');
const searchResults = ref<KnowledgeDocument[]>([]);
const isLoading = ref(false);
const hasSearched = ref(false);

// 状态
const {appSetting, saveSettings} = useAppSettingStore()

const documents = computed(() => {
  return appSetting.knowledgeBases.find(kb => kb.id === route.query.id)?.documents || [];
});


// 搜索文档
const searchDocuments = debounce(async () => {
  if (!searchQuery.value.trim() || !route.query.id) {
    searchResults.value = []
    return;
  }

  isLoading.value = true;
  hasSearched.value = true;

  try {
    searchResults.value = await documentApi.searchDocuments(searchQuery.value, documents.value) as any;
  } catch (error) {
    console.error('搜索文档失败:', error);
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
}, 300);

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size === undefined) return;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 格式化日期
const formatDate = (date: string) => {
  if (date === undefined) return;
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


const uploadedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// 上传文件
const uploadFiles = async () => {
  try {
   const documents =  await documentApi.uploadDocuments(uploadedFiles.value);
    const knowledgeBase = appSetting.knowledgeBases.find(item => item.id === route.query.id);
    if (knowledgeBase) {
      knowledgeBase.documents = knowledgeBase.documents || [];
      knowledgeBase.documents.splice(0, 0, ...documents);
      await saveSettings();
    }
  } catch (error) {
    console.error('上传文件失败:', error);
  }
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    uploadedFiles.value = [...Array.from(input.files)];
    uploadFiles();
    // 清空文件输入框，以便可以重复上传相同文件
    input.value = '';
  }
};

// 删除文档
const deleteDocument = async (docId: string) => {
  if (!confirm('确定要删除这个文档吗？')) return;
  
  try {
    const knowledgeBase = appSetting.knowledgeBases.find(kb => kb.id === route.query.id);
    if (knowledgeBase && knowledgeBase.documents) {
      const docIndex = knowledgeBase.documents.findIndex(doc => doc.id === docId);
      if (docIndex !== -1) {
        knowledgeBase.documents.splice(docIndex, 1);
        await saveSettings();
      }
    }
  } catch (error) {
    console.error('删除文档失败:', error);
  }
};

</script>

<style scoped>

</style>