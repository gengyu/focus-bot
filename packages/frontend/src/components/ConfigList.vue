<template>
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <table class="table w-full">
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
import { ref } from 'vue';

interface Config {
  id: string;
  name: string;
  isRunning: boolean;
}

const configs = ref<Config[]>([
  { id: '1', name: 'MCP配置1', isRunning: true },
  { id: '2', name: 'MCP配置2', isRunning: false },
]);

const toggleMCP = (config: Config) => {
  config.isRunning = !config.isRunning;
  // TODO: 实现实际的MCP启动/停止逻辑
};
</script>