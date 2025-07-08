<template>
  <div class="flex">
    <div class="container shrink-0 lg:mx-auto px-4 py-8 transition-width duration-300"
         :class="{ 'w-70': $route.path.includes('/knowledge/docs') }">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">知识库</h1>
        <div class="flex space-x-2">
          <button
              @click="showCreateModal = true"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            创建知识库
          </button>
        </div>
      </div>

      <!-- 知识库列表 -->
      <div class="space-y-4">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">加载中...</span>
        </div>
        
        <div v-else-if="knowledgeBases.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-lg mb-4">还没有知识库</p>
          <p class="text-gray-400 text-sm">点击上方的"新建知识库"按钮创建您的第一个知识库</p>
        </div>
        
        <div v-else v-for="kb in knowledgeBases" :key="kb.id" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
             @click="viewKnowledgeBase(kb.id)">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ kb.name }}</h3>
              <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {{ kb.documentCount }} 个文档
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"></path>
                  </svg>
                  {{ kb.chunkCount }} 个片段
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      @click.stop="() => {}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <transition>
      <div class="flex-1">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="$route.fullPath"/>
          </keep-alive>
        </router-view>
      </div>
    </transition>
  </div>

  <!-- 创建知识库模态框 -->
  <div v-if="showCreateModal"
       class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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


</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppSettingStore } from '@/store/appSettingStore.ts'
import { knowledgeApi } from '@/services/knowledgeApi.ts'
import type { KnowledgeBase } from '../../../../share/knowledge'
import type { CreateKnowledgeBaseRequest, KnowledgeBaseStats } from '@/services/knowledgeApi'

const router = useRouter()
const appSetting = useAppSettingStore()

const knowledgeBases = ref<KnowledgeBaseStats[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const newKnowledgeBase = ref<CreateKnowledgeBaseRequest>({
  name: '',
  description: ''
})

const loadKnowledgeBases = async () => {
  try {
    loading.value = true
    knowledgeBases.value = await knowledgeApi.getKnowledgeBases()
  } catch (error) {
    console.error('加载知识库列表失败:', error)
  } finally {
    loading.value = false
  }
}

const createKnowledgeBase = async () => {
  if (!newKnowledgeBase.value.name) return
  
  try {
    loading.value = true
    await knowledgeApi.createKnowledgeBase(newKnowledgeBase.value)
    await loadKnowledgeBases() // 重新加载列表
    
    showCreateModal.value = false
    newKnowledgeBase.value = { name: '', description: '' }
  } catch (error) {
    console.error('创建知识库失败:', error)
  } finally {
    loading.value = false
  }
}

const viewKnowledgeBase = (id: string) => {
  router.push(`/knowledge/${id}`)
}

onMounted(() => {
  loadKnowledgeBases()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>