<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">模型服务配置</h2>
    
    <!-- 服务商列表 -->
    <div class="space-y-6">
      <div v-for="provider in providers" :key="provider.id" class="border rounded-lg p-4">
        <!-- 服务商标题和启用开关 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ provider.name }}</h3>
          <label class="cursor-pointer">
            <input type="checkbox" v-model="provider.enabled" class="toggle toggle-primary" />
          </label>
        </div>

        <!-- 服务商配置 -->
        <div v-if="provider.enabled" class="space-y-4">
          <!-- API 配置 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">API 地址</span>
            </label>
            <input 
              type="text" 
              v-model="provider.apiUrl" 
              :placeholder="getDefaultApiUrl(provider.id)"
              class="input input-bordered w-full" 
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">API 密钥</span>
            </label>
            <input 
              type="password" 
              v-model="provider.apiKey" 
              placeholder="输入 API 密钥"
              class="input input-bordered w-full" 
            />
          </div>

          <!-- 模型列表 -->
          <div class="space-y-2">
            <label class="label">
              <span class="label-text">可用模型</span>
            </label>
            <div v-for="model in provider.models" :key="model.id" class="flex items-center justify-between p-2 bg-base-200 rounded-lg">
              <div class="flex items-center space-x-4">
                <input 
                  type="checkbox" 
                  v-model="model.enabled" 
                  class="checkbox checkbox-sm" 
                />
                <div>
                  <div class="font-medium">{{ model.name }}</div>
                  <div class="text-sm text-gray-500">{{ model.description }}</div>
                </div>
              </div>
              <div class="text-sm text-gray-500">{{ model.size }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end mt-6">
      <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

// 获取默认 API 地址
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

// 加载设置
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

// 保存设置
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

// 重置设置
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

// 初始化加载
onMounted(() => {
  loadSettings();
});
</script>