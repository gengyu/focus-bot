<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- 头部导航 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
<!--        <router-link to="/knowledge"-->
<!--                     class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">-->
<!--          返回-->
<!--        </router-link>-->
        <div v-if="knowledgeBaseInfo">
          <h1 class="text-2xl font-bold text-gray-900">{{ knowledgeBaseInfo.name }}</h1>
          <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span>{{ knowledgeBaseInfo.documentCount }} 个文档</span>
            <span>{{ knowledgeBaseInfo.documents?.reduce((total: number, doc: any) => total + (doc.chunks?.length || 0), 0) || 0 }} 个片段</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：文档管理 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">文档管理</h2>
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
                :disabled="uploading"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
               {{ uploading ? '上传中...' : '选择文件' }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">加载中...</span>
        </div>

        <div v-else-if="knowledgeBaseInfo && knowledgeBaseInfo.documents.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="doc in knowledgeBaseInfo.documents" :key="doc.id"
               class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ doc.name }}</div>
              <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{{ formatFileSize(doc.size) }}</span>
                <span>{{ doc.chunks }} 个片段</span>
                <span>{{ formatDate(doc.addedAt) }}</span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                @click="deleteDocument(doc.id)"
                class="text-red-500 hover:text-red-700 transition-colors p-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-lg mb-4">还没有文档</p>
          <p class="text-gray-400 text-sm">点击上方的"选择文件"按钮上传您的第一个文档</p>
        </div>
      </div>

      <!-- 右侧：文档搜索 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold mb-4">文档搜索</h2>
        
        <div class="mb-4">
          <input 
            v-model="searchQuery" 
            @input="searchDocuments" 
            placeholder="搜索文档内容..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div class="max-h-96 overflow-y-auto">
          <div v-if="searchLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-gray-600">正在搜索...</p>
          </div>

          <div v-else-if="searchResults.length === 0 && hasSearched" class="text-center py-8">
            <p class="text-gray-600">未找到相关内容</p>
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-4">
            <div v-for="result in searchResults" :key="result.id" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-gray-900">{{ result.metadata.documentName }}</h3>
                <span class="text-sm text-blue-600 font-medium">{{ (result.score * 100).toFixed(1) }}%</span>
              </div>
              
              <div class="text-sm text-gray-700 mb-3 leading-relaxed" 
                   v-html="highlightText(result.content, searchQuery)">
              </div>
              
              <div class="flex justify-between items-center">
                <div class="text-xs text-gray-500">
                  片段 {{ result.metadata.chunkIndex + 1 }} · 位置 {{ result.metadata.startChar }}-{{ result.metadata.endChar }}
                </div>
                <div class="flex space-x-2">
                  <button 
                    @click="previewDocument(result)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    预览
                  </button>
                  <button 
                    @click="locateInDocument(result)"
                    class="text-green-600 hover:text-green-800 text-sm font-medium">
                    定位
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <p class="text-gray-500 text-lg mb-4">开始搜索</p>
            <p class="text-gray-400 text-sm">在上方输入框中输入关键词来搜索文档内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档预览模态框 -->
    <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="showPreview = false">
      <div class="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col" @click.stop>
        <div class="flex justify-between items-center p-6 border-b">
          <h3 class="text-xl font-bold">{{ previewTitle }}</h3>
          <button @click="showPreview = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <div class="prose max-w-none" v-html="highlightText(previewContent, searchQuery)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAppSettingStore} from '../../store/appSettingStore.ts'
import {
  type KnowledgeBaseDetail,
  knowledgeUploadDocuments,
  type SearchResponse,
  type SearchResult
} from '../../services/knowledgeApi.ts'
import {knowledgeApi} from '../../services/knowledgeApi.ts'
import {debounce} from 'lodash'
import {fileParserUpload, saveAppSetting} from "../../services/api.ts";


const router = useRouter()
const {appSettings, saveSettings} = useAppSettingStore()

const props = defineProps<{
   knowledgeId: string
}>()

// const knowledgeBaseId = computed(() => route.params.id as string)
const knowledgeBase = ref<KnowledgeBaseDetail | null>(null)
const loading = ref(false)
const uploading = ref(false)

// 从appSetting中获取知识库基本信息
const knowledgeBaseInfo = computed(() => {
  console.log(appSettings)
  return appSettings.knowledgeBases.find(item=> item.id === props.knowledgeId)
})

// 搜索相关
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const hasSearched = ref(false)
const showPreview = ref(false)
const previewContent = ref('')
const previewTitle = ref('')

// 文件上传
const fileInput = ref<HTMLInputElement | null>(null)

// 加载知识库详情
const loadKnowledgeBase = async () => {
  try {
    loading.value = true
    knowledgeBase.value = await knowledgeApi.getKnowledgeBaseDetail(props.knowledgeId)
  } catch (error) {
    console.error('加载知识库详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索文档
const searchDocuments = debounce(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  searchLoading.value = true
  hasSearched.value = true

  try {
    const response: SearchResponse = await knowledgeApi.searchKnowledgeBase(
      props.knowledgeId,
      searchQuery.value,
      {
        topK: 10,
        similarityThreshold: 0.3,
        includeMetadata: true,
        highlightMatches: true
      }
    )
    searchResults.value = response.results
  } catch (error) {
    console.error('搜索文档失败:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}, 300)

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size === undefined) return ''
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  try {
    uploading.value = true
    const files = Array.from(input.files)
    
    const response = await fileParserUpload(files)

    const knowledgeBase = appSettings.knowledgeBases.find(item=> item.id === props.knowledgeId);
    if(knowledgeBase){
      knowledgeBase.documents.push(...response);
      // knowledgeBase.documents  = response
      console.log('上传结果:', response)
      saveSettings()
    }

    
    // 重新加载知识库详情
    // await loadKnowledgeBase()
    
    // 清空文件输入框
    input.value = ''
  } catch (error) {
    console.error('上传文件失败:', error)
  } finally {
    uploading.value = false
  }
}

// 删除文档
const deleteDocument = async (docId: string) => {
  if (!confirm('确定要删除这个文档吗？')) return
  
  try {
    await knowledgeApi.deleteDocument(props.knowledgeId, docId)
    // 重新加载知识库详情
    await loadKnowledgeBase()
  } catch (error) {
    console.error('删除文档失败:', error)
  }
}

// 关键词高亮
const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

// 预览文档内容
const previewDocument = (result: SearchResult) => {
  previewTitle.value = result.metadata.documentName
  previewContent.value = result.content
  showPreview.value = true
}

// 定位到文档位置
const locateInDocument = (result: SearchResult) => {
  // 这里可以实现跳转到文档的具体位置
  console.log('定位到文档:', result.metadata.documentName, '位置:', result.metadata.startChar, '-', result.metadata.endChar)
}

onMounted(async () => {

  // 仍然需要加载详细信息用于文档操作
  loadKnowledgeBase()
})

</script>

<style scoped>

</style>