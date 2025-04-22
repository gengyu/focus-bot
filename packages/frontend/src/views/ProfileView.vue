<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">个人中心</h1>
      
      <!-- 用户信息卡片 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
            <span class="text-2xl text-gray-600">用户</span>
          </div>
          <div>
            <h2 class="text-xl font-semibold">用户名</h2>
            <p class="text-gray-600">user@example.com</p>
          </div>
        </div>
        
        <!-- 用户统计信息 -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-xl font-semibold">0</div>
            <div class="text-gray-600">对话数</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold">0</div>
            <div class="text-gray-600">知识库</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold">0</div>
            <div class="text-gray-600">应用数</div>
          </div>
        </div>
      </div>
      
      <!-- 快捷操作 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">快捷操作</h3>
        <div class="space-y-3">
          <button class="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors flex items-center">
            <span class="mr-2">🔑</span> 修改密码
          </button>
          <button class="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors flex items-center">
            <span class="mr-2">📝</span> 编辑资料
          </button>
          <button class="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors flex items-center">
            <span class="mr-2">⚙️</span> 账号设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>