<template>
  <div class="flex">
    <div class="container shrink-0 lg:mx-auto px-4 py-8 transition-width duration-300"
         :class="{ 'w-70': !!activeKnowledgeId }">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">知识库</h1>
        <div class="flex space-x-2">
          <button
              @click="createKnowledgeBase"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            创建知识库
          </button>
        </div>
      </div>

      <!-- 知识库列表 -->
      <div class="space-y-4">

        <div v-if="appSettings.knowledgeBases.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-lg mb-4">还没有知识库</p>
          <p class="text-gray-400 text-sm">点击上方的"新建知识库"按钮创建您的第一个知识库</p>
        </div>

        <div v-else v-for="kb in appSettings.knowledgeBases" :key="kb.id"
             class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
             @click="viewKnowledgeBase(kb.id)">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- 可编辑的知识库名称 -->
              <div class="mb-2">
                <h3 v-if="editingKnowledgeBaseId !== kb.id" 
                    class="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    @click.stop="startEditName(kb.id, kb.name)">{{ kb.name || '知识库' }}</h3>
                <div v-else class="flex items-center space-x-2" @click.stop>
                  <input 
                    ref="nameInput"
                    v-model="editingName"
                    @keyup.enter="saveKnowledgeBaseName(kb.id)"
                    @keyup.escape="cancelEditName"
                    @blur="saveKnowledgeBaseName(kb.id)"
                    class="text-lg font-semibold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                  />
                  <button 
                    @click="saveKnowledgeBaseName(kb.id)"
                    class="p-1 text-green-600 hover:text-green-800 rounded"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                  <button 
                    @click="cancelEditName"
                    class="p-1 text-red-600 hover:text-red-800 rounded"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {{ kb.documentCount }} 个文档
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"></path>
                  </svg>
                  {{ kb.chunkCount }} 个片段
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <!-- 删除按钮 -->
              <button class="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      @click.stop="deleteKnowledgeBase(kb.id, kb.name)"
                      title="删除知识库">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <transition>
      <div class="flex-1">
        <KnowledgeDocs v-if="activeKnowledgeId" :knowledgeId="activeKnowledgeId"/>
      </div>
    </transition>
  </div>


</template>

<script setup lang="ts">
import {useAppSettingStore} from '../store/appSettingStore'
import {generateUUID4} from "../utils/uuid.ts";
import type {KnowledgeBaseStats} from "../../../../share/knowledge.ts";
import {ref, nextTick} from 'vue';
import KnowledgeDocs from "./knowledgeView/KnowledgeDocs.vue";
import {knowledgeApi} from '../services/knowledgeApi';
import {toast} from 'vue3-toastify';
import {debounce} from "lodash";

const {appSettings, saveSettings} = useAppSettingStore()

const activeKnowledgeId = ref<string | null>(null)
const editingKnowledgeBaseId = ref<string | null>(null)
const editingName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

const createKnowledgeBase = () => {
  const name = prompt('请输入知识库名称:')
  if (!name) return

  const newKnowledgeBase: KnowledgeBaseStats = {
    id: generateUUID4(),
    name,
    description: '',
    documentCount: 0,
    chunkCount: 0,
    config: {
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'text-embedding-ada-002',
      similarityThreshold: 0.7,
      maxResults: 10
    },
    documents: []
  }

  appSettings.knowledgeBases.push(newKnowledgeBase)
  saveSettings()
}

const viewKnowledgeBase = (id: string) => {
  activeKnowledgeId.value = id
}

// 开始编辑知识库名称
const startEditName = async (id: string, currentName: string) => {
  editingKnowledgeBaseId.value = id
  editingName.value = currentName
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

// 取消编辑
const cancelEditName = () => {
  editingKnowledgeBaseId.value = null
  editingName.value = ''
}

// 保存知识库名称
const saveKnowledgeBaseName = debounce(async (id: string) => {
  if (!editingName.value.trim()) {
    toast.error('知识库名称不能为空')
    return
  }

  try {
    // await knowledgeApi.updateKnowledgeBaseName(id, editingName.value.trim())
    
    // 更新本地数据
    const kb = appSettings.knowledgeBases.find(kb => kb.id === id)
    if (kb && kb.name !== editingName.value.trim()) {
      kb.name = editingName.value.trim()
      await saveSettings()
    }
    
    // toast.success('知识库名称更新成功')
    cancelEditName()
  } catch (error) {
    toast.error(`更新知识库名称失败: ${error}`)
  }
}, 100);

// 删除知识库
const deleteKnowledgeBase = async (id: string, name: string) => {
  if (!confirm(`确定要删除知识库 "${name}" 吗？此操作不可撤销。`)) {
    return
  }

  try {
    await knowledgeApi.deleteKnowledgeBase(id)
    
    // 更新本地数据
    const index = appSettings.knowledgeBases.findIndex(kb => kb.id === id)
    if (index !== -1) {
      appSettings.knowledgeBases.splice(index, 1)
      await saveSettings()
    }
    
    // 如果当前正在查看被删除的知识库，关闭详情页
    if (activeKnowledgeId.value === id) {
      activeKnowledgeId.value = null
    }
    
    toast.success('知识库删除成功')
  } catch (error) {
    toast.error(`删除知识库失败: ${error}`)
  }
}

</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>