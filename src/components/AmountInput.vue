<template>
  <div class="amount-input">
    <div class="amount-input__container">
      <div class="amount-input__currency">¥</div>
      <input
        ref="inputRef"
        v-model="displayValue"
        class="amount-input__input"
        type="text"
        inputmode="decimal"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <div v-if="showClear && displayValue && !disabled && !readonly" class="amount-input__clear">
        <button class="amount-input__clear-btn" @click="clearInput">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.3"/>
            <path d="M7 7L13 13M13 7L7 13" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="error || hint" class="amount-input__message">
      <span v-if="error" class="amount-input__error">{{ error }}</span>
      <span v-else-if="hint" class="amount-input__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  modelValue?: number
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  showClear?: boolean
  min?: number
  max?: number
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0.00',
  disabled: false,
  readonly: false,
  showClear: true,
  min: 0,
  max: 999999.99,
  precision: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [value: number]
  clear: []
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// 格式化显示值
const displayValue = computed({
  get: () => {
    if (props.modelValue === undefined || props.modelValue === null) {
      return ''
    }
    return formatAmount(props.modelValue)
  },
  set: (value: string) => {
    const numericValue = parseAmount(value)
    if (numericValue !== null) {
      emit('update:modelValue', numericValue)
      emit('input', numericValue)
    }
  }
})

// 格式化金额显示
const formatAmount = (amount: number): string => {
  if (amount === 0) return ''
  return amount.toFixed(props.precision).replace(/\.?0+$/, '')
}

// 解析金额输入
const parseAmount = (value: string): number | null => {
  // 移除非数字字符（保留小数点）
  const cleaned = value.replace(/[^\d.]/g, '')
  
  // 处理多个小数点的情况
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return null
  }
  
  const numericValue = parseFloat(cleaned)
  
  if (isNaN(numericValue)) {
    return null
  }
  
  // 应用最小值和最大值限制
  const clampedValue = Math.max(props.min, Math.min(props.max, numericValue))
  
  // 应用精度限制
  return Math.round(clampedValue * Math.pow(10, props.precision)) / Math.pow(10, props.precision)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  
  // 格式化输入值
  if (displayValue.value) {
    const numericValue = parseAmount(displayValue.value)
    if (numericValue !== null) {
      displayValue.value = formatAmount(numericValue)
    }
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // 实时验证输入
  const numericValue = parseAmount(value)
  if (numericValue !== null) {
    emit('input', numericValue)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // 只允许数字、小数点、退格、删除、方向键等
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End'
  ]
  
  const isNumber = /^[0-9]$/.test(event.key)
  const isDecimal = event.key === '.' && !displayValue.value.includes('.')
  const isAllowed = allowedKeys.includes(event.key)
  const isModifier = event.ctrlKey || event.metaKey || event.altKey
  
  if (!isNumber && !isDecimal && !isAllowed && !isModifier) {
    event.preventDefault()
  }
}

const clearInput = async () => {
  displayValue.value = ''
  emit('update:modelValue', 0)
  emit('clear')
  await nextTick()
  inputRef.value?.focus()
}

// 暴露方法给父组件
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: clearInput
})
</script>

<style lang="scss" scoped>
.amount-input {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-sm, 8px);
}

.amount-input__container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--ios-tertiary-system-background, #f2f2f7);
  border: 1px solid var(--ios-separator, #c6c6c8);
  border-radius: var(--ios-radius-large, 16px);
  padding: 0 var(--ios-spacing-lg, 16px);
  min-height: 56px;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: var(--ios-blue, #007aff);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
  
  &:has(.amount-input__input[disabled]) {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:has(.amount-input__input[readonly]) {
    background-color: var(--ios-secondary-system-background, #f2f2f7);
  }
}

.amount-input__currency {
  font-size: 24px;
  font-weight: 600;
  color: var(--ios-label, #000);
  margin-right: var(--ios-spacing-sm, 8px);
  user-select: none;
}

.amount-input__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--ios-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  font-size: 24px;
  font-weight: 600;
  color: var(--ios-label, #000);
  text-align: left;
  
  &::placeholder {
    color: var(--ios-tertiary-label, #c7c7cc);
    font-weight: 400;
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

.amount-input__clear {
  margin-left: var(--ios-spacing-sm, 8px);
}

.amount-input__clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--ios-gray, #8e8e93);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--ios-secondary-label, #3c3c43);
  }
  
  &:active {
    transform: scale(0.9);
  }
}

.amount-input__message {
  font-size: var(--ios-font-size-caption1, 12px);
  line-height: 1.3;
  padding: 0 var(--ios-spacing-lg, 16px);
}

.amount-input__error {
  color: var(--ios-red, #ff3b30);
}

.amount-input__hint {
  color: var(--ios-secondary-label, #3c3c43);
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .amount-input__container {
    background-color: var(--ios-secondary-system-background, #1c1c1e);
    border-color: var(--ios-separator, #38383a);
  }
  
  .amount-input__currency,
  .amount-input__input {
    color: var(--ios-label, #ffffff);
  }
}
</style>