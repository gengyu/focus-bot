<template>
  <div class="app-container">
    <header class="app-header">
      <h1>MCP 服务器配置</h1>
    </header>
    
    <main class="main-content">
      <ConnectionStatus @connectionChange="handleConnectionChange" />
      <ServerConfig @save="handleConfigSave" />
      <LogViewer ref="logViewer" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ServerConfig from './components/ServerConfig.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import LogViewer from './components/LogViewer.vue';

interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  debug?: boolean;
  transport?: 'stdio' | 'http';
}

const logViewer = ref<InstanceType<typeof LogViewer> | null>(null);

onMounted(() => {
  // 从本地存储加载配置
  const savedConfig = localStorage.getItem('mcpConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      handleConfigSave(config);
      logViewer.value?.addLog('info', '已加载本地配置');
    } catch (error) {
      logViewer.value?.addLog('error', '加载本地配置失败');
    }
  }
});

const handleConfigSave = (config: MCPConfig) => {
  try {
    localStorage.setItem('mcpConfig', JSON.stringify(config));
    logViewer.value?.addLog('info', '配置已保存到本地存储');
  } catch (error) {
    logViewer.value?.addLog('error', '保存配置失败');
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
  { id: 1, content: '项目 1' },
  { id: 2, content: '项目 2' },
  { id: 3, content: '项目 3' },
  { id: 4, content: '项目 4' },
  { id: 5, content: '项目 5' }
]);

const customItems = ref<CustomItem[]>([
  { id: 1, title: '任务 1', description: '这是一个示例任务' },
  { id: 2, title: '任务 2', description: '这是另一个示例任务' },
  { id: 3, title: '任务 3', description: '这是第三个示例任务' },
  { id: 4, title: '任务 4', description: '这是第四个示例任务' }
]);

const handleDragStart = (item: DraggableItem) => {
  console.log('开始拖动:', item);
};

const handleDragMove = (item: DraggableItem, currentIndex: number) => {
  console.log('拖动中:', item, '当前位置:', currentIndex);
};

const handleDragEnd = (startIndex: number, endIndex: number) => {
  console.log('拖动结束:', startIndex, '->', endIndex);
  const item = items.value[startIndex];
  items.value.splice(startIndex, 1);
  items.value.splice(endIndex, 0, item);
};

const handleEdit = (item: CustomItem) => {
  console.log('编辑:', item);
};

const handleDelete = (item: CustomItem) => {
  console.log('删除:', item);
};
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.dl-item {
  padding: 1rem;
  margin: 0.5rem 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s ease;
}

.dl-item:hover {
  background: #f5f5f5;
}

.custom-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s ease;
}

.custom-item:hover {
  background: #f5f5f5;
}

.item-content {
  flex: 1;
}

.item-title {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.item-desc {
  display: block;
  color: #666;
  font-size: 0.9rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.item-actions button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.item-actions button:hover {
  background: #45a049;
}

.item-actions button:last-child {
  background: #f44336;
}

.item-actions button:last-child:hover {
  background: #da190b;
}

.custom-dragging {
  opacity: 0.8;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.custom-dragging * {
  pointer-events: none;
}
</style>