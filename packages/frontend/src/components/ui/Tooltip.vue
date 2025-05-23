<template>
  <div class="focus-tooltip-container">
    <div
      ref="triggerRef"
      class="focus-tooltip-trigger"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <slot></slot>
    </div>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="visible"
          ref="tooltipRef"
          class="focus-tooltip"
          :class="tooltipClasses"
          :style="tooltipStyle"
          role="tooltip"
        >
          <slot name="content">{{ content }}</slot>
          <div class="focus-tooltip-arrow" :style="arrowStyle"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: 'top',
    validator: (value: string) => ['top', 'right', 'bottom', 'left'].includes(value)
  },
  variant: {
    type: String,
    default: 'dark',
    validator: (value: string) => ['dark', 'light', 'primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error'].includes(value)
  },
  delay: {
    type: Number,
    default: 300
  },
  offset: {
    type: Number,
    default: 8
  },
  borderRadius: {
    type: String,
    default: 'md',
    validator: (value: string) => ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  maxWidth: {
    type: String,
    default: '250px'
  },
  interactive: {
    type: Boolean,
    default: false
  }
});

const visible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const timeout = ref<number | null>(null);

const tooltipClasses = computed(() => {
  return {
    [`focus-tooltip--${props.variant}`]: true,
    [`focus-tooltip--${props.position}`]: true,
    [`focus-tooltip--radius-${props.borderRadius}`]: true,
    'focus-tooltip--interactive': props.interactive
  };
});

const tooltipStyle = ref({
  top: '0px',
  left: '0px',
  maxWidth: props.maxWidth
});

const arrowStyle = ref({
  top: '0px',
  left: '0px'
});

const updatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  
  let top = 0;
  let left = 0;
  
  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - props.offset + scrollTop;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollLeft;
      arrowStyle.value = {
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)'
      };
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollTop;
      left = triggerRect.right + props.offset + scrollLeft;
      arrowStyle.value = {
        left: '-4px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)'
      };
      break;
    case 'bottom':
      top = triggerRect.bottom + props.offset + scrollTop;
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollLeft;
      arrowStyle.value = {
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)'
      };
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollTop;
      left = triggerRect.left - tooltipRect.width - props.offset + scrollLeft;
      arrowStyle.value = {
        right: '-4px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)'
      };
      break;
  }
  
  // 确保提示框不会超出视口
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width;
  if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height;
  
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    maxWidth: props.maxWidth
  };
};

const showTooltip = () => {
  if (timeout.value) clearTimeout(timeout.value);
  timeout.value = window.setTimeout(() => {
    visible.value = true;
    // 在下一个 tick 更新位置，确保 tooltip 已经渲染
    setTimeout(updatePosition, 0);
  }, props.delay);
};

const hideTooltip = () => {
  if (timeout.value) clearTimeout(timeout.value);
  timeout.value = window.setTimeout(() => {
    visible.value = false;
  }, 100);
};

const handleScroll = () => {
  if (visible.value) {
    updatePosition();
  }
};

const handleResize = () => {
  if (visible.value) {
    updatePosition();
  }
};

watch(() => props.content, () => {
  if (visible.value) {
    updatePosition();
  }
});

watch(() => props.maxWidth, (newValue) => {
  tooltipStyle.value.maxWidth = newValue;
});

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleResize);
  if (timeout.value) clearTimeout(timeout.value);
});
</script>

<style scoped>
.focus-tooltip-container {
  display: inline-block;
  position: relative;
}

.focus-tooltip-trigger {
  display: inline-block;
}

.focus-tooltip {
  position: absolute;
  z-index: 100;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 250px;
  word-wrap: break-word;
  transition: all var(--transition-fast);
}

.focus-tooltip--interactive {
  pointer-events: auto;
}

.focus-tooltip:not(.focus-tooltip--interactive) {
  pointer-events: none;
}

.focus-tooltip--radius-none {
  border-radius: 0;
}

.focus-tooltip--radius-sm {
  border-radius: var(--radius-sm);
}

.focus-tooltip--radius-md {
  border-radius: var(--radius-md);
}

.focus-tooltip--radius-lg {
  border-radius: var(--radius-lg);
}

.focus-tooltip--radius-xl {
  border-radius: var(--radius-xl);
}

.focus-tooltip--radius-full {
  border-radius: var(--radius-full);
}

.focus-tooltip--dark {
  background-color: var(--color-primary);
  color: white;
}

.focus-tooltip--light {
  background-color: var(--color-neutral);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.focus-tooltip--primary {
  background-color: var(--color-primary);
  color: white;
}

.focus-tooltip--secondary {
  background-color: var(--color-secondary);
  color: white;
}

.focus-tooltip--accent {
  background-color: var(--color-accent);
  color: white;
}

.focus-tooltip--success {
  background-color: var(--color-success);
  color: white;
}

.focus-tooltip--info {
  background-color: var(--color-info);
  color: white;
}

.focus-tooltip--warning {
  background-color: var(--color-warning);
  color: white;
}

.focus-tooltip--error {
  background-color: var(--color-error);
  color: white;
}

.focus-tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  border: inherit;
  border-width: 0;
  z-index: -1;
}

.focus-tooltip--dark .focus-tooltip-arrow {
  background-color: var(--color-primary);
}

.focus-tooltip--light .focus-tooltip-arrow {
  background-color: var(--color-neutral);
  border: 1px solid var(--color-border);
  border-width: inherit;
}

.focus-tooltip--primary .focus-tooltip-arrow {
  background-color: var(--color-primary);
}

.focus-tooltip--secondary .focus-tooltip-arrow {
  background-color: var(--color-secondary);
}

.focus-tooltip--accent .focus-tooltip-arrow {
  background-color: var(--color-accent);
}

.focus-tooltip--success .focus-tooltip-arrow {
  background-color: var(--color-success);
}

.focus-tooltip--info .focus-tooltip-arrow {
  background-color: var(--color-info);
}

.focus-tooltip--warning .focus-tooltip-arrow {
  background-color: var(--color-warning);
}

.focus-tooltip--error .focus-tooltip-arrow {
  background-color: var(--color-error);
}
</style>