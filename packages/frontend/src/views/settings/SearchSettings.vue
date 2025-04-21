<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">网络搜索设置</h2>
    
    <!-- 添加您的表单控件和功能 -->
    <div class="form-control mb-3">
      <label class="label">
        <span class="label-text">搜索引擎</span>
      </label>
      <select v-model="settings.searchEngine" class="select select-bordered w-full max-w-md">
        <option value="google">Google</option>
        <option value="bing">Bing</option>
      </select>
    </div>

    <div class="flex justify-end mt-6">
      <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const settings = ref({
  searchEngine: localStorage.getItem('searchEngine') || 'google'
});

const saveSettings = () => {
  localStorage.setItem('searchEngine', settings.value.searchEngine);
  alert('设置已保存');
};

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    settings.value.searchEngine = 'google';
  }
};
</script>