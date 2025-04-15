<template>
  <div class="server-config">
    <form @submit.prevent="saveConfig" class="config-form">
<!--      <div class="form-group">-->
<!--        <label>传输方式</label>-->
<!--        <select class="select" v-model="config.transport">-->
<!--          <option class="" value="http">HTTP</option>-->
<!--          <option class="" value="stdio">STDIO</option>-->
<!--        </select>-->
<!--      </div>-->

      <div class="server-list">
        <div class="server-items">
          <div v-for="(server, id) in config.mcpServers" :key="id" class="server-item">
            <div class="server-header">
              <h4 class="flex-1 mr-6">
                <div class="form-group">
                  <input type="text"
                         v-model="config.apiKey"
                         placeholder="可选: 输入API密钥"
                         class="input input-bordered w-full max-w-xs" />
                </div>
              </h4>
              <div class="status-indicator">
                <span class="badge" :class="serverStatus[id] ? 'badge-success' : 'badge-error'">
                  {{ serverStatus[id] ? '运行中' : '已停止' }}
                </span>
              </div>
              <button type="button" class="btn btn-info btn-sm ml-2" @click="saveConfig">保存配置</button>
            </div>
            <div class="server-details">
              <div class="form-group">
                <label :for="`server-name-${id}`">名称: {{server.name}}</label>
                <textarea class="textarea textarea-info"
                          rows="8"
                          v-model="serverString" placeholder="服务器配置"></textarea>
              </div>
              <div class="capabilities-list" v-if="serverCapabilities[id]">
                <h5 class="text-lg font-semibold mb-2">服务能力列表</h5>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="capability in serverCapabilities[id]" :key="capability.name" class="capability-item">
                    <div class="p-2 bg-base-200 rounded">
                      <span class="font-medium">{{ capability.name }}</span>
                      <p class="text-sm opacity-70">{{ capability.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { configAPI } from '../services/api';
import type { MCPConfig, MCPServerConfig } from '../types/config';
import { useRoute } from "vue-router";

interface Capability {
  name: string;
  description: string;
}

const route = useRoute()
const config = ref<MCPConfig>({
  serverUrl: 'http://localhost:5000',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {}
});

const argsString = reactive<Record<string, string>>({}); // 用于存储每个服务器的参数字符串
const serverString = ref('');
const serverStatus = reactive<Record<string, boolean>>({}); // 存储服务器运行状态
const serverCapabilities = reactive<Record<string, Capability[]>>({}); // 存储服务器能力列表

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

const toggleServerStatus = async (id: string) => {
  try {
    serverStatus[id] = await configAPI.toggleMCPStatus(id);
    if (serverStatus[id]) {
      // 如果服务器启动成功，获取能力列表
      const capabilities = await configAPI.capabilities(id);
      serverCapabilities[id] = capabilities;
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : '切换服务器状态失败');
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
  serverStatus[id] = false;
};

const removeServer = (id: string) => {
  delete config.value.mcpServers[id];
  delete argsString[id];
  delete serverStatus[id];
  delete serverCapabilities[id];
};

const updateServerArgs = (id: string) => {
  const args = argsString[id].split(' ').filter(arg => arg.trim() !== '');
  config.value.mcpServers[id].args = args;
};

onMounted(async () => {
  try {
    const list = await configAPI.getConfigList();
    const savedConfig = await configAPI.loadConfig();
    config.value = {...config.value, ...savedConfig};
    //

    Object.entries(savedConfig.mcpServers || {}).forEach(([id, server]) => {
      argsString[id] = server.args.join(' ');
    });
    
    if (route.params.id) {
      serverString.value = JSON.stringify(config.value.mcpServers[route.params.id as string] || {}, null, 2);
    }
      // 初始化参数字符串和服务器状态
      for (const item of list) {
        serverStatus[item.id] = item.isRunning;
        if (item.isRunning) {
          const capabilities = await configAPI.capabilities(item.id);
          serverCapabilities[item.id] = capabilities;
        }
      }
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
  @apply border-t border-base-200;
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