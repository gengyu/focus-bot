<template>
  <div class="focus-card" :class="cardClasses">
    <div v-if="$slots.header" class="focus-card-header">
      <slot name="header"></slot>
    </div>
    <div class="focus-card-body" :class="{ 'focus-card-body--no-padding': noPadding }">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="focus-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => ['default', 'outline', 'elevated'].includes(value)
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  fullWidth: {
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
    default: '',
    validator: (value: string) => ['', 'sm', 'md', 'lg', 'xl'].includes(value)
  }
});

const cardClasses = computed(() => {
  return {
    [`focus-card--${props.variant}`]: true,
    'focus-card--hoverable': props.hoverable,
    'focus-card--full-width': props.fullWidth,
    [`focus-card--radius-${props.borderRadius}`]: true,
    [`focus-card--shadow-${props.shadow}`]: props.shadow
  };
});
</script>

<style scoped>
.focus-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.focus-card--radius-none {
  border-radius: 0;
}

.focus-card--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-card--radius-md {
  border-radius: var(--radius-md);
}

.focus-card--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-card--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-card--radius-full {
  border-radius: var(--radius-full);
}

.focus-card--default {
  border: 1px solid var(--color-border);
}

.focus-card--outline {
  border: 1px solid var(--color-border);
  background-color: transparent;
}

.focus-card--elevated {
  border: none;
  box-shadow: var(--shadow-md);
}

.focus-card--shadow-sm {
  box-shadow: var(--shadow-sm);
}

.focus-card--shadow-md {
  box-shadow: var(--shadow-md);
}

.focus-card--shadow-lg {
  box-shadow: var(--shadow-lg);
}

.focus-card--shadow-xl {
  box-shadow: var(--shadow-xl);
}

.focus-card--hoverable {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.focus-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.focus-card--full-width {
  width: 100%;
}

.focus-card-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
}

.focus-card-body {
  padding: 1rem;
  flex: 1;
}

.focus-card-body--no-padding {
  padding: 0;
}

.focus-card-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>