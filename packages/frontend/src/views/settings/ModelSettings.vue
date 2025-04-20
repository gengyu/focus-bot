<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">默认模型设置</h2>
    
    <div class="form-control mb-3" v-if="providers.length > 0">
      <label class="label">
        <span class="label-text">默认服务商</span>
      </label>
      <select v-model="settings.defaultProvider" class="select select-bordered w-full max-w-md">
        <option v-for="provider in providers" :key="provider.id" :value="provider.id">
          {{ provider.name }}
        </option>
      </select>
    </div>
    <div class="form-control mb-3" v-if="availableModels.length > 0">
      <label class="label">
        <span class="label-text">默认模型</span>
      </label>
      <select v-model="settings.defaultModel" class="select select-bordered w-full max-w-md">
        <option v-for="model in availableModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end mt-6">
      <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { settingsAPI } from '../../services/SettingsApi';

interface Settings {
  defaultProvider?: string;
  defaultModel?: string;
}

const settings = ref<Settings>({
  defaultProvider: localStorage.getItem('defaultProvider') || '',
  defaultModel: localStorage.getItem('defaultModel') || ''
});

const providers = ref<{id: string, name: string, models: string[]}[]>([]);

const availableModels = computed(() => {
  const p = providers.value.find(p => p.id === settings.value.defaultProvider);
  return p ? p.models : [];
});

// 加载设置
const loadSettings = async () => {
  try {
    const config: any = await settingsAPI.getModels();
    
    // 加载服务商列表
    providers.value = Object.entries(config.mcpServers || {}).map(([id, server]: [string, any]) => ({
      id,
      name: server.name || id,
      models: server.models || ['gpt-3.5-turbo']
    }));

    // 加载用户偏好设置
    settings.value.defaultProvider = localStorage.getItem('defaultProvider') || '';
    settings.value.defaultModel = localStorage.getItem('defaultModel') || '';
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    // 保存用户偏好到本地存储
    if (settings.value.defaultProvider) {
      localStorage.setItem('defaultProvider', settings.value.defaultProvider);
    }
    if (settings.value.defaultModel) {
      localStorage.setItem('defaultModel', settings.value.defaultModel);
    }
    
    alert('设置已保存');
  } catch (error) {
    console.error('保存设置失败:', error);
    alert(`保存设置失败: ${error}`);
  }
};

// 重置设置
const resetSettings = async () => {
  if (confirm('确定要重置所有设置吗？')) {
    await loadSettings();
  }
};

// 初始化加载
loadSettings();
</script>