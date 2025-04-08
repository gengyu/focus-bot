<template>
  <div class="server-config">
    <form @submit.prevent="saveConfig" class="config-form">
      <div class="form-group">
        <label for="serverUrl">服务器地址</label>
        <input
          type="text"
          id="serverUrl"
          v-model="config.serverUrl"
          placeholder="例如: http://localhost:5000"
          required
        />
      </div>

      <div class="form-group">
        <label for="apiKey">API Key</label>
        <input
          type="password"
          id="apiKey"
          v-model="config.apiKey"
          placeholder="可选: 输入API密钥"
        />
      </div>

      <div class="form-group">
        <label>
          <input
            type="checkbox"
            v-model="config.debug"
          />
          调试模式
        </label>
      </div>

      <div class="form-group">
        <label>传输方式</label>
        <select v-model="config.transport">
          <option value="http">HTTP</option>
          <option value="stdio">STDIO</option>
        </select>
      </div>

      <div class="server-list">
        <h3>MCP 服务器列表</h3>
        <div class="server-items">
          <div v-for="(server, id) in config.mcpServers" :key="id" class="server-item">
            <div class="server-header">
              <h4>{{ server.name }}</h4>
              <button type="button" class="btn-danger" @click="removeServer(id)">删除</button>
            </div>
            <div class="server-details">
              <div class="form-group">
                <label :for="`server-name-${id}`">名称</label>
                <input
                  type="text"
                  :id="`server-name-${id}`"
                  v-model="server.name"
                  required
                />
              </div>
              <div class="form-group">
                <label :for="`server-command-${id}`">命令</label>
                <input
                  type="text"
                  :id="`server-command-${id}`"
                  v-model="server.command"
                  required
                />
              </div>
              <div class="form-group">
                <label :for="`server-args-${id}`">参数</label>
                <input
                  type="text"
                  :id="`server-args-${id}`"
                  v-model="argsString[id]"
                  @input="updateServerArgs(id)"
                  placeholder="用空格分隔多个参数"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="btn-secondary" @click="addServer">添加服务器</button>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">保存配置</button>
        <button type="button" @click="resetConfig" class="btn-secondary">重置</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { configAPI } from '../services/api';
import type { MCPConfig, MCPServerConfig } from '../types/config';

const config = ref<MCPConfig>({
  serverUrl: 'http://localhost:5000',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {}
});

const argsString = reactive<Record<string, string>>({}); // 用于存储每个服务器的参数字符串

const emit = defineEmits<{
  (e: 'save', config: MCPConfig): void;
}>();

const saveConfig = async () => {
  try {
    await configAPI.saveConfig(config.value);
    emit('save', config.value);
  } catch (error) {
    alert(error instanceof Error ? error.message : '保存配置失败');
  }
};

const addServer = () => {
  const id = `server-${Date.now()}`;
  config.value.mcpServers[id] = {
    name: '新服务器',
    command: 'npx',
    args: []
  };
  argsString[id] = '';
};

const removeServer = (id: string) => {
  delete config.value.mcpServers[id];
  delete argsString[id];
};

const updateServerArgs = (id: string) => {
  const args = argsString[id].split(' ').filter(arg => arg.trim() !== '');
  config.value.mcpServers[id].args = args;
};

onMounted(async () => {
  try {
    const savedConfig = await configAPI.loadConfig();
    config.value = savedConfig;
    // 初始化参数字符串
    Object.entries(savedConfig.mcpServers || {}).forEach(([id, server]) => {
      argsString[id] = server.args.join(' ');
    });
  } catch (error) {
    console.error('加载配置失败:', error);
  }
});

const resetConfig = () => {
  config.value = {
    serverUrl: 'http://localhost:5000',
    apiKey: '',
    debug: false,
    transport: 'http',
    mcpServers: {}
  };
  Object.keys(argsString).forEach(key => delete argsString[key]);
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
input[type="password"],
select {
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

.server-list {
  margin-top: 30px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.server-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.server-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background-color: white;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.server-header h4 {
  margin: 0;
  color: var(--primary-color);
}

.server-details {
  display: grid;
  gap: 15px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #43a047;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #c82333;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}</style>