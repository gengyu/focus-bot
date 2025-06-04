<template>
  <div class="focus-field" :class="{ 'focus-field--full-width': fullWidth }">
    <label v-if="label" class="focus-field-label" :for="id">{{ label }}</label>
    <div class="focus-field-content">
      <slot></slot>
    </div>
    <div v-if="error" class="focus-field-error">{{ error }}</div>
    <div v-else-if="hint" class="focus-field-hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  id: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
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
  }
});
</script>

<style scoped>
.focus-field {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-field--full-width {
  width: 100%;
}

.focus-field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.focus-field-content {
  display: flex;
  flex-direction: column;
}

.focus-field-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.focus-field-hint {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}
</style> 