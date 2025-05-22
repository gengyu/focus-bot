<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="focus-modal-backdrop" @click="closeOnBackdrop && close()">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div 
            v-if="modelValue" 
            class="focus-modal" 
            :class="modalClasses"
            @click.stop
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
          >
            <div v-if="$slots.header || title || closable" class="focus-modal-header">
              <slot name="header">
                <h3 v-if="title" :id="titleId" class="focus-modal-title">{{ title }}</h3>
              </slot>
              <button 
                v-if="closable" 
                class="focus-modal-close" 
                @click="close"
                aria-label="关闭"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="focus-modal-body">
              <slot></slot>
            </div>
            <div v-if="$slots.footer" class="focus-modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`;

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) {
    close();
  }
};

const modalClasses = computed(() => {
  return {
    [`focus-modal--${props.size}`]: true
  };
});

watch(() => props.modelValue, (value) => {
  if (value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEsc);
  if (props.modelValue) {
    document.body.style.overflow = 'hidden';
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.focus-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.focus-modal {
  background-color: var(--color-neutral);
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  position: relative;
  width: 100%;
}

.focus-modal--sm {
  max-width: 24rem;
}

.focus-modal--md {
  max-width: 32rem;
}

.focus-modal--lg {
  max-width: 48rem;
}

.focus-modal--xl {
  max-width: 64rem;
}

.focus-modal--full {
  max-width: calc(100vw - 2rem);
  height: calc(100vh - 2rem);
}

.focus-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.focus-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

.focus-modal-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-light);
  transition: color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-modal-close:hover {
  color: var(--color-primary);
}

.focus-modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.focus-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-modal {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  }
  
  .focus-modal-title {
    color: var(--color-text-light);
  }
}
</style>