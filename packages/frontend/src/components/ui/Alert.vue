<template>
  <div class="focus-alert" :class="alertClasses" role="alert">
    <div v-if="$slots.icon || variant !== 'default'" class="focus-alert-icon">
      <slot name="icon">
        <svg v-if="variant === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <svg v-else-if="variant === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <svg v-else-if="variant === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <svg v-else-if="variant === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </slot>
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
    validator: (value: string) => ['default', 'info', 'success', 'warning', 'error'].includes(value)
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
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  shadow: {
    type: String,
    default: 'none',
    validator: (value: string) => ['none', 'sm', 'md', 'lg'].includes(value)
  }
});

defineEmits(['dismiss']);

const alertClasses = computed(() => {
  return {
    [`focus-alert--${props.variant}`]: true,
    'focus-alert--outlined': props.outlined,
    [`focus-alert--radius-${props.borderRadius}`]: true,
    [`focus-alert--shadow-${props.shadow}`]: props.shadow !== 'none'
  };
});
</script>

<style scoped>
.focus-alert {
  display: flex;
  padding: 1rem;
  position: relative;
  transition: all var(--transition-normal);
}

.focus-alert--radius-none {
  border-radius: 0;
}

.focus-alert--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-alert--radius-md {
  border-radius: var(--radius-md);
}

.focus-alert--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-alert--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-alert--radius-full {
  border-radius: var(--radius-full);
}

.focus-alert--shadow-sm {
  box-shadow: var(--shadow-sm);
}

.focus-alert--shadow-md {
  box-shadow: var(--shadow-md);
}

.focus-alert--shadow-lg {
  box-shadow: var(--shadow-lg);
}

.focus-alert--default {
  background-color: var(--color-secondary);
  color: var(--color-primary);
}

.focus-alert--info {
  background-color: rgba(var(--color-info-rgb, 99, 179, 237), 0.1);
  color: var(--color-info);
}

.focus-alert--success {
  background-color: rgba(var(--color-success-rgb, 72, 187, 120), 0.1);
  color: var(--color-success);
}

.focus-alert--warning {
  background-color: rgba(var(--color-warning-rgb, 236, 201, 75), 0.1);
  color: var(--color-warning);
}

.focus-alert--error {
  background-color: rgba(var(--color-error-rgb, 252, 129, 129), 0.1);
  color: var(--color-error);
}

.focus-alert--outlined {
  background-color: transparent;
  border: 1px solid currentColor;
}

.focus-alert--default.focus-alert--outlined {
  border-color: var(--color-border);
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
  transition: opacity var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.75rem;
}

.focus-alert-close:hover {
  opacity: 1;
}
</style>