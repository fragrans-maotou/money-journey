import { ref, computed, readonly } from 'vue'
import type { LoadingState, LoadingOptions } from '@/types/errors'
import { useToast } from './useToast'

/**
 * Loading state management composable
 * Provides centralized loading state management with timeout and cancellation support
 */
export function useLoadingState() {
  // ============================================================================
  // Dependencies
  // ============================================================================

  const { showLoadingToast, hideLoadingToast } = useToast()

  // ============================================================================
  // State
  // ============================================================================

  const loadingStates = ref<Map<string, LoadingState>>(new Map())
  const globalLoading = ref(false)
  const globalMessage = ref<string>()
  const globalProgress = ref<number>()

  // ============================================================================
  // Computed Properties
  // ============================================================================

  const isLoading = computed(() => {
    return globalLoading.value || loadingStates.value.size > 0
  })

  const loadingMessage = computed(() => {
    return globalMessage.value || Array.from(loadingStates.value.values())[0]?.message
  })

  const loadingProgress = computed(() => {
    if (globalProgress.value !== undefined) {
      return globalProgress.value
    }

    const states = Array.from(loadingStates.value.values())
    const progressStates = states.filter(state => state.progress !== undefined)
    
    if (progressStates.length === 0) return undefined

    const totalProgress = progressStates.reduce((sum, state) => sum + (state.progress || 0), 0)
    return totalProgress / progressStates.length
  })

  const canCancel = computed(() => {
    return Array.from(loadingStates.value.values()).some(state => state.cancelable)
  })

  // ============================================================================
  // Core Methods
  // ============================================================================

  const startLoading = (
    key: string,
    options: LoadingOptions = {}
  ): string => {
    const {
      message = '加载中...',
      timeout,
      showProgress = false,
      cancelable = false,
      onTimeout,
      onCancel
    } = options

    const loadingState: LoadingState = {
      isLoading: true,
      message,
      progress: showProgress ? 0 : undefined,
      cancelable,
      onCancel
    }

    loadingStates.value.set(key, loadingState)

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined
    if (timeout && timeout > 0) {
      timeoutId = setTimeout(() => {
        stopLoading(key)
        if (onTimeout) {
          onTimeout()
        }
      }, timeout)
    }

    // Show toast for long-running operations
    let toastId: string | undefined
    if (timeout && timeout > 3000) {
      toastId = showLoadingToast(message)
    }

    // Store cleanup function
    if (timeoutId || toastId) {
      const originalState = loadingStates.value.get(key)
      if (originalState) {
        loadingStates.value.set(key, {
          ...originalState,
          onCancel: () => {
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) hideLoadingToast(toastId)
            if (onCancel) onCancel()
          }
        })
      }
    }

    return key
  }

  const stopLoading = (key: string, successMessage?: string): void => {
    const state = loadingStates.value.get(key)
    if (state) {
      // Call cleanup if available
      if (state.onCancel) {
        state.onCancel()
      }
      
      loadingStates.value.delete(key)
    }
  }

  const updateProgress = (key: string, progress: number, message?: string): void => {
    const state = loadingStates.value.get(key)
    if (state) {
      loadingStates.value.set(key, {
        ...state,
        progress: Math.max(0, Math.min(100, progress)),
        message: message || state.message
      })
    }
  }

  const updateMessage = (key: string, message: string): void => {
    const state = loadingStates.value.get(key)
    if (state) {
      loadingStates.value.set(key, {
        ...state,
        message
      })
    }
  }

  const cancelLoading = (key: string): void => {
    const state = loadingStates.value.get(key)
    if (state && state.cancelable && state.onCancel) {
      state.onCancel()
    }
    stopLoading(key)
  }

  const cancelAllLoading = (): void => {
    const keys = Array.from(loadingStates.value.keys())
    keys.forEach(key => cancelLoading(key))
    setGlobalLoading(false)
  }

  // ============================================================================
  // Global Loading Methods
  // ============================================================================

  const setGlobalLoading = (
    loading: boolean,
    message?: string,
    progress?: number
  ): void => {
    globalLoading.value = loading
    globalMessage.value = message
    globalProgress.value = progress
  }

  const startGlobalLoading = (message?: string): void => {
    setGlobalLoading(true, message)
  }

  const stopGlobalLoading = (): void => {
    setGlobalLoading(false)
  }

  const updateGlobalProgress = (progress: number, message?: string): void => {
    if (globalLoading.value) {
      globalProgress.value = Math.max(0, Math.min(100, progress))
      if (message) {
        globalMessage.value = message
      }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const isLoadingKey = (key: string): boolean => {
    return loadingStates.value.has(key)
  }

  const getLoadingState = (key: string): LoadingState | undefined => {
    return loadingStates.value.get(key)
  }

  const getAllLoadingKeys = (): string[] => {
    return Array.from(loadingStates.value.keys())
  }

  const getLoadingCount = (): number => {
    return loadingStates.value.size + (globalLoading.value ? 1 : 0)
  }

  const clearAllLoading = (): void => {
    loadingStates.value.clear()
    setGlobalLoading(false)
  }

  // ============================================================================
  // Async Operation Wrapper
  // ============================================================================

  const withLoading = async <T>(
    key: string,
    operation: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    startLoading(key, options)
    
    try {
      const result = await operation()
      stopLoading(key)
      return result
    } catch (error) {
      stopLoading(key)
      throw error
    }
  }

  const withGlobalLoading = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startGlobalLoading(message)
    
    try {
      const result = await operation()
      stopGlobalLoading()
      return result
    } catch (error) {
      stopGlobalLoading()
      throw error
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const startBatchLoading = (
    operations: Array<{ key: string; options?: LoadingOptions }>
  ): void => {
    operations.forEach(({ key, options }) => {
      startLoading(key, options)
    })
  }

  const stopBatchLoading = (keys: string[]): void => {
    keys.forEach(key => stopLoading(key))
  }

  const updateBatchProgress = (
    updates: Array<{ key: string; progress: number; message?: string }>
  ): void => {
    updates.forEach(({ key, progress, message }) => {
      updateProgress(key, progress, message)
    })
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    isLoading,
    loadingMessage,
    loadingProgress,
    canCancel,

    // Core methods
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    cancelLoading,
    cancelAllLoading,

    // Global loading methods
    setGlobalLoading,
    startGlobalLoading,
    stopGlobalLoading,
    updateGlobalProgress,

    // Utility methods
    isLoadingKey,
    getLoadingState,
    getAllLoadingKeys,
    getLoadingCount,
    clearAllLoading,

    // Async wrappers
    withLoading,
    withGlobalLoading,

    // Batch operations
    startBatchLoading,
    stopBatchLoading,
    updateBatchProgress
  }
}

// ============================================================================
// Global Loading State Instance
// ============================================================================

let globalLoadingState: ReturnType<typeof useLoadingState> | null = null

export function getGlobalLoadingState() {
  if (!globalLoadingState) {
    globalLoadingState = useLoadingState()
  }
  return globalLoadingState
}