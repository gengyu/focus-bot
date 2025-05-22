<template>
  <div
    class="focus-spinner"
    :class="spinnerClasses"
    :style="spinnerStyle"
    role="status"
    aria-label="加载中"
  >
    <svg
      class="focus-spinner-svg"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="focus-spinner-track"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke-width="2"
      />
      <circle
        class="focus-spinner-circle"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="56.549"
        stroke-dashoffset="16.965"
      />
    </svg>
    <span v-if="label" class="focus-spinner-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  color: {
    type: String,
    default: 'accent',
    validator: (value: string) => ['accent', 'primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  customSize: {
    type: [String, Number],
    default: ''
  }
});

const spinnerClasses = computed(() => {
  return {
    [`focus-spinner--${props.size}`]: !props.customSize,
    [`focus-spinner--${props.color}`]: true,
    'focus-spinner--with-label': !!props.label
  };
});

const spinnerStyle = computed(() => {
  if (!props.customSize) return {};
  
  const size = typeof props.customSize === 'number' ? `${props.customSize}px` : props.customSize;
  
  return {
    width: size,
    height: size
  };
});
</script>

<style scoped>
.focus-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.focus-spinner--xs {
  width: 1rem;
  height: 1rem;
}

.focus-spinner--sm {
  width: 1.5rem;
  height: 1.5rem;
}

.focus-spinner--md {
  width: 2rem;
  height: 2rem;
}

.focus-spinner--lg {
  width: 2.5rem;
  height: 2.5rem;
}

.focus-spinner--xl {
  width: 3rem;
  height: 3rem;
}

.focus-spinner-svg {
  width: 100%;
  height: 100%;
  animation: focus-spinner-rotate 1.5s linear infinite;
}

.focus-spinner-track {
  stroke: currentColor;
  opacity: 0.2;
}

.focus-spinner-circle {
  stroke: currentColor;
  animation: focus-spinner-dash 1.5s ease-in-out infinite;
}

.focus-spinner--accent {
  color: var(--color-accent);
}

.focus-spinner--primary {
  color: var(--color-primary);
}

.focus-spinner--secondary {
  color: var(--color-secondary);
}

.focus-spinner--success {
  color: var(--color-success);
}

.focus-spinner--warning {
  color: var(--color-warning);
}

.focus-spinner--error {
  color: var(--color-error);
}

.focus-spinner--info {
  color: var(--color-info);
}

.focus-spinner-label {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

@keyframes focus-spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes focus-spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-spinner--primary {
    color: var(--color-text-light);
  }
  
  .focus-spinner-label {
    color: var(--color-text-light);
  }
}
</style>