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
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ kb.name }}</h3>
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
              <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      @click.stop="() => {}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
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
import {ref} from 'vue';
import KnowledgeDocs from './knowledgeView/KnowledgeDocs.vue';


const {appSettings, saveSettings} = useAppSettingStore()

const createKnowledgeBase = async () => {

  appSettings.knowledgeBases.push({
    id: generateUUID4(),
    name: '知识库',
    description: '知识库',
    documentCount: 0,
    chunkCount: 0,
    config: {},
    documents:[],
  } as KnowledgeBaseStats);

  saveSettings();

}

const activeKnowledgeId= ref()

const viewKnowledgeBase = (id: string) => {
  activeKnowledgeId.value = id
}

</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>