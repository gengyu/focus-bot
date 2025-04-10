
<template>
  <div class="min-h-screen bg-base-200">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex space-x-8">
            <router-link to="/" class="inline-flex items-center px-1 pt-1 text-sm font-medium">首页</router-link>
            <router-link to="/configs" class="inline-flex items-center px-1 pt-1 text-sm font-medium">配置管理</router-link>
            <router-link to="/config" class="inline-flex items-center px-1 pt-1 text-sm font-medium">配置管理</router-link>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto py-6 px-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">

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