<template>
  <div class="bg-white rounded-lg shadow p-6 flex h-[600px]">
    <!-- 左侧服务商抽屉导航 -->
    <div class="w-56 border-r pr-4 overflow-y-auto">
      <!-- 启用按钮 -->
      <div v-for="(provider, idx) in providers" :key="provider.id" @click="selectedProviderIdx = idx"
        :class="['cursor-pointer flex items-center px-4 py-2 rounded-lg mb-2 transition-all duration-200 ease-in-out',
          selectedProviderIdx === idx ? 'bg-primary shadow-sm transform scale-102' :
          'hover:bg-base-200 hover:shadow-sm']">
        <span class="font-medium text-[15px]">{{ provider.name }}</span>
        <span class="ml-auto " @click.stop>
          <Switch  v-model="provider.enabled" as="template" v-slot="{ checked }">
            <button
                class="relative inline-flex h-6 w-11 items-center rounded-full"
                :class="checked ? 'bg-[rgba(34,197,94,0.8)]' : 'bg-gray-200'"
            >
              <span class="sr-only">Enable notifications</span>
              <span
                  :class="checked ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition"
              />
            </button>
        </Switch>
        </span>
      </div>
    </div>
    <!-- 右侧配置表单 -->
    <div class="flex-1 pl-8">
      <h2 class="text-xl font-semibold mb-4">模型服务配置</h2>
      <template v-if="currentProvider">
        <div class="flex items-center mb-4">
          <h3 class="text-lg font-medium">{{ currentProvider.name }}</h3>
        </div>
        <div  class="space-y-4">
          <div class="form-control relative">
            <label class="label">
              <span class="label-text">API 地址</span>
            </label>
            <Combobox v-model="currentProvider.apiUrl">
              <div class="relative">
                <ComboboxInput
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                  :placeholder="getDefaultApiUrl(currentProvider.id)"
                   @change="query = $event.target.value"
                />
                <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                </ComboboxButton>
              </div>
              <ComboboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ComboboxOption
                  v-slot="{ active }"
                  :value="getDefaultApiUrl(currentProvider.id)"
                  as="template"
                >
                  <li :class="['relative cursor-default select-none py-2 pl-3 pr-9', active ? 'bg-primary/10 text-primary' : 'text-gray-900']">
                    <span class="block truncate">{{ getDefaultApiUrl(currentProvider.id) }}</span>
                  </li>
                </ComboboxOption>
              </ComboboxOptions>
            </Combobox>
          </div>
          <div class="form-control relative">
            <label class="label">
              <span class="label-text">API 密钥</span>
            </label>
            <div class="relative">
              <input
                type="password"
                v-model="currentProvider.apiKey"
                placeholder="输入 API 密钥"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"/>
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                @click="togglePasswordVisibility"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="label">
                <span class="label-text">可用模型</span>
              </label>
              <button 
                @click="refreshModels"
                class="btn btn-sm btn-ghost"
                title="刷新模型列表"
              >
                <ArrowPathIcon class="h-4 w-4" />
              </button>
            </div>
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
            <!-- 添加新模型按钮 -->
            <button 
              @click="addNewModel({ 
                id: 'new-model-' + Date.now(),
                name: '新模型',
                description: '自定义模型',
                size: '未知',
                enabled: true
              })"
              class="btn btn-sm btn-outline w-full mt-2"
            >
              添加新模型
            </button>
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
import { Combobox,ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Switch } from '@headlessui/vue';
import { ChevronUpDownIcon, ArrowPathIcon } from '@heroicons/vue/20/solid';
import { useToast } from 'vue-toastification';
import { configAPI } from '@/services/api';

const toast = useToast();

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

// 默认供应商配置
const defaultProviders: Provider[] = [
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
const showPassword = ref(false);
const query = ref('');

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

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

const providers = ref<Provider[]>([]);

// 从后端获取模型列表
const fetchModels = async (providerId: string) => {
  try {
    const response = await fetch(`/api/providers/${providerId}/models`);
    if (!response.ok) throw new Error('获取模型列表失败');
    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error('获取模型列表失败:', error);
    toast.error('获取模型列表失败');
    return [];
  }
};

// 刷新当前供应商的模型列表
const refreshModels = async () => {
  if (!currentProvider.value) return;
  const models = await fetchModels(currentProvider.value.id);
  if (models.length > 0) {
    currentProvider.value.models = models.map(model => ({
      ...model,
      enabled: true
    }));
    await saveSettings();
    toast.success('模型列表已更新');
  }
};

// 添加新模型
const addNewModel = async (model: Model) => {
  if (!currentProvider.value) return;
  try {
    const response = await fetch(`/api/providers/${currentProvider.value.id}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    });
    if (!response.ok) throw new Error('添加模型失败');
    currentProvider.value.models.push({ ...model, enabled: true });
    await saveSettings();
    toast.success('模型添加成功');
  } catch (error) {
    console.error('添加模型失败:', error);
    toast.error('添加模型失败');
  }
};

const loadSettings = async () => {
  try {
    // 初始化供应商列表
    providers.value = JSON.parse(JSON.stringify(defaultProviders));
    
    // 从后端加载用户配置
    const config = await configAPI.getModelConfig();
    if (config && config.providers) {
      providers.value = providers.value.map(provider => {
        const savedProvider = config.providers.find(p => p.id === provider.id);
        if (savedProvider) {
          return {
            ...provider,
            enabled: savedProvider.enabled,
            apiUrl: savedProvider.apiUrl,
            apiKey: savedProvider.apiKey,
            models: savedProvider.models
          };
        }
        return provider;
      });
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    toast.error('加载设置失败');
  }
};

const saveSettings = async () => {
  try {
    const config = {
      providers: providers.value.map(provider => ({
        id: provider.id,
        enabled: provider.enabled,
        apiUrl: provider.apiUrl,
        apiKey: provider.apiKey,
        models: provider.models
      }))
    };

    await configAPI.saveModelConfig(config);
    toast.success('设置已保存');
  } catch (error) {
    console.error('保存设置失败:', error);
    toast.error(`保存设置失败: ${error}`);
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