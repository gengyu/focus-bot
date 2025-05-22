<template>
  <div
    v-show="isActive"
    class="focus-tab-panel"
    role="tabpanel"
    :id="`tab-panel-${value}`"
    :aria-labelledby="`tab-${value}`"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

const props = defineProps({
  value: {
    type: String,
    required: true
  }
});

// 从父组件注入的当前活动标签值
const activeTab = inject('activeTab', computed(() => ''));

// 判断当前面板是否应该显示
const isActive = computed(() => activeTab.value === props.value);
</script>

<style scoped>
.focus-tab-panel {
  width: 100%;
}
</style>