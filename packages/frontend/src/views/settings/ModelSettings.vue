<template>
  <div class="bg-white rounded-lg shadow p-6 flex h-[600px]">
    <!-- 左侧服务商抽屉导航 -->
    <div class="w-56 border-r pr-4 overflow-y-auto">
      <div v-for="(provider, idx) in providers" :key="provider.id" @click="selectedProviderIdx = idx" :class="['cursor-pointer flex items-center px-3 py-2 rounded mb-2', selectedProviderIdx === idx ? 'bg-primary text-white' : 'hover:bg-base-200']">
        <span class="font-medium">{{ provider.name }}</span>
        <span v-if="provider.enabled" class="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">已启用</span>
      </div>
    </div>
    <!-- 右侧配置表单 -->
    <div class="flex-1 pl-8">
      <h2 class="text-xl font-semibold mb-4">模型服务配置</h2>
      <template v-if="currentProvider">
        <div class="flex items-center mb-4">
          <h3 class="text-lg font-medium mr-4">{{ currentProvider.name }}</h3>
          <label class="cursor-pointer">
            <input type="checkbox" v-model="currentProvider.enabled" class="toggle toggle-primary" />
            <span class="ml-2 text-sm">启用</span>
          </label>
        </div>
        <div v-if="currentProvider.enabled" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">API 地址</span>
            </label>
            <input type="text" v-model="currentProvider.apiUrl" :placeholder="getDefaultApiUrl(currentProvider.id)" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">API 密钥</span>
            </label>
            <input type="password" v-model="currentProvider.apiKey" placeholder="输入 API 密钥" class="input input-bordered w-full" />
          </div>
          <div class="space-y-2">
            <label class="label">
              <span class="label-text">可用模型</span>
            </label>
            <div v-for="model in currentProvider.models" :key="model.id" class="flex items-center justify-between p-2 bg-base-200 rounded-lg">
              <div class="flex items-center space-x-4">
                <input type="checkbox" v-model="model.enabled" class="checkbox checkbox-sm" />
                <div>
                  <div class="font-medium">{{ model.name }}</div>
                  <div class="text-sm text-gray-500">{{ model.description }}</div>
                </div>
              </div>
              <div class="text-sm text-gray-500">{{ model.size }}</div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-gray-400 text-center mt-20">请选择左侧服务商</div>
      <!-- 操作按钮 -->
      <div class="flex justify-end mt-6">
        <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
        <button @click="saveSettings" class="btn btn-primary">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { settingsAPI } from '../../services/SettingsApi';

interface Model {
  id: string;
  name: string;
  description: string;
  size: string;
  enabled: boolean;
}

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  models: Model[];
}

const providers = ref<Provider[]>([
  {
    id: 'ollama',
    name: 'Ollama',
    enabled: true,
    apiUrl: 'http://localhost:11434',
    apiKey: '',
    models: [
      { id: 'llama2', name: 'Llama 2', description: '开源大语言模型', size: '7B', enabled: true },
      { id: 'codellama', name: 'Code Llama', description: '代码专用模型', size: '7B', enabled: true },
      { id: 'mistral', name: 'Mistral', description: '高性能开源模型', size: '7B', enabled: true }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    enabled: false,
    apiUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      { id: 'gpt-4', name: 'GPT-4', description: '最强大的 GPT 模型', size: '1.76T', enabled: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '性能均衡模型', size: '175B', enabled: true }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: false,
    apiUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: '通用型大语言模型', size: '1.37T', enabled: true },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: '多模态模型', size: '1.37T', enabled: true }
    ]
  },
  {
    id: 'kimi',
    name: 'Kimi',
    enabled: false,
    apiUrl: 'https://api.moonshot.cn/v1',
    apiKey: '',
    models: [
      { id: 'moonshot-v1', name: 'Moonshot', description: '通用大语言模型', size: '70B', enabled: true }
    ]
  },
  {
    id: 'doubao',
    name: '豆包',
    enabled: false,
    apiUrl: 'https://api.doubao.com/v1',
    apiKey: '',
    models: [
      { id: 'doubao-v1', name: '豆包大模型', description: '通用大语言模型', size: '70B', enabled: true }
    ]
  },
  {
    id: 'aliyun',
    name: '阿里云通义千问',
    enabled: false,
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
    apiKey: '',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', description: '最强性能模型', size: '189B', enabled: true },
      { id: 'qwen-plus', name: 'Qwen Plus', description: '通用大语言模型', size: '14B', enabled: true },
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速响应模型', size: '7B', enabled: true }
    ]
  }
]);

const selectedProviderIdx = ref(0);
const currentProvider = computed(() => providers.value[selectedProviderIdx.value]);

const getDefaultApiUrl = (providerId: string): string => {
  switch (providerId) {
    case 'ollama': return 'http://localhost:11434';
    case 'openai': return 'https://api.openai.com/v1';
    case 'gemini': return 'https://generativelanguage.googleapis.com';
    case 'kimi': return 'https://api.moonshot.cn/v1';
    case 'doubao': return 'https://api.doubao.com/v1';
    case 'aliyun': return 'https://dashscope.aliyuncs.com/api/v1';
    default: return '';
  }
};

const loadSettings = async () => {
  try {
    const savedSettings = localStorage.getItem('modelSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      providers.value = providers.value.map(provider => ({
        ...provider,
        ...parsed[provider.id]
      }));
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

const saveSettings = async () => {
  try {
    const settings = providers.value.reduce((acc, provider) => {
      acc[provider.id] = {
        enabled: provider.enabled,
        apiUrl: provider.apiUrl,
        apiKey: provider.apiKey,
        models: provider.models
      };
      return acc;
    }, {} as Record<string, any>);
    localStorage.setItem('modelSettings', JSON.stringify(settings));
    alert('设置已保存');
  } catch (error) {
    console.error('保存设置失败:', error);
    alert(`保存设置失败: ${error}`);
  }
};

const resetSettings = async () => {
  if (confirm('确定要重置所有设置吗？')) {
    providers.value = providers.value.map(provider => ({
      ...provider,
      enabled: provider.id === 'ollama',
      apiUrl: getDefaultApiUrl(provider.id),
      apiKey: '',
      models: provider.models.map(model => ({ ...model, enabled: true }))
    }));
    await saveSettings();
  }
};

onMounted(() => {
  loadSettings();
});
</script>