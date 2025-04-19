<template>
  <div class="app-container p-6">
    <header class="app-header mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">设置</h1>
      </div>
    </header>

    <main class="main-content">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">应用设置</h2>
        
        <!-- 通用设置 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">通用</h3>
          <div class="form-control mb-3">
            <label class="label cursor-pointer justify-start">
              <input type="checkbox" v-model="settings.debug" class="checkbox checkbox-primary mr-2" />
              <span class="label-text">调试模式</span>
            </label>
          </div>
          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">API 服务器地址</span>
            </label>
            <input 
              type="text" 
              v-model="settings.serverUrl" 
              placeholder="例如: http://localhost:3000" 
              class="input input-bordered w-full max-w-md" 
            />
          </div>
          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">API 密钥</span>
            </label>
            <input 
              type="password" 
              v-model="settings.apiKey" 
              placeholder="输入API密钥" 
              class="input input-bordered w-full max-w-md" 
            />
          </div>
          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">传输方式</span>
            </label>
            <select v-model="settings.transport" class="select select-bordered w-full max-w-md">
              <option value="http">HTTP</option>
              <option value="stdio">STDIO</option>
            </select>
          </div>
        </div>

        <!-- 默认模型设置 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">默认模型设置</h3>
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
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end mt-6">
          <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
          <button @click="saveSettings" class="btn btn-primary">保存设置</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { configAPI } from '../services/api';
import type { MCPConfig } from '../types/config';
import {settingsAPI} from "@/services/SettingsApi.ts";

interface ModelConfig {
  id: string;
  name: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
}

interface Settings extends MCPConfig {
  defaultProvider?: string;
  defaultModel?: string;
}

const settings = ref<Settings>({
  serverUrl: '',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {},
  defaultProvider: '',
  defaultModel: ''
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
    settings.value = {
      ...config,
      defaultProvider: localStorage.getItem('defaultProvider') || '',
      defaultModel: localStorage.getItem('defaultModel') || ''
    };
    
    // 加载服务商列表
    providers.value = Object.entries(config.mcpServers || {}).map(([id, server]: [string, any]) => ({
      id,
      name: server.name || id,
      models: server.models || ['gpt-3.5-turbo']
    }));
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    // 保存到配置文件
    const configToSave: MCPConfig = {
      serverUrl: settings.value.serverUrl,
      apiKey: settings.value.apiKey,
      debug: settings.value.debug,
      transport: settings.value.transport,
      mcpServers: settings.value.mcpServers
    };
    await configAPI.saveConfig(configToSave);
    
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

onMounted(() => {
  loadSettings();
});
</script>