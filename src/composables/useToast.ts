import { ref, readonly, nextTick } from 'vue'
import type { ToastMessage, ToastAction } from '@/types/errors'
import { ToastType } from '@/types/errors'
import { generateId } from '@/types/utils'

/**
 * Toast notification composable
 * Provides centralized toast message management with iOS-style animations
 */
export function useToast() {
  // ============================================================================
  // State
  // ============================================================================

  const toasts = ref<ToastMessage[]>([])
  const maxToasts = 5 // Maximum number of toasts to show simultaneously

  // ============================================================================
  // Core Methods
  // ============================================================================

  const showToast = (options: {
    type: ToastType
    title?: string
    message: string
    duration?: number
    persistent?: boolean
    actions?: ToastAction[]
  }): string => {
    const {
      type,
      title,
      message,
      duration = getDefaultDuration(type),
      persistent = false,
      actions
    } = options

    const toast: ToastMessage = {
      id: generateId(),
      type,
      title,
      message,
      duration,
      persistent,
      actions,
      timestamp: new Date()
    }

    // Add toast to the list
    toasts.value.push(toast)

    // Remove oldest toasts if we exceed the maximum
    if (toasts.value.length > maxToasts) {
      const toastsToRemove = toasts.value.splice(0, toasts.value.length - maxToasts)
      toastsToRemove.forEach(t => clearTimeout(t.id as any))
    }

    // Auto-remove toast after duration (if not persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, duration)
    }

    return toast.id
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  const showSuccess = (message: string, title?: string, duration?: number): string => {
    return showToast({
      type: ToastType.SUCCESS,
      title,
      message,
      duration
    })
  }

  const showError = (message: string, title?: string, options?: {
    persistent?: boolean
    actions?: ToastAction[]
  }): string => {
    return showToast({
      type: ToastType.ERROR,
      title,
      message,
      persistent: options?.persistent,
      actions: options?.actions
    })
  }

  const showWarning = (message: string, title?: string, duration?: number): string => {
    return showToast({
      type: ToastType.WARNING,
      title,
      message,
      duration
    })
  }

  const showInfo = (message: string, title?: string, duration?: number): string => {
    return showToast({
      type: ToastType.INFO,
      title,
      message,
      duration
    })
  }

  // ============================================================================
  // Management Methods
  // ============================================================================

  const removeToast = (toastId: string): void => {
    const index = toasts.value.findIndex(toast => toast.id === toastId)
    if (index >= 0) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAllToasts = (): void => {
    toasts.value = []
  }

  const clearToastsByType = (type: ToastType): void => {
    toasts.value = toasts.value.filter(toast => toast.type !== type)
  }

  const updateToast = (toastId: string, updates: Partial<ToastMessage>): void => {
    const index = toasts.value.findIndex(toast => toast.id === toastId)
    if (index >= 0) {
      toasts.value[index] = { ...toasts.value[index], ...updates }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const getDefaultDuration = (type: ToastType): number => {
    switch (type) {
      case ToastType.SUCCESS:
        return 3000
      case ToastType.INFO:
        return 4000
      case ToastType.WARNING:
        return 5000
      case ToastType.ERROR:
        return 6000
      default:
        return 4000
    }
  }

  const getToastIcon = (type: ToastType): string => {
    switch (type) {
      case ToastType.SUCCESS:
        return '✓'
      case ToastType.ERROR:
        return '✕'
      case ToastType.WARNING:
        return '⚠'
      case ToastType.INFO:
        return 'ℹ'
      default:
        return ''
    }
  }

  const getToastColor = (type: ToastType): string => {
    switch (type) {
      case ToastType.SUCCESS:
        return '#34C759'
      case ToastType.ERROR:
        return '#FF3B30'
      case ToastType.WARNING:
        return '#FF9500'
      case ToastType.INFO:
        return '#007AFF'
      default:
        return '#8E8E93'
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const showLoadingToast = (message: string = '加载中...'): string => {
    return showToast({
      type: ToastType.INFO,
      message,
      persistent: true
    })
  }

  const updateLoadingToast = (toastId: string, message: string): void => {
    updateToast(toastId, { message })
  }

  const hideLoadingToast = (toastId: string, successMessage?: string): void => {
    if (successMessage) {
      updateToast(toastId, {
        type: ToastType.SUCCESS,
        message: successMessage,
        persistent: false,
        duration: 2000
      })
      
      setTimeout(() => removeToast(toastId), 2000)
    } else {
      removeToast(toastId)
    }
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  const hasToasts = (): boolean => {
    return toasts.value.length > 0
  }

  const getToastCount = (): number => {
    return toasts.value.length
  }

  const getToastsByType = (type: ToastType): ToastMessage[] => {
    return toasts.value.filter(toast => toast.type === type)
  }

  const hasErrorToasts = (): boolean => {
    return toasts.value.some(toast => toast.type === ToastType.ERROR)
  }

  const hasPersistentToasts = (): boolean => {
    return toasts.value.some(toast => toast.persistent)
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    toasts: readonly(toasts),

    // Core methods
    showToast,

    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Management methods
    removeToast,
    clearAllToasts,
    clearToastsByType,
    updateToast,

    // Loading toast methods
    showLoadingToast,
    updateLoadingToast,
    hideLoadingToast,

    // Utility methods
    getToastIcon,
    getToastColor,
    hasToasts,
    getToastCount,
    getToastsByType,
    hasErrorToasts,
    hasPersistentToasts
  }
}

// ============================================================================
// Global Toast Instance
// ============================================================================

let globalToast: ReturnType<typeof useToast> | null = null

export function getGlobalToast() {
  if (!globalToast) {
    globalToast = useToast()
  }
  return globalToast
}