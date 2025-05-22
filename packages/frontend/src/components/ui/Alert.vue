<template>
  <div class="focus-alert" :class="alertClasses" role="alert">
    <div v-if="$slots.icon" class="focus-alert-icon">
      <slot name="icon"></slot>
    </div>
    <div class="focus-alert-content">
      <div v-if="title" class="focus-alert-title">{{ title }}</div>
      <div class="focus-alert-description">
        <slot></slot>
      </div>
    </div>
    <button 
      v-if="dismissible" 
      class="focus-alert-close" 
      @click="$emit('dismiss')"
      aria-label="关闭"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value: string) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  }
});

defineEmits(['dismiss']);

const alertClasses = computed(() => {
  return {
    [`focus-alert--${props.variant}`]: true,
    'focus-alert--outlined': props.outlined
  };
});
</script>

<style scoped>
.focus-alert {
  display: flex;
  padding: 1rem;
  border-radius: 0.375rem;
  position: relative;
}

.focus-alert--info {
  background-color: rgba(99, 179, 237, 0.1);
  color: var(--color-info);
}

.focus-alert--success {
  background-color: rgba(72, 187, 120, 0.1);
  color: var(--color-success);
}

.focus-alert--warning {
  background-color: rgba(236, 201, 75, 0.1);
  color: var(--color-warning);
}

.focus-alert--error {
  background-color: rgba(252, 129, 129, 0.1);
  color: var(--color-error);
}

.focus-alert--outlined {
  background-color: transparent;
  border: 1px solid currentColor;
}

.focus-alert--info.focus-alert--outlined {
  border-color: var(--color-info);
}

.focus-alert--success.focus-alert--outlined {
  border-color: var(--color-success);
}

.focus-alert--warning.focus-alert--outlined {
  border-color: var(--color-warning);
}

.focus-alert--error.focus-alert--outlined {
  border-color: var(--color-error);
}

.focus-alert-icon {
  display: flex;
  align-items: flex-start;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.focus-alert-content {
  flex: 1;
}

.focus-alert-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.focus-alert-description {
  font-size: 0.875rem;
  line-height: 1.5;
}

.focus-alert-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  color: currentColor;
  opacity: 0.7;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.75rem;
}

.focus-alert-close:hover {
  opacity: 1;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-alert--info {
    background-color: rgba(159, 213, 248, 0.1);
  }
  
  .focus-alert--success {
    background-color: rgba(104, 211, 145, 0.1);
  }
  
  .focus-alert--warning {
    background-color: rgba(246, 224, 94, 0.1);
  }
  
  .focus-alert--error {
    background-color: rgba(254, 178, 178, 0.1);
  }
}
</style>