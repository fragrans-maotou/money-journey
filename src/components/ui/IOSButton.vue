<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <span v-if="loading" class="ios-button__spinner">
      <IOSSpinner :size="spinnerSize" />
    </span>
    <span v-else class="ios-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import IOSSpinner from './IOSSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'destructive' | 'plain'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  fullWidth: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isPressed = ref(false)

const buttonClasses = computed(() => [
  'ios-button',
  `ios-button--${props.variant}`,
  `ios-button--${props.size}`,
  {
    'ios-button--disabled': props.disabled,
    'ios-button--loading': props.loading,
    'ios-button--full-width': props.fullWidth,
    'ios-button--pressed': isPressed.value
  }
])

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small': return 16
    case 'large': return 24
    default: return 20
  }
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleTouchStart = () => {
  if (!props.disabled && !props.loading) {
    isPressed.value = true
  }
}

const handleTouchEnd = () => {
  isPressed.value = false
}
</script>

<style lang="scss" scoped>
.ios-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--ios-radius-medium);
  font-family: var(--ios-font-family);
  font-weight: var(--ios-font-weight-semibold);
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  -webkit-tap-highlight-color: transparent;
  
  &:focus {
    outline: none;
  }
  
  // 尺寸变体
  &--small {
    height: 32px;
    padding: 0 var(--ios-spacing-md);
    font-size: var(--ios-font-size-footnote);
    border-radius: var(--ios-radius-small);
  }
  
  &--medium {
    height: 44px;
    padding: 0 var(--ios-spacing-xl);
    font-size: var(--ios-font-size-body);
  }
  
  &--large {
    height: 56px;
    padding: 0 var(--ios-spacing-2xl);
    font-size: var(--ios-font-size-headline);
    border-radius: var(--ios-radius-large);
  }
  
  // 颜色变体
  &--primary {
    background-color: var(--ios-blue);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #0056CC;
    }
    
    &:active,
    &--pressed {
      background-color: #004499;
      transform: scale(0.95);
    }
  }
  
  &--secondary {
    background-color: var(--ios-gray-6);
    color: var(--ios-blue);
    
    &:hover:not(:disabled) {
      background-color: var(--ios-gray-5);
    }
    
    &:active,
    &--pressed {
      background-color: var(--ios-gray-4);
      transform: scale(0.95);
    }
  }
  
  &--destructive {
    background-color: var(--ios-red);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #E6342A;
    }
    
    &:active,
    &--pressed {
      background-color: #CC2E24;
      transform: scale(0.95);
    }
  }
  
  &--plain {
    background-color: transparent;
    color: var(--ios-blue);
    
    &:hover:not(:disabled) {
      background-color: rgba(0, 122, 255, 0.1);
    }
    
    &:active,
    &--pressed {
      background-color: rgba(0, 122, 255, 0.2);
      transform: scale(0.95);
    }
  }
  
  // 状态
  &--disabled {
    opacity: 0.3;
    cursor: not-allowed;
    
    &:active {
      transform: none;
    }
  }
  
  &--loading {
    cursor: default;
    
    &:active {
      transform: none;
    }
  }
  
  &--full-width {
    width: 100%;
  }
}

.ios-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ios-spacing-sm);
}

.ios-button__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .ios-button {
    &--secondary {
      background-color: var(--ios-tertiary-system-background);
      color: var(--ios-blue);
      
      &:hover:not(:disabled) {
        background-color: #3A3A3C;
      }
      
      &:active,
      &--pressed {
        background-color: #48484A;
      }
    }
    
    &--plain {
      &:hover:not(:disabled) {
        background-color: rgba(10, 132, 255, 0.15);
      }
      
      &:active,
      &--pressed {
        background-color: rgba(10, 132, 255, 0.25);
      }
    }
  }
}
</style>