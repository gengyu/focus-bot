<template>
  <div class="container mx-auto px-4 py-6 h-screen">
    <div class="flex flex-col h-full">
      <h1 class="text-2xl font-bold mb-4">AI 助手</h1>
      <div class="flex-1">
        <ChatWindow />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from '../components/ChatWindow.vue';
</script>