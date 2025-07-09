<template>
  <div class="display-settings">
    <div class="setting-section">
      <h2 class="text-lg font-semibold mb-4">主题设置</h2>
      
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-medium">主题模式</h3>
          <p class="text-sm text-gray-500">选择浅色或深色主题</p>
        </div>
        <div class="flex items-center space-x-4">
          <button
            class="theme-button"
            :class="{ 'active': currentTheme === 'light' }"
            @click="setTheme('light')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <span>浅色</span>
          </button>
          <button
            class="theme-button"
            :class="{ 'active': currentTheme === 'dark' }"
            @click="setTheme('dark')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <span>深色</span>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-medium">跟随系统</h3>
          <p class="text-sm text-gray-500">自动跟随系统主题设置</p>
        </div>
        <Switch v-model="followSystem" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Switch } from '../components/ui';
import { themeManager } from '../utils/theme';

const currentTheme = ref(themeManager.getTheme());
const followSystem = ref(!localStorage.getItem('theme'));

const setTheme = (theme: 'light' | 'dark') => {
  followSystem.value = false;
  themeManager.setTheme(theme);
  currentTheme.value = theme;
};

watch(followSystem, (value) => {
  if (value) {
    localStorage.removeItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    themeManager.setTheme(theme);
    currentTheme.value = theme;
  }
});

onMounted(() => {
  // 监听主题变化
});
</script>

<style scoped>
.display-settings {
  padding: 1.5rem;
}

.setting-section {
  background-color: var(--color-neutral);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.theme-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-neutral);
  color: var(--color-text-light);
  transition: all var(--transition-normal);
}

.theme-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.theme-button.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.theme-button svg {
  transition: stroke var(--transition-normal);
}

.theme-button:hover svg {
  stroke: var(--color-accent);
}

.theme-button.active svg {
  stroke: white;
}
</style>