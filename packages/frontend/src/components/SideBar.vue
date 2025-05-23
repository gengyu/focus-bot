<template>
  <div class="w-15 bg-background text-primary border-r border-r-border p-4 flex flex-col justify-between items-center">
    <div class="flex flex-col gap-6">
      <!-- 聊天入口 -->
      <router-link to="/chat" class="w-6 h-6">
        <ChatBubbleLeftRightIcon />
      </router-link>

      <!-- 应用入口 -->
      <router-link to="/apps" class="w-6 h-6">
        <Square3Stack3DIcon />
      </router-link>

      <!-- 知识库入口 -->
      <router-link to="/knowledge" class="w-6 h-6">
        <BookOpenIcon />
      </router-link>

      <!-- 个人中心入口 -->
      <router-link to="/profile" class="w-6 h-6">
        <UserCircleIcon />
      </router-link>
    </div>

    <div>
      <div class="mt-4 w-6 h-6">
        <router-link to="/settings">
          <Cog6ToothIcon></Cog6ToothIcon>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  Square3Stack3DIcon,
  BookOpenIcon,
  UserCircleIcon
} from "@heroicons/vue/20/solid";
</script>