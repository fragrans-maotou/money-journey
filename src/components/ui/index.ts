// iOS 风格基础组件库
export { default as IOSButton } from './IOSButton.vue'
export { default as IOSInput } from './IOSInput.vue'
export { default as IOSCard } from './IOSCard.vue'
export { default as IOSActionSheet } from './IOSActionSheet.vue'
export { default as IOSSpinner } from './IOSSpinner.vue'

// 专用组件
export { default as AmountInput } from '../AmountInput.vue'

// 组件类型定义
export interface ActionSheetAction {
  text: string
  icon?: string
  type?: 'default' | 'destructive' | 'disabled'
  handler?: () => void | Promise<void>
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'plain'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

export interface InputProps {
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

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'small' | 'medium' | 'large'
  clickable?: boolean
  disabled?: boolean
}

export interface ActionSheetProps {
  visible: boolean
  title?: string
  message?: string
  actions: ActionSheetAction[]
  showCancel?: boolean
  cancelText?: string
  closeOnOverlay?: boolean
}

export interface AmountInputProps {
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