<template>
  <div class="app-container">
    <header class="app-header">
      <h1>MCP 服务器配置</h1>
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
import { ref, onMounted } from 'vue';
import ServerConfig from '../components/ServerConfig.vue';
import ConnectionStatus from '../components/ConnectionStatus.vue';
import LogViewer from '../components/LogViewer.vue';
import { configAPI } from '../services/api';
import type { MCPConfig } from '../types/config';

const logViewer = ref<InstanceType<typeof LogViewer> | null>(null);

const currentConfig = ref<MCPConfig>({
  serverUrl: '',
  apiKey: '',
  debug: false,
  transport: 'http',
  mcpServers: {}
});

onMounted(async () => {
  try {
    const config = await configAPI.loadConfig();
    currentConfig.value = config;
    logViewer.value?.addLog('info', '已从服务器加载配置');
  } catch (error) {
    logViewer.value?.addLog('error', `加载配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
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