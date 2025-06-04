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
        <List :items="knowledgeBases"
              divided
              :empty-message="'暂无知识库'"
        >
          <template #item="{ item: kb }">
            <div class="flex justify-between items-center mb-3">
              <div>
                <h2 class="text-lg font-semibold mb-2">{{ kb.name }}</h2>
                <div class="mt-2 text-base text-gray-500">
                  <span>文档数：{{ kb.documents?.length }}</span>
                </div>
              </div>
              <div class="flex space-x-2">
                <router-link class="opacity-80 hover:opacity-100 transition-opacity"
                             :to="{path: '/knowledge/docs', query: {id: kb.id}}">
                  查看文档
                </router-link>
              </div>
            </div>
          </template>
        </List>
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
import {computed, onMounted, ref} from 'vue';
import {List} from "@/components/ui";
import {useAppSettingStore} from "@/store/appSettingStore.ts";
import {generateUUID, generateUUID4} from "@/utils/uuid.ts";


// 状态
const {appSetting, initialize, saveSettings} = useAppSettingStore();
const knowledgeBases = computed(() => appSetting.knowledgeBases);

const showCreateModal = ref(false);

// 新建知识库表单
const newKnowledgeBase = ref({
  name: '',
  description: ''
});

// 初始化
onMounted(async () => {
  await initialize();
});

// 创建知识库
const createKnowledgeBase = async () => {
  try {
    appSetting.knowledgeBases.push({...newKnowledgeBase.value, id: generateUUID4()});
    await saveSettings();
    showCreateModal.value = false
  } catch (error) {
    console.error('创建知识库失败:', error);
  }
};

</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>