<template>
  <div class="focus-input-wrapper" :class="{ 'focus-input-wrapper--full-width': fullWidth }">
    <label v-if="label" class="focus-input-label" :for="id">{{ label }}</label>
    <div class="focus-input-container" :class="inputContainerClasses">
      <div v-if="$slots.prefix" class="focus-input-prefix">
        <slot name="prefix"></slot>
      </div>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :pattern="pattern"
        class="focus-input"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false"
        @change="$emit('change', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="$slots.suffix || clearable && modelValue" class="focus-input-suffix">
        <button
          v-if="clearable && modelValue"
          type="button"
          class="focus-input-clear"
          @click="$emit('update:modelValue', '')"
          aria-label="清除输入"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <slot name="suffix"></slot>
      </div>
    </div>
    <div v-if="error" class="focus-input-error">{{ error }}</div>
    <div v-else-if="hint" class="focus-input-hint">{{ hint }}</div>
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
    default: () => `input-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
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
  clearable: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: ''
  },
  min: {
    type: [String, Number],
    default: ''
  },
  max: {
    type: [String, Number],
    default: ''
  },
  step: {
    type: [String, Number],
    default: ''
  },
  pattern: {
    type: String,
    default: ''
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
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  }
});

defineEmits(['update:modelValue', 'change']);

const focused = ref(false);

const inputContainerClasses = computed(() => {
  return {
    'focus-input-container--focused': focused.value,
    'focus-input-container--error': !!props.error,
    'focus-input-container--disabled': props.disabled,
    'focus-input-container--readonly': props.readonly,
    [`focus-input-container--${props.variant}`]: true,
    [`focus-input-container--radius-${props.borderRadius}`]: true,
  };
});

const inputClasses = computed(() => {
  return {
    [`focus-input--${props.size}`]: true,
  };
});
</script>

<style scoped>
.focus-input-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-input-wrapper--full-width {
  width: 100%;
}

.focus-input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.focus-input-container {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-neutral);
  transition: all var(--transition-normal);
}

.focus-input-container--radius-none {
  border-radius: 0;
}

.focus-input-container--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-input-container--radius-md {
  border-radius: var(--radius-md);
}

.focus-input-container--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-input-container--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-input-container--radius-full {
  border-radius: var(--radius-full);
}

.focus-input-container--default {
  background-color: var(--color-neutral);
}

.focus-input-container--filled {
  background-color: var(--color-secondary);
}

.focus-input-container--outline {
  background-color: transparent;
}

.focus-input-container--focused {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb, 104, 211, 145), 0.2);
}

.focus-input-container--error {
  border-color: var(--color-error);
}

.focus-input-container--disabled {
  background-color: var(--color-disabled-background);
  cursor: not-allowed;
}

.focus-input-container--readonly {
  background-color: var(--color-secondary);
}

.focus-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-primary);
  width: 100%;
}

.focus-input::placeholder {
  color: var(--color-text-light);
}

.focus-input:disabled {
  cursor: not-allowed;
  color: var(--color-disabled-text);
}

.focus-input--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.focus-input--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.focus-input--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.focus-input-prefix,
.focus-input-suffix {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  color: var(--color-text-light);
}

.focus-input-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--color-text-light);
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.focus-input-clear:hover {
  opacity: 1;
}

.focus-input-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.focus-input-hint {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}
</style>