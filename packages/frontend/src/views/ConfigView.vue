<template>
  <div class="app-container">
    <header class="app-header">
      <div class="flex justify-between items-center">
        <h1>MCP 服务器配置</h1>
        <router-link to="/configs" class="btn btn-sm btn-outline">返回列表</router-link>
      </div>
    </header>

    <main class="main-content">
      <ConnectionStatus
          :config="currentConfig"
          @connectionChange="handleConnectionChange"
      />
      <ServerConfig @save="handleConfigSave" />
      <LogViewer ref="logViewer" />
    </main>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ServerConfig from '../components/ServerConfig.vue';
import ConnectionStatus from '../components/ConnectionStatus.vue';
import LogViewer from '../components/LogViewer.vue';
import { configAPI } from '../services/api';
import type { MCPConfig } from '../types/config';

const logViewer = ref<InstanceType<typeof LogViewer> | null>(null);
const route = useRoute();
const router = useRouter();
const configId = ref<string | undefined>(route.params.id as string | undefined);

const currentConfig = ref<MCPConfig>({
  serverUrl: '',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {}
});

const loading = ref(false);

// 加载配置信息
const loadConfig = async (id?: string) => {
  try {
    loading.value = true;
    // 如果有ID，则加载特定配置，否则加载默认配置
    const config = id 
      ? await configAPI.getConfigById(id)
      : await configAPI.loadConfig();
    currentConfig.value = config;
    logViewer.value?.addLog('info', '已从服务器加载配置');
  } catch (error) {
    logViewer.value?.addLog('error', `加载配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    loading.value = false;
  }
};

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  configId.value = newId as string | undefined;
  loadConfig(configId.value);
});

onMounted(() => {
  loadConfig(configId.value);
});

const handleConfigSave = async (config: MCPConfig) => {
  try {
    currentConfig.value = config;
    await configAPI.saveConfig(config);
    logViewer.value?.addLog('info', '配置已保存到服务器');
  } catch (error) {
    logViewer.value?.addLog('error', `保存配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

const handleConnectionChange = (status: boolean) => {
  logViewer.value?.addLog(
      status ? 'info' : 'error',
      status ? '已成功连接到服务器' : '服务器连接失败'
  );
};
</script>

<style>
:root {
  --primary-color: #4CAF50;
  --text-color: #333;
  --border-color: #ddd;
  --background-color: #f5f5f5;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
  Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.app-header h1 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>