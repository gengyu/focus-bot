<template>
  <div class="focus-switch-wrapper" :class="{ 'focus-switch-wrapper--disabled': disabled }">
    <label v-if="label" class="focus-switch-label" :for="id">{{ label }}</label>
    <div class="focus-switch-container">
      <button
        :id="id"
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :disabled="disabled"
        class="focus-switch"
        :class="switchClasses"
        @click="toggle"
      >
        <span class="focus-switch-thumb"></span>
      </button>
      <span v-if="description" class="focus-switch-description">{{ description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: () => `switch-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  disabled: {
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
    validator: (value: string) => ['accent', 'success', 'info', 'warning', 'error'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const toggle = () => {
  if (props.disabled) return;
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};

const switchClasses = computed(() => {
  return {
    'focus-switch--checked': props.modelValue,
    'focus-switch--disabled': props.disabled,
    [`focus-switch--${props.size}`]: true,
    [`focus-switch--${props.color}`]: true
  };
});
</script>

<style scoped>
.focus-switch-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
}

.focus-switch-wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.focus-switch-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
}

.focus-switch-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.focus-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: 999px;
  background-color: var(--color-secondary);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  padding: 0;
}

.focus-switch--sm {
  width: 2rem;
  height: 1rem;
}

.focus-switch--md {
  width: 2.5rem;
  height: 1.25rem;
}

.focus-switch--lg {
  width: 3rem;
  height: 1.5rem;
}

.focus-switch-thumb {
  position: absolute;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.focus-switch--sm .focus-switch-thumb {
  width: 0.75rem;
  height: 0.75rem;
  left: 0.125rem;
  transform: translateX(0);
}

.focus-switch--md .focus-switch-thumb {
  width: 1rem;
  height: 1rem;
  left: 0.125rem;
  transform: translateX(0);
}

.focus-switch--lg .focus-switch-thumb {
  width: 1.25rem;
  height: 1.25rem;
  left: 0.125rem;
  transform: translateX(0);
}

.focus-switch--checked.focus-switch--sm .focus-switch-thumb {
  transform: translateX(1rem);
}

.focus-switch--checked.focus-switch--md .focus-switch-thumb {
  transform: translateX(1.25rem);
}

.focus-switch--checked.focus-switch--lg .focus-switch-thumb {
  transform: translateX(1.5rem);
}

.focus-switch--checked {
  background-color: var(--color-accent);
}

.focus-switch--checked.focus-switch--success {
  background-color: var(--color-success);
}

.focus-switch--checked.focus-switch--info {
  background-color: var(--color-info);
}

.focus-switch--checked.focus-switch--warning {
  background-color: var(--color-warning);
}

.focus-switch--checked.focus-switch--error {
  background-color: var(--color-error);
}

.focus-switch--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.focus-switch-description {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-switch-label {
    color: var(--color-text-light);
  }
  
  .focus-switch-thumb {
    background-color: var(--color-neutral);
  }
}
</style>