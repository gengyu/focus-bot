<template>
  <div class="bg-white rounded-lg shadow p-6 flex">
    <!-- 左侧服务商抽屉导航 -->
    <div class="w-56 border-r pr-4 overflow-y-auto">
      <!-- 启用按钮 -->
      <div v-for="(provider, idx) in  appSettings.providers" :key="provider.id"
           @click="handlerSelectProvider(idx)"
           :class="['cursor-pointer flex items-center px-4 py-2 rounded-lg mb-2 transition-all duration-200 ease-in-out',
          selectedProviderIdx === idx ? 'bg-gray-100 shadow-md transform scale-102' :
          'hover:bg-base-200 hover:shadow-md']">
        <span class="font-medium text-[15px]">{{ provider.name }}</span>
        <span class="ml-auto " @click.stop>
          <Switch v-model="provider.enabled"
                  @update:modelValue="hanlderProviderEnabled(provider.id, $event)"
                  as="template" v-slot="{ checked }">
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
        <div class="space-y-4">
          <div class="form-control relative">
            <label class="label">
              <span class="label-text">API 地址</span>
            </label>
            <Combobox v-model="currentProvider.apiUrl">
              <div class="relative">
                <ComboboxInput autocomplete="off"
                               class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                               :placeholder="getDefaultApiUrl(currentProvider.id)"
                               @change="query = $event.target.value"
                />
                <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true"/>
                </ComboboxButton>
              </div>
              <ComboboxOptions
                  class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                  :type="showPassword ? 'text' : 'password'"
                  v-model="currentProvider.apiKey"
                  placeholder="输入 API 密钥"
                  autocomplete="off"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"/>
              <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                  @click="togglePasswordVisibility"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="w-5 h-5">
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
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
                <ArrowPathIcon class="h-4 w-4"/>
              </button>
            </div>
            <div v-for="model in currentProvider.models" :key="model.id"
                 class="flex items-center justify-between p-2 bg-base-200 rounded-lg">
              <div class="flex items-center space-x-4">
                <input type="checkbox" autocomplete="off" v-model="model.enabled" class="checkbox checkbox-sm"/>
                <div>
                  <div class="font-medium">{{ model.name }}</div>
                  <div class="text-sm text-gray-500">{{ model.description }}</div>
                </div>
              </div>
              <div class="text-sm text-gray-500">{{ model.size }}</div>
            </div>
            <!-- 添加新模型按钮 -->
            <button
                @click="addNewModel"
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
        <button @click="handleSaveSettings" class="btn btn-primary">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Switch} from '@headlessui/vue';
import {ArrowPathIcon, ChevronUpDownIcon} from '@heroicons/vue/20/solid';
// import { useToast } from 'vue-toastification';
import {toast} from 'vue-sonner'
import type {Model, ProviderConfig, ProviderId} from "../../../../../share/type.ts";
import {useAppSettingStore} from '../../store/appSettingStore.ts';
import {getModels} from "../../services/api.ts";


const showPassword = ref(false);
const query = ref('');

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const getDefaultApiUrl = (providerId: string): string => {
  switch (providerId) {
    case 'ollama':
      return 'http://localhost:11434/v1';
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com';
    case 'kimi':
      return 'https://api.moonshot.cn/v1';
    case 'doubao':
      return 'https://api.doubao.com/v1';
    case 'aliyun':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    default:
      return '';
  }
};

const {appSettings, saveSettings} = useAppSettingStore();


const selectedProviderIdx = ref(0);

const currentProvider = ref<ProviderConfig>(appSettings.providers[selectedProviderIdx.value])
if (!currentProvider.value) {watch(() => appSettings.providers, () => {
    if (!currentProvider.value) {
      currentProvider.value = appSettings.providers[selectedProviderIdx.value];
    }
  }, {once: true});
}


const handlerSelectProvider = (idx: number) => {
  selectedProviderIdx.value = idx;
  currentProvider.value = appSettings.providers[selectedProviderIdx.value];
}
const updateProvider = async (providerId: string, newProvider: Partial<ProviderConfig>) => {

  appSettings.providers = appSettings.providers?.map((provider: ProviderConfig) => {
    if (provider.id === providerId) {
      return {
        ...provider,
        ...newProvider,
        providerId,
      };
    }
    return provider;
  });
  await saveSettings();
};

// 关闭启用服务商方法
const hanlderProviderEnabled = (providerId: ProviderId, value: boolean) => {
  updateProvider(providerId, {
    enabled: value,
  });
}

const handleSaveSettings = () => {
  if (!currentProvider.value) return;
  updateProvider(currentProvider.value.id, {
    apiKey: currentProvider.value.apiKey,
    apiUrl: currentProvider.value.apiUrl,
    enabled: currentProvider.value.enabled,
    models: currentProvider.value.models
  });
}


// 刷新当前供应商的模型列表
const refreshModels = async () => {
  const providerId = currentProvider.value?.id;

  if (!providerId) return;
  const models: Model[] = await getModels(providerId);
  if (models.length > 0) {
    currentProvider.value.models = models.map(model => ({
      ...model,
      providerId: providerId,
      enabled: true
    }));
    // await saveSettings();
    toast.success('模型列表已更新');
  }
};

// 添加新模型
const addNewModel = async () => {
  if (!currentProvider.value) return;
  currentProvider.value.models.push({
    id: 'new-model-' + Date.now(),
    name: '新模型',
    description: '自定义模型',
    size: '未知',
    enabled: true,
    providerId: currentProvider.value.id,
  });
};


</script>