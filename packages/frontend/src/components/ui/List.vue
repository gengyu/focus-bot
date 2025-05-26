<template>
  <div
    class="focus-list"
    :class="listClasses"
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      class="focus-list-item"
      :class="itemClasses"
      @click="handleItemClick(item, index)"
    >
      <slot
        name="item"
        :item="item"
        :index="index"
      >
        {{ item }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

   /**
    * 接口 Props 用于定义组件的属性
    * @interface Props
    * @property {any[]} items - 列表项数组
    * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [size] - 组件大小，默认为未定义
    * @property {'default' | 'bordered' | 'elevated'} [variant] - 样式变体，默认为未定义
    * @property {boolean} [divided] - 是否显示分割线，默认为未定义
    * @property {boolean} [hoverable] - 是否支持悬停效果，默认为未定义
    * @property {boolean} [interactive] - 是否支持交互，默认为未定义
    * @property {'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'} [radius] - 圆角半径，默认为未定义
    */
   interface Props {
     items: any[]; // 定义列表项数组
     size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // 定义组件大小
     variant?: 'default' | 'bordered' | 'elevated'; // 定义组件样式变体
     divided?: boolean; // 是否显示分割线
     hoverable?: boolean; // 是否支持悬停效果
     interactive?: boolean; // 是否支持交互
     radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'; // 定义圆角半径
   }


const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  divided: false,
  hoverable: false,
  interactive: false,
  radius: 'md'
});

const emit = defineEmits<{
  (e: 'item-click', item: any, index: number): void;
}>();

const listClasses = computed(() => {
  return {
    [`focus-list--${props.size}`]: true,
    [`focus-list--${props.variant}`]: true,
    [`focus-list--radius-${props.radius}`]: true,
    'focus-list--divided': props.divided,
    'focus-list--hoverable': props.hoverable,
    'focus-list--interactive': props.interactive
  };
});

const itemClasses = computed(() => {
  return {
    'focus-list-item--hoverable': props.hoverable,
    'focus-list-item--interactive': props.interactive
  };
});

const handleItemClick = (item: any, index: number) => {
  if (props.interactive) {
    emit('item-click', item, index);
  }
};
</script>

<style scoped>
.focus-list {
  background-color: var(--color-neutral);
  transition: all var(--transition-normal);
}

.focus-list--radius-none {
  border-radius: 0;
}

.focus-list--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-list--radius-md {
  border-radius: var(--radius-md);
}

.focus-list--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-list--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-list--radius-full {
  border-radius: var(--radius-full);
}

.focus-list--bordered {
  border: 1px solid var(--color-border);
  background-color: transparent;
}

.focus-list--elevated {
  border: none;
  box-shadow: var(--shadow-md);
}

.focus-list--divided .focus-list-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.focus-list-item {
  padding: 1rem;
  color: var(--color-primary);
  transition: all var(--transition-fast);
}

.focus-list--xs .focus-list-item {
  padding: 0.5rem;
  font-size: 0.75rem;
}

.focus-list--sm .focus-list-item {
  padding: 0.75rem;
  font-size: 0.875rem;
}

.focus-list--md .focus-list-item {
  padding: 1rem;
  font-size: 1rem;
}

.focus-list--lg .focus-list-item {
  padding: 1.25rem;
  font-size: 1.125rem;
}

.focus-list--xl .focus-list-item {
  padding: 1.5rem;
  font-size: 1.25rem;
}

.focus-list-item--hoverable:hover {
  background-color: var(--color-secondary);
}

.focus-list-item--interactive {
  cursor: pointer;
}
</style>