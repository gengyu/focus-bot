<template>
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <!-- 搜索框 -->
    <div class="p-4">
      <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索配置..."
          class="input input-bordered w-full"
      />
    </div>

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
    <div v-else-if="filteredConfigs.length === 0" class="p-4 text-center">
      <p>暂无配置</p>
    </div>

    <!-- 配置列表 -->
    <div v-else class="divide-y">

      <ul class="list bg-base-100 rounded-box shadow-md">

        <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">mcp服务列表</li>

        <li v-for="config in filteredConfigs"
            :key="config.id"
            class="px-2 py-2">
          <div class="flex items-center">


            <div class="flex-1" @click="capabilities(config)">{{ config.name }}</div>

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
            <button class="btn  btn-square btn-sm btn-ghost "  @click="toggleMCP(config)">
              <StopIcon class="size-6 text-error" v-if=" config.isRunning"></StopIcon>
              <PlayIcon class="size-6 text-success " v-else></PlayIcon>
            </button>
            <button class="btn  btn-square btn-sm btn-ghost "
                    @click="deleteConfig(config.id)"
                    title="删除">
              <TrashIcon class="size-6 text-error"></TrashIcon>
            </button>
            <button class="btn  btn-square btn-sm btn-ghost "
                    title="删除">
              <router-link
                  :to="`/config/${config.id}`"
                  class="text-primary hover:underline cursor-pointer"
              >
                <ArrowTopRightOnSquareIcon class="size-6"></ArrowTopRightOnSquareIcon>

              </router-link>

            </button>

          </div>
        </li>


      </ul>

    </div>
  </div>



</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {configAPI, type ConfigListItem} from '../services/api.ts';
import type {MCPServerConfig} from '../types/config';
import { PlayIcon, StopIcon,

  ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import {TrashIcon } from '@heroicons/vue/24/outline'

interface Config extends ConfigListItem {
}

const configs = ref<Config[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// 搜索框
const searchQuery = ref('');
const filteredConfigs = computed(() => {
  return configs.value.filter(config =>
      config.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 展开状态管理
const expandedConfigs = ref<Record<string, boolean>>({});
const loadingTools = ref<Record<string, boolean>>({});
const toolsError = ref<Record<string, string>>({});
const configTools = ref<Record<string, MCPServerConfig[]>>({});

// 切换展开状态并加载工具列表
const toggleExpand = async (config: Config) => {
  const isExpanded = expandedConfigs.value[config.id];
  expandedConfigs.value[config.id] = !isExpanded;

  // 如果是展开且还没有加载过工具列表，则加载工具列表
  if (!isExpanded && !configTools.value[config.id]) {
    loadingTools.value[config.id] = true;
    toolsError.value[config.id] = '';

    try {
      const mcpConfig = await configAPI.getConfigById(config.id);
      configTools.value[config.id] = Object.values(mcpConfig.mcpServers || {});
    } catch (err) {
      toolsError.value[config.id] = err instanceof Error ? err.message : '加载工具列表失败';
      console.error('加载工具列表失败:', err);
    } finally {
      loadingTools.value[config.id] = false;
    }
  }
};

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
const capabilities = async (config: Config) => {
  try {
    // 调用后端API切换状态
    const newStatus = await configAPI.capabilities(config.id);
    // 更新本地状态
    config.isRunning = newStatus;
  } catch (err) {
    console.error('切换MCP状态失败:', err);
    // 显示错误提示
    error.value = err instanceof Error ? err.message : '切换MCP状态失败';
  }
};

// 删除配置
const deleteConfig = async (configId: string) => {
  try {
    await configAPI.deleteConfig(configId);
    configs.value = configs.value.filter(config => config.id !== configId);
  } catch (err) {
    console.error('删除配置失败:', err);
    error.value = err instanceof Error ? err.message : '删除配置失败';
  }
};

// 组件挂载时获取配置列表
onMounted(() => {
  fetchConfigs();
});
</script>