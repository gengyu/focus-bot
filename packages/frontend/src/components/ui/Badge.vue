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
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  dot: {
    type: Boolean,
    default: false
  },
  removable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['remove']);

const badgeClasses = computed(() => {
  return {
    [`focus-badge--${props.variant}`]: true,
    [`focus-badge--${props.size}`]: true,
    [`focus-badge--radius-${props.borderRadius}`]: true,
    'focus-badge--dot': props.dot,
    'focus-badge--removable': props.removable
  };
});

const handleRemove = (event: Event) => {
  event.stopPropagation();
  emit('remove');
};
</script>

<style scoped>
.focus-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all var(--transition-fast);
  position: relative;
}

.focus-badge--radius-none {
  border-radius: 0;
}

.focus-badge--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-badge--radius-md {
  border-radius: var(--radius-md);
}

.focus-badge--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-badge--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-badge--radius-full {
  border-radius: var(--radius-full);
}

.focus-badge--xs {
  padding: 0.0625rem 0.25rem;
  font-size: 0.625rem;
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

.focus-badge--xl {
  padding: 0.5rem 1rem;
  font-size: 1.125rem;
}

.focus-badge--dot::before {
  content: '';
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  margin-right: 0.375rem;
  background-color: currentColor;
}

.focus-badge--removable {
  padding-right: 1.5rem;
}

.focus-badge--removable::after {
  content: '×';
  position: absolute;
  right: 0.375rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1em;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.focus-badge--removable::after:hover {
  opacity: 1;
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
</style>