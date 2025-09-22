<template>
  <div 
    :class="cardClasses"
    @click="handleClick"
  >
    <div v-if="$slots.header" class="ios-card__header">
      <slot name="header" />
    </div>
    
    <div class="ios-card__content">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="ios-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'small' | 'medium' | 'large'
  clickable?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'medium',
  clickable: false,
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const cardClasses = computed(() => [
  'ios-card',
  `ios-card--${props.variant}`,
  `ios-card--padding-${props.padding}`,
  {
    'ios-card--clickable': props.clickable && !props.disabled,
    'ios-card--disabled': props.disabled
  }
])

const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
.ios-card {
  position: relative;
  border-radius: var(--ios-radius-large);
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  
  // 变体样式
  &--default {
    background-color: var(--ios-secondary-system-background);
  }
  
  &--elevated {
    background-color: var(--ios-secondary-system-background);
    box-shadow: var(--ios-shadow-medium);
  }
  
  &--outlined {
    background-color: var(--ios-system-background);
    border: 1px solid var(--ios-separator);
  }
  
  &--filled {
    background-color: var(--ios-tertiary-system-background);
  }
  
  // 内边距变体
  &--padding-none {
    padding: 0;
  }
  
  &--padding-small {
    padding: var(--ios-spacing-md);
  }
  
  &--padding-medium {
    padding: var(--ios-spacing-lg);
  }
  
  &--padding-large {
    padding: var(--ios-spacing-xl);
  }
  
  // 可点击状态
  &--clickable {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    
    &:hover {
      transform: translateY(-1px);
      
      &.ios-card--elevated {
        box-shadow: var(--ios-shadow-large);
      }
      
      &:not(.ios-card--elevated) {
        box-shadow: var(--ios-shadow-small);
      }
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      
      &.ios-card--elevated {
        box-shadow: var(--ios-shadow-medium);
      }
    }
  }
  
  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover,
    &:active {
      transform: none;
      box-shadow: none;
    }
  }
}

.ios-card__header {
  margin-bottom: var(--ios-spacing-md);
  padding-bottom: var(--ios-spacing-md);
  border-bottom: 1px solid var(--ios-separator);
}

.ios-card__content {
  flex: 1;
}

.ios-card__footer {
  margin-top: var(--ios-spacing-md);
  padding-top: var(--ios-spacing-md);
  border-top: 1px solid var(--ios-separator);
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .ios-card {
    &--default,
    &--elevated {
      background-color: var(--ios-secondary-system-background);
    }
    
    &--outlined {
      background-color: var(--ios-system-background);
    }
    
    &--filled {
      background-color: var(--ios-tertiary-system-background);
    }
  }
}
</style>