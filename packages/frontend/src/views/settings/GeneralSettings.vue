<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">通用设置</h2>
    
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

    <!-- 操作按钮 -->
    <div class="flex justify-end mt-6">
      <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { configAPI } from '../../services/api';
import type { MCPConfig } from '../../types/config';
import log from "loglevel";

const settings = ref<MCPConfig>({
  serverUrl: '',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {}
});

// 加载设置
const loadSettings = async () => {
  try {
    const config = await configAPI.getConfig();
    settings.value = config;
  } catch (error) {
    log.error("Failed to load settings:", error);
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    await configAPI.saveConfig(settings.value);
    alert('设置已保存');
  } catch (error) {
    log.error("Failed to save settings:", error);
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