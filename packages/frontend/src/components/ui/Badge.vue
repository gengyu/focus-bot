<template>
  <span class="focus-badge" :class="badgeClasses">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => [
      'default',
      'primary',
      'secondary',
      'accent',
      'success',
      'warning',
      'error',
      'info',
      'outline'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: false
  }
});

const badgeClasses = computed(() => {
  return {
    [`focus-badge--${props.variant}`]: true,
    [`focus-badge--${props.size}`]: true,
    'focus-badge--rounded': props.rounded
  };
});
</script>

<style scoped>
.focus-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.focus-badge--rounded {
  border-radius: 9999px;
}

.focus-badge--sm {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

.focus-badge--md {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.focus-badge--lg {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
}

.focus-badge--default {
  background-color: var(--color-secondary);
  color: var(--color-primary);
}

.focus-badge--primary {
  background-color: var(--color-primary);
  color: var(--color-neutral);
}

.focus-badge--secondary {
  background-color: var(--color-secondary);
  color: var(--color-primary);
}

.focus-badge--accent {
  background-color: var(--color-accent);
  color: white;
}

.focus-badge--success {
  background-color: var(--color-success);
  color: white;
}

.focus-badge--warning {
  background-color: var(--color-warning);
  color: var(--color-primary);
}

.focus-badge--error {
  background-color: var(--color-error);
  color: white;
}

.focus-badge--info {
  background-color: var(--color-info);
  color: white;
}

.focus-badge--outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-badge--default {
    color: var(--color-text-light);
  }
  
  .focus-badge--primary {
    color: var(--color-neutral);
  }
  
  .focus-badge--secondary {
    color: var(--color-text-light);
  }
  
  .focus-badge--warning {
    color: var(--color-neutral);
  }
  
  .focus-badge--outline {
    color: var(--color-text-light);
  }
}
</style>