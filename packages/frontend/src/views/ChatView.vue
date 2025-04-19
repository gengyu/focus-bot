<template>
  <div class="chat-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo">🧠</span>
        <span class="sidebar-title">智AI助手</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li class="nav-item active">默认助手</li>
          <li class="nav-item">demo</li>
          <li class="nav-item">网页生成</li>
          <li class="nav-item">One Word One...</li>
        </ul>
      </nav>
    </aside>
    <div class="main-panel">
      <header class="app-header">
        <h1>gemma-3:latest | Ollama</h1>
      </header>
      <main class="main-content">
        <ChatWindow />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
 
</script>

<style>
.chat-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f6fa;
}
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 0 0 20px 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 32px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.logo {
  font-size: 2rem;
  margin-right: 10px;
}
.sidebar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}
.sidebar-nav {
  flex: 1;
  padding: 24px 0 0 0;
}
.sidebar-nav ul {
  list-style: none;
  padding: 0 0 0 24px;
  margin: 0;
}
.nav-item {
  padding: 10px 0 10px 12px;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.2s;
}
.nav-item.active, .nav-item:hover {
  background: #e0e7ef;
  color: #2563eb;
  font-weight: 600;
}
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-header {
  background: #fff;
  padding: 18px 32px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}
.app-header h1 {
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.main-content {
  flex: 1;
  padding: 32px 32px 0 32px;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  margin: 0 24px 24px 24px;
  min-height: 0;
  overflow-y: auto;
}
@media (max-width: 900px) {
  .chat-layout { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; border-right: none; border-bottom: 1px solid #e5e7eb; }
  .main-panel { margin: 0; }
  .main-content { margin: 0; border-radius: 0; padding: 16px 8px 0 8px; }
}
</style>