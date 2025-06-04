<template>
  <div class="focus-textarea-wrapper" :class="{ 'focus-textarea-wrapper--full-width': fullWidth }">
    <label v-if="label" class="focus-textarea-label" :for="id">{{ label }}</label>
    <div class="focus-textarea-container" :class="textareaContainerClasses">
      <textarea
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :maxlength="maxlength"
        class="focus-textarea"
        :class="textareaClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @focus="focused = true"
        @blur="focused = false"
        @change="$emit('change', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <div v-if="maxlength" class="focus-textarea-counter">
        {{ modelValue.length }}/{{ maxlength }}
      </div>
    </div>
    <div v-if="error" class="focus-textarea-error">{{ error }}</div>
    <div v-else-if="hint" class="focus-textarea-hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: () => `textarea-${Math.random().toString(36).substring(2, 9)}`
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
    default: true
  },
  rows: {
    type: Number,
    default: 3
  },
  maxlength: {
    type: Number,
    default: undefined
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

const textareaContainerClasses = computed(() => {
  return {
    'focus-textarea-container--focused': focused.value,
    'focus-textarea-container--error': !!props.error,
    'focus-textarea-container--disabled': props.disabled,
    'focus-textarea-container--readonly': props.readonly,
    [`focus-textarea-container--${props.variant}`]: true,
    [`focus-textarea-container--radius-${props.borderRadius}`]: true,
  };
});

const textareaClasses = computed(() => {
  return {
    [`focus-textarea--${props.size}`]: true,
  };
});
</script>

<style scoped>
.focus-textarea-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-textarea-wrapper--full-width {
  width: 100%;
}

.focus-textarea-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.focus-textarea-container {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  background-color: var(--color-neutral);
  transition: all var(--transition-normal);
}

.focus-textarea-container--radius-none {
  border-radius: 0;
}

.focus-textarea-container--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-textarea-container--radius-md {
  border-radius: var(--radius-md);
}

.focus-textarea-container--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-textarea-container--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-textarea-container--radius-full {
  border-radius: var(--radius-full);
}

.focus-textarea-container--default {
  background-color: var(--color-neutral);
}

.focus-textarea-container--filled {
  background-color: var(--color-secondary);
}

.focus-textarea-container--outline {
  background-color: transparent;
}

.focus-textarea-container--focused {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb, 104, 211, 145), 0.2);
}

.focus-textarea-container--error {
  border-color: var(--color-error);
}

.focus-textarea-container--disabled {
  background-color: var(--color-disabled-background);
  cursor: not-allowed;
}

.focus-textarea-container--readonly {
  background-color: var(--color-secondary);
}

.focus-textarea {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-primary);
  width: 100%;
  resize: vertical;
  min-height: 80px;
  padding: 0.5rem;
  font-family: inherit;
  line-height: 1.5;
}

.focus-textarea::placeholder {
  color: var(--color-text-light);
}

.focus-textarea--sm {
  font-size: 0.875rem;
  padding: 0.375rem;
}

.focus-textarea--md {
  font-size: 1rem;
  padding: 0.5rem;
}

.focus-textarea--lg {
  font-size: 1.125rem;
  padding: 0.625rem;
}

.focus-textarea-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.focus-textarea-hint {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

.focus-textarea-counter {
  font-size: 0.75rem;
  color: var(--color-text-light);
  text-align: right;
  padding: 0.25rem 0.5rem;
  border-top: 1px solid var(--color-border);
}
</style> 