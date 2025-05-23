<template>
  <div class="focus-checkbox-wrapper" :class="{ 'focus-checkbox-wrapper--disabled': disabled }">
    <div class="focus-checkbox-container">
      <input
        :id="id"
        type="checkbox"
        class="focus-checkbox-input"
        :checked="modelValue"
        :disabled="disabled"
        :name="name"
        :required="required"
        :value="value"
        @change="onChange"
      />
      <div class="focus-checkbox-box" :class="checkboxClasses">
        <svg
          v-if="modelValue"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="focus-checkbox-check"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <label v-if="label" :for="id" class="focus-checkbox-label">{{ label }}</label>
    </div>
    <div v-if="description" class="focus-checkbox-description">{{ description }}</div>
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
    default: () => `checkbox-${Math.random().toString(36).substring(2, 9)}`
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
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  color: {
    type: String,
    default: 'accent',
    validator: (value: string) => ['accent', 'primary', 'secondary', 'success', 'info', 'warning', 'error'].includes(value)
  },
  name: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  value: {
    type: String,
    default: 'on'
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
  emit('change', target.checked);
};

const checkboxClasses = computed(() => {
  return {
    'focus-checkbox-box--checked': props.modelValue,
    'focus-checkbox-box--disabled': props.disabled,
    [`focus-checkbox-box--${props.size}`]: true,
    [`focus-checkbox-box--${props.color}`]: props.modelValue,
    [`focus-checkbox-box--radius-${props.borderRadius}`]: true
  };
});
</script>

<style scoped>
.focus-checkbox-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-checkbox-wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.focus-checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.focus-checkbox-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus-checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  background-color: var(--color-neutral);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.focus-checkbox-box--radius-none {
  border-radius: 0;
}

.focus-checkbox-box--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-checkbox-box--radius-md {
  border-radius: var(--radius-md);
}

.focus-checkbox-box--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-checkbox-box--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-checkbox-box--radius-full {
  border-radius: var(--radius-full);
}

.focus-checkbox-box--xs {
  width: 0.875rem;
  height: 0.875rem;
}

.focus-checkbox-box--sm {
  width: 1rem;
  height: 1rem;
}

.focus-checkbox-box--md {
  width: 1.25rem;
  height: 1.25rem;
}

.focus-checkbox-box--lg {
  width: 1.5rem;
  height: 1.5rem;
}

.focus-checkbox-box--xl {
  width: 1.75rem;
  height: 1.75rem;
}

.focus-checkbox-box--checked {
  border-color: var(--color-accent);
  background-color: var(--color-accent);
}

.focus-checkbox-box--checked.focus-checkbox-box--primary {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

.focus-checkbox-box--checked.focus-checkbox-box--secondary {
  border-color: var(--color-secondary);
  background-color: var(--color-secondary);
}

.focus-checkbox-box--checked.focus-checkbox-box--success {
  border-color: var(--color-success);
  background-color: var(--color-success);
}

.focus-checkbox-box--checked.focus-checkbox-box--info {
  border-color: var(--color-info);
  background-color: var(--color-info);
}

.focus-checkbox-box--checked.focus-checkbox-box--warning {
  border-color: var(--color-warning);
  background-color: var(--color-warning);
}

.focus-checkbox-box--checked.focus-checkbox-box--error {
  border-color: var(--color-error);
  background-color: var(--color-error);
}

.focus-checkbox-box--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.focus-checkbox-check {
  width: 0.75rem;
  height: 0.75rem;
  color: white;
}

.focus-checkbox-box--xs .focus-checkbox-check {
  width: 0.5rem;
  height: 0.5rem;
}

.focus-checkbox-box--sm .focus-checkbox-check {
  width: 0.625rem;
  height: 0.625rem;
}

.focus-checkbox-box--lg .focus-checkbox-check {
  width: 0.875rem;
  height: 0.875rem;
}

.focus-checkbox-box--xl .focus-checkbox-check {
  width: 1rem;
  height: 1rem;
}

.focus-checkbox-label {
  font-size: 0.875rem;
  color: var(--color-primary);
  cursor: pointer;
}

.focus-checkbox-description {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-left: 1.75rem;
}
</style>