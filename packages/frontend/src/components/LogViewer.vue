<template>
  <div class="log-viewer">
    <div class="log-header">
      <h2>系统日志</h2>
      <div class="log-actions">
        <button class="btn-secondary" @click="clearLogs">清除日志</button>
        <button class="btn-secondary" @click="refreshLogs">刷新</button>
      </div>
    </div>
    <div class="log-content" ref="logContainer">
      <div v-if="logs.length === 0" class="no-logs">
        暂无日志记录
      </div>
      <div v-else class="log-entries">
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.level">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

const logs = ref<LogEntry[]>([]);
const logContainer = ref<HTMLElement | null>(null);

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const addLog = (level: LogEntry['level'], message: string) => {
  logs.value.push({
    timestamp: Date.now(),
    level,
    message
  });
  scrollToBottom();
};

const clearLogs = () => {
  logs.value = [];
};

const refreshLogs = () => {
  // TODO: 实现从服务器获取最新日志的逻辑
  addLog('info', '刷新日志...');
};

const scrollToBottom = () => {
  if (logContainer.value) {
    setTimeout(() => {
      logContainer.value!.scrollTop = logContainer.value!.scrollHeight;
    }, 0);
  }
};

// 示例日志
onMounted(() => {
  addLog('info', '系统启动');
  addLog('warning', '配置未完全设置');
  addLog('error', '无法连接到服务器');
});

defineExpose({
  addLog
});
</script>

<style scoped>
.log-viewer {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.log-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color);
}

.log-actions {
  display: flex;
  gap: 8px;
}

.log-content {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
}

.no-logs {
  text-align: center;
  color: #999;
  padding: 20px;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.log-time {
  color: #666;
  white-space: nowrap;
}

.log-level {
  font-weight: bold;
  min-width: 70px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-entry.info {
  background-color: #e6f7ff;
}

.log-entry.warning {
  background-color: #fffbe6;
}

.log-entry.error {
  background-color: #fff2f0;
}

.btn-secondary {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}
</style>