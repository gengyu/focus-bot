<template>
  <div
    class="focus-avatar"
    :class="avatarClasses"
    :style="avatarStyle"
  >
    <img
      v-if="src && !error"
      :src="src"
      :alt="alt"
      class="focus-avatar-image"
      @error="handleError"
    />
    <span v-else-if="initials" class="focus-avatar-initials">{{ initials }}</span>
    <div v-else class="focus-avatar-fallback">
      <slot name="fallback">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="focus-avatar-icon"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </slot>
    </div>
    <div v-if="status" class="focus-avatar-status" :class="`focus-avatar-status--${status}`"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'Avatar'
  },
  initials: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  shape: {
    type: String,
    default: 'circle',
    validator: (value: string) => ['circle', 'square', 'rounded'].includes(value)
  },
  status: {
    type: String,
    default: '',
    validator: (value: string) => ['', 'online', 'offline', 'busy', 'away'].includes(value)
  },
  color: {
    type: String,
    default: ''
  },
  customSize: {
    type: [String, Number],
    default: ''
  }
});

const error = ref(false);

const handleError = () => {
  error.value = true;
};

const avatarClasses = computed(() => {
  return {
    [`focus-avatar--${props.size}`]: !props.customSize,
    [`focus-avatar--${props.shape}`]: true,
    'focus-avatar--with-status': !!props.status
  };
});

const avatarStyle = computed(() => {
  const style: Record<string, string> = {};
  
  if (props.customSize) {
    const size = typeof props.customSize === 'number' ? `${props.customSize}px` : props.customSize;
    style.width = size;
    style.height = size;
  }
  
  if (props.color && !props.src) {
    style.backgroundColor = props.color;
  }
  
  return style;
});
</script>

<style scoped>
.focus-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-secondary);
  color: var(--color-primary);
  font-weight: 500;
  overflow: hidden;
}

.focus-avatar--xs {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.625rem;
}

.focus-avatar--sm {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}

.focus-avatar--md {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 0.875rem;
}

.focus-avatar--lg {
  width: 3rem;
  height: 3rem;
  font-size: 1rem;
}

.focus-avatar--xl {
  width: 4rem;
  height: 4rem;
  font-size: 1.25rem;
}

.focus-avatar--circle {
  border-radius: 50%;
}

.focus-avatar--square {
  border-radius: 0;
}

.focus-avatar--rounded {
  border-radius: 0.375rem;
}

.focus-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.focus-avatar-initials {
  line-height: 1;
  text-transform: uppercase;
}

.focus-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-avatar-icon {
  width: 60%;
  height: 60%;
}

.focus-avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25%;
  height: 25%;
  border-radius: 50%;
  border: 2px solid var(--color-neutral);
}

.focus-avatar--xs .focus-avatar-status,
.focus-avatar--sm .focus-avatar-status {
  border-width: 1px;
}

.focus-avatar-status--online {
  background-color: var(--color-success);
}

.focus-avatar-status--offline {
  background-color: var(--color-text-light);
}

.focus-avatar-status--busy {
  background-color: var(--color-error);
}

.focus-avatar-status--away {
  background-color: var(--color-warning);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .focus-avatar {
    background-color: var(--color-secondary);
    color: var(--color-text-light);
  }
  
  .focus-avatar-status {
    border-color: var(--color-neutral);
  }
}
</style>