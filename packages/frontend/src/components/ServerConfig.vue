<template>
  <div class="server-config">
    <h2>MCP 服务器配置</h2>
    <form @submit.prevent="saveConfig" class="config-form">
      <div class="form-group">
        <label for="serverUrl">服务器地址</label>
        <input
          id="serverUrl"
          v-model="config.serverUrl"
          type="text"
          placeholder="http://localhost:5000"
          required
        >
      </div>
      
      <div class="form-group">
        <label for="apiKey">API 密钥</label>
        <input
          id="apiKey"
          v-model="config.apiKey"
          type="password"
          placeholder="输入API密钥"
        >
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="config.debug"
          >
          启用调试模式
        </label>
      </div>

      <div class="form-group">
        <label>传输方式</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              type="radio"
              v-model="config.transport"
              value="http"
            >
            HTTP
          </label>
          <label class="radio-label">
            <input
              type="radio"
              v-model="config.transport"
              value="stdio"
            >
            标准输入输出
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">保存配置</button>
        <button type="button" @click="resetConfig" class="btn-secondary">重置</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
}

const config = ref<MCPConfig>({
  serverUrl: 'http://localhost:5000',
  apiKey: '',
  debug: false,
  transport: 'http'
});

const emit = defineEmits<{
  (e: 'save', config: MCPConfig): void;
}>();

const saveConfig = () => {
  emit('save', config.value);
};

const resetConfig = () => {
  config.value = {
    serverUrl: 'http://localhost:5000',
    apiKey: '',
    debug: false,
    transport: 'http'
  };
};
</script>

<style scoped>
.server-config {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="password"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  border: none;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}
</style>