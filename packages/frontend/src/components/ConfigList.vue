<template>
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <!-- 加载状态显示 -->
    <div v-if="loading" class="p-4 text-center">
      <div class="loading loading-spinner loading-md"></div>
      <p class="mt-2">正在加载配置列表...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="p-4 text-center text-error">
      <p>{{ error }}</p>
      <button class="btn btn-sm btn-outline mt-2" @click="fetchConfigs">重试</button>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="configs.length === 0" class="p-4 text-center">
      <p>暂无MCP配置</p>
    </div>

    <!-- 配置列表 -->
    <table v-else class="table w-full">
      <thead>
        <tr>
          <th>配置名称</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="config in configs" :key="config.id" class="hover">
          <td>{{ config.name }}</td>
          <td>
            <div class="flex items-center space-x-2">
              <div
                class="h-3 w-3 rounded-full"
                :class="config.isRunning ? 'bg-success animate-pulse' : 'bg-error'"
              ></div>
              <span
                class="text-sm font-medium"
                :class="config.isRunning ? 'text-success' : 'text-error'"
              >
                {{ config.isRunning ? '运行中' : '已停止' }}
              </span>
            </div>
          </td>
          <td>
            <div class="flex items-center space-x-2">
              <button
                class="btn btn-sm btn-circle btn-ghost"
                :class="{ 'text-success': !config.isRunning, 'text-error': config.isRunning }"
                @click="toggleMCP(config)"
                :title="config.isRunning ? '停止' : '启动'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  :class="{ 'hidden': config.isRunning }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  :class="{ 'hidden': !config.isRunning }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { configAPI, type ConfigListItem } from '../services/api';

interface Config extends ConfigListItem {}

const configs = ref<Config[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// 获取配置列表
const fetchConfigs = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    configs.value = await configAPI.getConfigList();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取配置列表失败';
    console.error('获取配置列表失败:', err);
  } finally {
    loading.value = false;
  }
};

// 切换MCP状态
const toggleMCP = async (config: Config) => {
  try {
    // 调用后端API切换状态
    const newStatus = await configAPI.toggleMCPStatus(config.id);
    // 更新本地状态
    config.isRunning = newStatus;
  } catch (err) {
    console.error('切换MCP状态失败:', err);
    // 显示错误提示
    error.value = err instanceof Error ? err.message : '切换MCP状态失败';
  }
};

// 组件挂载时获取配置列表
onMounted(() => {
  fetchConfigs();
});
</script>