<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">关于设置</h2>

    <!-- 添加您的表单控件和功能 -->

    <div class="flex justify-end mt-6">
      <button @click="resetSettings" class="btn btn-outline mr-2">重置</button>
      <button @click="saveSettings" class="btn btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const settings = ref({
  version: localStorage.getItem('version') || '1.0'
});

const saveSettings = () => {
  localStorage.setItem('version', settings.value.version);
  alert('设置已保存');
};

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    settings.value.version = '1.0';
  }
};
</script>