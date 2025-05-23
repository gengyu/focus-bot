<template>
  <div class="focus-tabs" :class="tabsClasses">
    <div class="focus-tabs-list" role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.value"
        class="focus-tab"
        :class="{ 'focus-tab--active': modelValue === tab.value }"
        role="tab"
        :aria-selected="modelValue === tab.value"
        :aria-controls="`tab-panel-${tab.value}`"
        :id="`tab-${tab.value}`"
        @click="selectTab(tab.value)"
      >
        <div v-if="tab.icon" class="focus-tab-icon">
          <component :is="tab.icon" />
        </div>
        <span>{{ tab.label }}</span>
      </button>
      <div class="focus-tabs-indicator" :style="indicatorStyle"></div>
    </div>
    <div class="focus-tabs-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, provide } from 'vue';

interface Tab {
  label: string;
  value: string;
  icon?: any;
}

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array as () => Tab[],
    required: true
  },
  variant: {
    type: String,
    default: 'underline',
    validator: (value: string) => ['underline', 'pills', 'bordered'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  color: {
    type: String,
    default: 'accent',
    validator: (value: string) => ['primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error'].includes(value)
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue']);

const activeTabIndex = ref(0);

const selectTab = (value: string) => {
  emit('update:modelValue', value);
};

const updateActiveTabIndex = () => {
  const index = props.tabs.findIndex(tab => tab.value === props.modelValue);
  activeTabIndex.value = index >= 0 ? index : 0;
};

const indicatorStyle = computed(() => {
  if (props.variant !== 'underline') return {};
  
  const width = `${100 / props.tabs.length}%`;
  const left = `${(100 / props.tabs.length) * activeTabIndex.value}%`;
  
  return {
    width,
    left,
    backgroundColor: `var(--color-${props.color})`
  };
});

const tabsClasses = computed(() => {
  return {
    [`focus-tabs--${props.variant}`]: true,
    [`focus-tabs--${props.size}`]: true,
    [`focus-tabs--${props.color}`]: true,
    [`focus-tabs--radius-${props.borderRadius}`]: true,
    'focus-tabs--full-width': props.fullWidth
  };
});

// 提供当前活动标签值给子组件
provide('activeTab', computed(() => props.modelValue));

watch(() => props.modelValue, updateActiveTabIndex);

onMounted(() => {
  updateActiveTabIndex();
});
</script>

<style scoped>
.focus-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.focus-tabs-list {
  display: flex;
  position: relative;
  border-bottom: 1px solid var(--color-border);
}

.focus-tabs--pills .focus-tabs-list {
  border-bottom: none;
  gap: 0.5rem;
}

.focus-tabs--bordered .focus-tabs-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.25rem;
  background-color: var(--color-neutral-light);
}

.focus-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--color-text-light);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  flex: 1 0 auto;
}

.focus-tabs--sm .focus-tab {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.focus-tabs--md .focus-tab {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.focus-tabs--lg .focus-tab {
  padding: 1rem 1.25rem;
  font-size: 1rem;
}

.focus-tabs--full-width .focus-tab {
  flex: 1;
}

.focus-tabs--underline .focus-tab--active {
  color: var(--color-primary);
}

.focus-tabs--radius-none .focus-tab {
  border-radius: 0;
}

.focus-tabs--radius-sm .focus-tab {
  border-radius: var(--radius-sm);
}

.focus-tabs--radius-md .focus-tab {
  border-radius: var(--radius-md);
}

.focus-tabs--radius-lg .focus-tab {
  border-radius: var(--radius-lg);
}

.focus-tabs--radius-xl .focus-tab {
  border-radius: var(--radius-xl);
}

.focus-tabs--radius-full .focus-tab {
  border-radius: var(--radius-full);
}

.focus-tabs--pills .focus-tab {
  border-radius: var(--radius-full);
}

.focus-tabs--pills .focus-tab--active {
  background-color: var(--color-accent);
  color: white;
}

.focus-tabs--bordered .focus-tab {
  border-radius: var(--radius-sm);
}

.focus-tabs--bordered .focus-tab--active {
  background-color: var(--color-neutral);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.focus-tabs--primary .focus-tab--active {
  color: var(--color-primary);
}

.focus-tabs--secondary .focus-tab--active {
  color: var(--color-secondary);
}

.focus-tabs--accent .focus-tab--active {
  color: var(--color-accent);
}

.focus-tabs--success .focus-tab--active {
  color: var(--color-success);
}

.focus-tabs--info .focus-tab--active {
  color: var(--color-info);
}

.focus-tabs--warning .focus-tab--active {
  color: var(--color-warning);
}

.focus-tabs--error .focus-tab--active {
  color: var(--color-error);
}

.focus-tabs--pills.focus-tabs--primary .focus-tab--active {
  background-color: var(--color-primary);
  color: white;
}

.focus-tabs--pills.focus-tabs--secondary .focus-tab--active {
  background-color: var(--color-secondary);
  color: white;
}

.focus-tabs--pills.focus-tabs--accent .focus-tab--active {
  background-color: var(--color-accent);
  color: white;
}

.focus-tabs--pills.focus-tabs--success .focus-tab--active {
  background-color: var(--color-success);
  color: white;
}

.focus-tabs--pills.focus-tabs--info .focus-tab--active {
  background-color: var(--color-info);
  color: white;
}

.focus-tabs--pills.focus-tabs--warning .focus-tab--active {
  background-color: var(--color-warning);
  color: white;
}

.focus-tabs--pills.focus-tabs--error .focus-tab--active {
  background-color: var(--color-error);
  color: white;
}

.focus-tabs-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  transition: all var(--transition-normal);
}

.focus-tabs--pills .focus-tabs-indicator,
.focus-tabs--bordered .focus-tabs-indicator {
  display: none;
}

.focus-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.focus-tabs-content {
  padding: 1rem 0;
}
</style>