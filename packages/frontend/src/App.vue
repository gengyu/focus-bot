<template>
  <div class="flex h-screen">
    <SideBar />
    <main class="flex-1 bg-gray-50">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import SideBar from './components/SideBar.vue';
</script>

