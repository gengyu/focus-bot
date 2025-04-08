<template>
  <div class="connection-status">
    <div class="status-indicator" :class="{ 'connected': isConnected }">
      <div class="status-dot"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    <div class="connection-actions">
      <button class="btn-secondary" @click="testConnection" :disabled="isLoading">
        {{ isLoading ? '测试中...' : '测试连接' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
}

const props = defineProps<{
  config: MCPConfig;
}>();
  
const isConnected = ref(false);
const isLoading = ref(false);

const statusText = computed(() => {
  return isConnected.value ? '已连接' : '未连接';
});

const emit = defineEmits<{
  (e: 'connectionChange', status: boolean): void;
}>();

async function testConnection() {
  if (!props.config.serverUrl) {
    emit('connectionChange', false);
    return;
  }

  try {
    isLoading.value = true;
    
    const response = await fetch(`${props.config.serverUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(props.config.apiKey && { 'Authorization': `Bearer ${props.config.apiKey}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    isConnected.value = data.status === 'ok';
    emit('connectionChange', isConnected.value);
  } catch (error) {
    console.error('连接测试失败:', error);
    isConnected.value = false;
    emit('connectionChange', false);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff4d4f;
  transition: background-color 0.3s ease;
}

.status-indicator.connected .status-dot {
  background-color: #52c41a;
}

.status-text {
  font-weight: 500;
  color: var(--text-color);
}

.connection-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>