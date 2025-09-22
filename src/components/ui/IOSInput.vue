<template>
  <div class="ios-input-wrapper">
    <label v-if="label" class="ios-input__label">
      {{ label }}
      <span v-if="required" class="ios-input__required">*</span>
    </label>
    
    <div 
      :class="inputContainerClasses"
      @click="focusInput"
    >
      <div v-if="$slots.prefix" class="ios-input__prefix">
        <slot name="prefix" />
      </div>
      
      <input
        ref="inputRef"
        v-model="inputValue"
        :class="inputClasses"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      
      <div v-if="$slots.suffix || clearable" class="ios-input__suffix">
        <button
          v-if="clearable && inputValue && !disabled && !readonly"
          class="ios-input__clear"
          @click="clearInput"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.3"/>
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <slot name="suffix" />
      </div>
    </div>
    
    <div v-if="error || hint" class="ios-input__message">
      <span v-if="error" class="ios-input__error">{{ error }}</span>
      <span v-else-if="hint" class="ios-input__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'tel' | 'number' | 'search'
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  maxlength?: number
  min?: number
  max?: number
  step?: number
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  size: 'medium'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  keydown: [event: KeyboardEvent]
  clear: []
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => {
    const finalValue = props.type === 'number' ? Number(value) : value
    emit('update:modelValue', finalValue)
  }
})

const inputContainerClasses = computed(() => [
  'ios-input__container',
  `ios-input__container--${props.size}`,
  {
    'ios-input__container--focused': isFocused.value,
    'ios-input__container--error': props.error,
    'ios-input__container--disabled': props.disabled,
    'ios-input__container--readonly': props.readonly
  }
])

const inputClasses = computed(() => [
  'ios-input',
  `ios-input--${props.size}`
])

const focusInput = () => {
  if (!props.disabled && !props.readonly) {
    inputRef.value?.focus()
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleInput = (event: Event) => {
  emit('input', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const clearInput = async () => {
  inputValue.value = ''
  emit('clear')
  await nextTick()
  focusInput()
}
</script>

<style lang="scss" scoped>
.ios-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-sm);
}

.ios-input__label {
  font-size: var(--ios-font-size-footnote);
  font-weight: var(--ios-font-weight-medium);
  color: var(--ios-label);
  margin-bottom: var(--ios-spacing-xs);
}

.ios-input__required {
  color: var(--ios-red);
}

.ios-input__container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--ios-tertiary-system-background);
  border: 1px solid var(--ios-separator);
  border-radius: var(--ios-radius-medium);
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  
  &--small {
    min-height: 36px;
    padding: 0 var(--ios-spacing-md);
  }
  
  &--medium {
    min-height: 44px;
    padding: 0 var(--ios-spacing-lg);
  }
  
  &--large {
    min-height: 52px;
    padding: 0 var(--ios-spacing-xl);
  }
  
  &--focused {
    border-color: var(--ios-blue);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
  
  &--error {
    border-color: var(--ios-red);
    
    &.ios-input__container--focused {
      box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
    }
  }
  
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &--readonly {
    background-color: var(--ios-secondary-system-background);
  }
}

.ios-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--ios-font-family);
  font-weight: var(--ios-font-weight-regular);
  color: var(--ios-label);
  
  &--small {
    font-size: var(--ios-font-size-footnote);
  }
  
  &--medium {
    font-size: var(--ios-font-size-body);
  }
  
  &--large {
    font-size: var(--ios-font-size-headline);
  }
  
  &::placeholder {
    color: var(--ios-tertiary-label);
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  // 移除数字输入框的箭头
  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.ios-input__prefix,
.ios-input__suffix {
  display: flex;
  align-items: center;
  color: var(--ios-secondary-label);
}

.ios-input__prefix {
  margin-right: var(--ios-spacing-sm);
}

.ios-input__suffix {
  margin-left: var(--ios-spacing-sm);
  gap: var(--ios-spacing-sm);
}

.ios-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--ios-gray);
  cursor: pointer;
  border-radius: 50%;
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  
  &:hover {
    color: var(--ios-secondary-label);
  }
  
  &:active {
    transform: scale(0.9);
  }
}

.ios-input__message {
  font-size: var(--ios-font-size-caption1);
  line-height: 1.3;
}

.ios-input__error {
  color: var(--ios-red);
}

.ios-input__hint {
  color: var(--ios-secondary-label);
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .ios-input__container {
    background-color: var(--ios-secondary-system-background);
    border-color: var(--ios-separator);
  }
}
</style>