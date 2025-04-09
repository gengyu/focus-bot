<template>
  <div class="p-6 space-y-8">
    <!-- Headless UI Menu 示例 -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Headless UI 示例</h2>
      <Menu as="div" class="relative inline-block text-left">
        <MenuButton class="btn btn-primary">
          选项菜单
        </MenuButton>
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute left-0 mt-2 w-56 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div class="px-1 py-1">
              <MenuItem v-slot="{ active }">
                <button :class="[active ? 'bg-primary text-white' : 'text-gray-900', 'group flex w-full items-center rounded-md px-2 py-2 text-sm']">
                  选项 1
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button :class="[active ? 'bg-primary text-white' : 'text-gray-900', 'group flex w-full items-center rounded-md px-2 py-2 text-sm']">
                  选项 2
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </div>

    <!-- DaisyUI 组件示例 -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">DaisyUI 示例</h2>
      <div class="space-y-4">
        <!-- 按钮示例 -->
        <div class="space-x-2">
          <button class="btn btn-primary">主要按钮</button>
          <button class="btn btn-secondary">次要按钮</button>
          <button class="btn btn-accent">强调按钮</button>
        </div>

        <!-- 卡片示例 -->
        <div class="card w-96 bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">卡片标题</h2>
            <p>这是一个使用 DaisyUI 样式的卡片组件示例。</p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">确认</button>
            </div>
          </div>
        </div>

        <!-- 警告提示示例 -->
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>这是一个信息提示框示例。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
</script>