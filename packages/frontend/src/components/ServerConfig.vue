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
              <button type="button" class="btn btn-error btn-sm" @click="removeServer(id)">删除</button>
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
        <button type="button" class=" btn btn-outline" @click="addServer">添加服务器</button>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">保存配置</button>
        <button type="button" @click="resetConfig" class="btn btn-outline">重置</button>
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
    config.value = {...config.value, ...savedConfig};
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
  @apply max-w-2xl mx-auto p-6;
}

.config-form {
  @apply flex flex-col gap-6;
}

.form-group {
  @apply form-control;
}

label {
  @apply label;
}

input[type="text"],
input[type="password"],
select {
  @apply input input-bordered w-full;
}

.checkbox-label,
.radio-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.radio-group {
  @apply flex gap-6;
}

.form-actions {
  @apply flex gap-4 mt-6;
}

.server-list {
  @apply mt-8 pt-6 border-t border-base-200;
}

.server-items {
  @apply flex flex-col gap-6 my-6;
}

.server-item {
  @apply card bg-base-100 shadow-md p-6;
}

.server-header {
  @apply flex justify-between items-center mb-4;
}

.server-header h4 {
  @apply m-0 text-primary;
}

.server-details {
  @apply grid gap-4;
}


.form-actions {
  @apply flex gap-3 justify-end mt-6;
}</style>