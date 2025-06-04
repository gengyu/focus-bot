<template>
  <div class="flex h-screen">
    <SideBar />
    <main class="flex-1 h-screen overflow-y-auto bg-gray-50">
      <router-view  v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="$route.fullPath" />
        </keep-alive>
      </router-view>
<!--      <keep-alive>-->
<!--        <router-view />-->
<!--      </keep-alive>-->
    </main>
  </div>
</template>

<script setup lang="ts">
import SideBar from './components/SideBar.vue';
</script>

