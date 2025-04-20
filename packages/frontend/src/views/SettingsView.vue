<template>
  <div class="app-container flex">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav class="p-4 space-y-2">
        <router-link to="/settings/model" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <CloudIcon class="h-5 w-5 mr-3" />
          <span>模型服务</span>
        </router-link>
        <router-link to="/settings/model" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <CubeIcon class="h-5 w-5 mr-3" />
          <span>默认模型</span>
        </router-link>
        <router-link to="/settings/search" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <GlobeAltIcon class="h-5 w-5 mr-3" />
          <span>网络搜索</span>
        </router-link>
        <router-link to="/settings/server" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <ServerIcon class="h-5 w-5 mr-3" />
          <span>MCP 服务器</span>
        </router-link>
        <router-link to="/settings/general" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <Cog6ToothIcon class="h-5 w-5 mr-3" />
          <span>常规设置</span>
        </router-link>
        <router-link to="/settings/display" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <ComputerDesktopIcon class="h-5 w-5 mr-3" />
          <span>显示设置</span>
        </router-link>
        <router-link to="/settings/miniapp" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <WindowIcon class="h-5 w-5 mr-3" />
          <span>小程序设置</span>
        </router-link>
        <router-link to="/settings/shortcut" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <RocketLaunchIcon class="h-5 w-5 mr-3" />
          <span>快捷方式</span>
        </router-link>
        <router-link to="/settings/assistant" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <HandRaisedIcon class="h-5 w-5 mr-3" />
          <span>快捷助手</span>
        </router-link>
        <router-link to="/settings/phrase" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <BoltIcon class="h-5 w-5 mr-3" />
          <span>快捷短语</span>
        </router-link>
        <router-link to="/settings/data" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <CircleStackIcon class="h-5 w-5 mr-3" />
          <span>数据设置</span>
        </router-link>
        <router-link to="/settings/about" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <InformationCircleIcon class="h-5 w-5 mr-3" />
          <span>关于我们</span>
        </router-link>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <div class="flex-1 p-6">
      <header class="app-header mb-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">设置</h1>
        </div>
      </header>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
  </div>
</template>

<script setup lang="ts">
import {
  CloudIcon,
  CubeIcon,
  GlobeAltIcon,
  ServerIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  WindowIcon,
  RocketLaunchIcon,
  HandRaisedIcon,
  BoltIcon,
  CircleStackIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';
</script>