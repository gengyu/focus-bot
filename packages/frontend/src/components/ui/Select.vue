<template>
  <div class="focus-select-wrapper" :class="{ 'focus-select-wrapper--full-width': fullWidth }">
    <label v-if="label" class="focus-select-label" :for="id">{{ label }}</label>
    <div class="focus-select-container" :class="selectContainerClasses">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        class="focus-select"
        :class="selectClasses"
        @change="onChange"
        @focus="focused = true"
        @blur="focused = false"
      >
        <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <slot></slot>
      </select>
      <div class="focus-select-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
    <div v-if="error" class="focus-select-error">{{ error }}</div>
    <div v-else-if="hint" class="focus-select-hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => ['default', 'filled', 'outline'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const focused = ref(false);

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
  emit('change', target.value);
};

const selectContainerClasses = computed(() => {
  return {
    'focus-select-container--focused': focused.value,
    'focus-select-container--error': !!props.error,
    'focus-select-container--disabled': props.disabled,
    [`focus-select-container--${props.variant}`]: true,
  };
});

const selectClasses = computed(() => {
  return {
    [`focus-select--${props.size}`]: true,
  };
});
</script>

<style scoped>
.focus-select-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-select-wrapper--full-width {
  width: 100%;
}

.focus-select-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.focus-select-container {
  display: flex;
  align-items: center;
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background-color: var(--color-neutral);
  transition: all 0.2s ease-in-out;
}

.focus-select-container--default {
  background-color: var(--color-neutral);
}

.focus-select-container--filled {
  background-color: var(--color-secondary);
}

.focus-select-container--outline {
  background-color: transparent;
}

.focus-select-container--focused {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(104, 211, 145, 0.2);
}

.focus-select-container--error {
  border-color: var(--color-error);
}

.focus-select-container--disabled {
  background-color: var(--color-disabled-background);
  cursor: not-allowed;
}

.focus-select {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-primary);
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 2rem; /* 为图标留出空间 */
}

.focus-select:disabled {
  cursor: not-allowed;
  color: var(--color-disabled-text);
}

.focus-select--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.focus-select--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.focus-select--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.focus-select-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-light);
}

.focus-select-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.focus-select-hint {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-select-label {
    color: var(--color-text-light);
  }
  
  .focus-select {
    color: var(--color-text-light);
  }
  
  .focus-select-container--focused {
    box-shadow: 0 0 0 2px rgba(154, 230, 180, 0.2);
  }
}
</style>