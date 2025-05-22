<template>
  <button
    :class="[
      'focus-button',
      `focus-button--${variant}`,
      `focus-button--${size}`,
      `focus-button--${rounded ? 'rounded' : 'default-radius'}`,
      { 'focus-button--disabled': disabled },
      { 'focus-button--full-width': fullWidth },
      { 'focus-button--with-icon': $slots.icon },
      { 'focus-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="focus-button__loader">
      <svg class="focus-button__spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle class="focus-button__spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2"></circle>
        <circle class="focus-button__spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="2" stroke-linecap="round"></circle>
      </svg>
    </span>
    <span v-else-if="$slots.icon" class="focus-button__icon">
      <slot name="icon"></slot>
    </span>
    <span class="focus-button__content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => [
      'primary',
      'secondary',
      'accent',
      'success',
      'warning',
      'error',
      'info',
      'outline',
      'ghost',
      'link'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value: string) => ['button', 'submit', 'reset'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);
</script>

<style scoped>
.focus-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  outline: none;
  position: relative;
}

.focus-button--default-radius {
  border-radius: 0.375rem;
}

.focus-button--rounded {
  border-radius: 9999px;
}

.focus-button--primary {
  background-color: var(--color-accent);
  color: white;
  border: 1px solid transparent;
}

.focus-button--primary:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  background-color: var(--color-hover);
}

.focus-button--primary:active:not(.focus-button--disabled):not(.focus-button--loading) {
  background-color: var(--color-active);
}

.focus-button--secondary {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  border: 1px solid transparent;
}

.focus-button--secondary:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  opacity: 0.9;
}

.focus-button--accent {
  background-color: var(--color-accent);
  color: white;
  border: 1px solid transparent;
}

.focus-button--accent:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  background-color: var(--color-hover);
}

.focus-button--success {
  background-color: var(--color-success);
  color: white;
  border: 1px solid transparent;
}

.focus-button--success:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  opacity: 0.9;
}

.focus-button--warning {
  background-color: var(--color-warning);
  color: var(--color-primary);
  border: 1px solid transparent;
}

.focus-button--warning:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  opacity: 0.9;
}

.focus-button--error {
  background-color: var(--color-error);
  color: white;
  border: 1px solid transparent;
}

.focus-button--error:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  opacity: 0.9;
}

.focus-button--info {
  background-color: var(--color-info);
  color: white;
  border: 1px solid transparent;
}

.focus-button--info:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  opacity: 0.9;
}

.focus-button--outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.focus-button--outline:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  background-color: var(--color-secondary);
  color: var(--color-primary);
}

.focus-button--ghost {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid transparent;
}

.focus-button--ghost:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  background-color: var(--color-secondary);
}

.focus-button--link {
  background-color: transparent;
  color: var(--color-accent);
  border: none;
  padding: 0;
  text-decoration: underline;
}

.focus-button--link:hover:not(.focus-button--disabled):not(.focus-button--loading) {
  color: var(--color-hover);
}

.focus-button--xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.focus-button--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.focus-button--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.focus-button--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.focus-button--xl {
  padding: 1rem 1.75rem;
  font-size: 1.25rem;
}

.focus-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.focus-button--loading {
  cursor: wait;
}

.focus-button--full-width {
  width: 100%;
}

.focus-button--with-icon {
  display: inline-flex;
  align-items: center;
}

.focus-button__icon {
  display: inline-flex;
  margin-right: 0.5rem;
}

.focus-button__loader {
  display: inline-flex;
  margin-right: 0.5rem;
  animation: focus-button-spin 1s linear infinite;
}

.focus-button__spinner {
  width: 1em;
  height: 1em;
}

.focus-button__spinner-track {
  stroke: currentColor;
  opacity: 0.2;
}

.focus-button__spinner-circle {
  stroke: currentColor;
  stroke-dasharray: 80;
  stroke-dashoffset: 60;
}

@keyframes focus-button-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-button--primary {
    background-color: var(--color-accent);
  }
  
  .focus-button--secondary {
    background-color: var(--color-secondary);
    color: var(--color-primary);
  }
  
  .focus-button--outline {
    color: var(--color-text-light);
    border-color: var(--color-border);
  }
  
  .focus-button--outline:hover:not(.focus-button--disabled):not(.focus-button--loading) {
    background-color: var(--color-secondary);
    color: var(--color-primary);
  }
  
  .focus-button--ghost {
    color: var(--color-text-light);
  }
  
  .focus-button--ghost:hover:not(.focus-button--disabled):not(.focus-button--loading) {
    background-color: var(--color-secondary);
    color: var(--color-primary);
  }
  
  .focus-button--link {
    color: var(--color-accent);
  }
  
  .focus-button--link:hover:not(.focus-button--disabled):not(.focus-button--loading) {
    color: var(--color-hover);
  }
}
</style>