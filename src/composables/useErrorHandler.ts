import { ref, readonly } from 'vue'
import type { 
  AppError, 
  ErrorHandlerOptions,
  RecoveryAction,
  RecoveryResult
} from '@/types/errors'
import { 
  ErrorType, 
  ErrorSeverity 
} from '@/types/errors'
import { useToast } from './useToast'
import { generateId } from '@/types/utils'

/**
 * Global error handling composable
 * Provides centralized error handling, logging, and recovery mechanisms
 */
export function useErrorHandler() {
  // ============================================================================
  // Dependencies
  // ============================================================================
  
  const { showToast } = useToast()

  // ============================================================================
  // State
  // ============================================================================

  const errors = ref<AppError[]>([])
  const isRecovering = ref(false)

  // ============================================================================
  // Error Creation Utilities
  // ============================================================================

  const createError = (
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity
      details?: string
      context?: Record<string, any>
      component?: string
      action?: string
      recoverable?: boolean
      originalError?: Error
    } = {}
  ): AppError => {
    const {
      severity = ErrorSeverity.MEDIUM,
      details,
      context,
      component,
      action,
      recoverable = true,
      originalError
    } = options

    return {
      id: generateId(),
      type,
      severity,
      message,
      details,
      context,
      timestamp: new Date(),
      stack: originalError?.stack,
      component,
      action,
      recoverable
    }
  }

  // ============================================================================
  // Error Handling Methods
  // ============================================================================

  const handleError = async (
    error: AppError | Error | string,
    options: ErrorHandlerOptions = {}
  ): Promise<void> => {
    const {
      showToast: shouldShowToast = true,
      logToConsole = true,
      reportToService = false,
      attemptRecovery = true,
      fallbackAction
    } = options

    let appError: AppError

    // Convert different error types to AppError
    if (typeof error === 'string') {
      appError = createError(ErrorType.UNKNOWN_ERROR, error)
    } else if (error instanceof Error) {
      appError = createError(
        ErrorType.UNKNOWN_ERROR,
        error.message,
        { 
          originalError: error,
          details: error.stack
        }
      )
    } else {
      appError = error
    }

    // Store error
    errors.value.push(appError)

    // Log to console if enabled
    if (logToConsole) {
      console.error('Application Error:', {
        id: appError.id,
        type: appError.type,
        severity: appError.severity,
        message: appError.message,
        details: appError.details,
        context: appError.context,
        timestamp: appError.timestamp,
        component: appError.component,
        action: appError.action
      })

      if (appError.stack) {
        console.error('Stack trace:', appError.stack)
      }
    }

    // Show toast notification if enabled
    if (shouldShowToast) {
      showToast({
        type: 'error',
        title: getErrorTitle(appError.type),
        message: appError.message,
        duration: appError.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
        persistent: appError.severity === ErrorSeverity.CRITICAL,
        actions: appError.recoverable ? [
          {
            label: '重试',
            action: () => attemptErrorRecovery(appError)
          }
        ] : undefined
      })
    }

    // Attempt automatic recovery for recoverable errors
    if (attemptRecovery && appError.recoverable) {
      await attemptErrorRecovery(appError)
    }

    // Execute fallback action if provided
    if (fallbackAction) {
      try {
        fallbackAction()
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError)
      }
    }

    // Report to external service if enabled (placeholder for future implementation)
    if (reportToService) {
      await reportError(appError)
    }
  }

  // ============================================================================
  // Specific Error Handlers
  // ============================================================================

  const handleStorageError = async (error: Error, context?: Record<string, any>): Promise<void> => {
    const appError = createError(
      ErrorType.STORAGE_ERROR,
      '数据保存失败，请检查存储空间',
      {
        severity: ErrorSeverity.HIGH,
        details: error.message,
        context,
        originalError: error,
        recoverable: true
      }
    )

    await handleError(appError, {
      attemptRecovery: true,
      fallbackAction: () => {
        // Attempt to clear old data or suggest user actions
        console.info('Suggesting storage cleanup to user')
      }
    })
  }

  const handleValidationError = (field: string, message: string, value?: any): void => {
    const appError = createError(
      ErrorType.VALIDATION_ERROR,
      message,
      {
        severity: ErrorSeverity.LOW,
        context: { field, value },
        recoverable: true
      }
    )

    handleError(appError, {
      showToast: false, // Validation errors are usually shown inline
      logToConsole: false
    })
  }

  const handleCalculationError = async (error: Error, context?: Record<string, any>): Promise<void> => {
    const appError = createError(
      ErrorType.CALCULATION_ERROR,
      '预算计算出现问题，请重试',
      {
        severity: ErrorSeverity.MEDIUM,
        details: error.message,
        context,
        originalError: error,
        recoverable: true
      }
    )

    await handleError(appError, {
      attemptRecovery: true,
      fallbackAction: () => {
        // Reset to safe state
        console.info('Resetting calculation state to safe defaults')
      }
    })
  }

  const handleComponentError = async (
    componentName: string, 
    error: Error, 
    context?: Record<string, any>
  ): Promise<void> => {
    const appError = createError(
      ErrorType.COMPONENT_ERROR,
      `组件 ${componentName} 发生错误`,
      {
        severity: ErrorSeverity.MEDIUM,
        details: error.message,
        context,
        component: componentName,
        originalError: error,
        recoverable: true
      }
    )

    await handleError(appError)
  }

  // ============================================================================
  // Recovery Mechanisms
  // ============================================================================

  const attemptErrorRecovery = async (error: AppError): Promise<RecoveryResult> => {
    if (isRecovering.value) {
      return { success: false, message: '正在进行恢复操作，请稍候' }
    }

    isRecovering.value = true

    try {
      const recoveryActions = getRecoveryActions(error)
      
      for (const action of recoveryActions) {
        if (action.automatic) {
          console.info(`Attempting automatic recovery: ${action.label}`)
          const success = await action.action()
          
          if (success) {
            // Remove the error from the list if recovery was successful
            const errorIndex = errors.value.findIndex(e => e.id === error.id)
            if (errorIndex >= 0) {
              errors.value.splice(errorIndex, 1)
            }

            showToast({
              type: 'success',
              message: `恢复成功: ${action.description}`,
              duration: 3000
            })

            return { success: true, message: action.description }
          }
        }
      }

      // If automatic recovery failed, offer manual recovery options
      const manualActions = recoveryActions.filter(action => !action.automatic)
      if (manualActions.length > 0) {
        return {
          success: false,
          message: '自动恢复失败，请选择手动恢复选项',
          actions: manualActions
        }
      }

      return { success: false, message: '无法自动恢复，请刷新页面或联系支持' }

    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError)
      return { success: false, message: '恢复操作失败' }
    } finally {
      isRecovering.value = false
    }
  }

  const getRecoveryActions = (error: AppError): RecoveryAction[] => {
    const actions: RecoveryAction[] = []

    switch (error.type) {
      case ErrorType.STORAGE_ERROR:
        actions.push(
          {
            id: 'retry-save',
            label: '重试保存',
            description: '重新尝试保存数据',
            action: async () => {
              // Implement retry logic based on context
              return true
            },
            priority: 1,
            automatic: true
          },
          {
            id: 'clear-cache',
            label: '清理缓存',
            description: '清理本地缓存数据',
            action: async () => {
              // Implement cache clearing logic
              return true
            },
            priority: 2,
            automatic: false
          }
        )
        break

      case ErrorType.CALCULATION_ERROR:
        actions.push(
          {
            id: 'recalculate',
            label: '重新计算',
            description: '重新执行预算计算',
            action: async () => {
              // Implement recalculation logic
              return true
            },
            priority: 1,
            automatic: true
          },
          {
            id: 'reset-budget',
            label: '重置预算',
            description: '重置预算到安全状态',
            action: async () => {
              // Implement budget reset logic
              return true
            },
            priority: 2,
            automatic: false
          }
        )
        break

      case ErrorType.COMPONENT_ERROR:
        actions.push(
          {
            id: 'refresh-component',
            label: '刷新组件',
            description: '重新加载组件',
            action: async () => {
              // Implement component refresh logic
              return true
            },
            priority: 1,
            automatic: true
          }
        )
        break

      default:
        actions.push(
          {
            id: 'generic-retry',
            label: '重试操作',
            description: '重新尝试上次操作',
            action: async () => {
              // Generic retry logic
              return true
            },
            priority: 1,
            automatic: true
          }
        )
    }

    return actions.sort((a, b) => a.priority - b.priority)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const getErrorTitle = (errorType: ErrorType): string => {
    switch (errorType) {
      case ErrorType.STORAGE_ERROR:
        return '存储错误'
      case ErrorType.VALIDATION_ERROR:
        return '输入错误'
      case ErrorType.CALCULATION_ERROR:
        return '计算错误'
      case ErrorType.NETWORK_ERROR:
        return '网络错误'
      case ErrorType.COMPONENT_ERROR:
        return '组件错误'
      default:
        return '系统错误'
    }
  }

  const clearError = (errorId: string): void => {
    const index = errors.value.findIndex(error => error.id === errorId)
    if (index >= 0) {
      errors.value.splice(index, 1)
    }
  }

  const clearAllErrors = (): void => {
    errors.value = []
  }

  const getErrorsByType = (type: ErrorType): AppError[] => {
    return errors.value.filter(error => error.type === type)
  }

  const getErrorsBySeverity = (severity: ErrorSeverity): AppError[] => {
    return errors.value.filter(error => error.severity === severity)
  }

  const hasErrors = (): boolean => {
    return errors.value.length > 0
  }

  const hasCriticalErrors = (): boolean => {
    return errors.value.some(error => error.severity === ErrorSeverity.CRITICAL)
  }

  // ============================================================================
  // Error Reporting (Placeholder)
  // ============================================================================

  const reportError = async (error: AppError): Promise<void> => {
    // Placeholder for external error reporting service
    // This could integrate with services like Sentry, LogRocket, etc.
    console.info('Error reported to external service:', error.id)
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    errors: readonly(errors),
    isRecovering: readonly(isRecovering),

    // Error handling methods
    handleError,
    handleStorageError,
    handleValidationError,
    handleCalculationError,
    handleComponentError,

    // Recovery methods
    attemptErrorRecovery,

    // Utility methods
    createError,
    clearError,
    clearAllErrors,
    getErrorsByType,
    getErrorsBySeverity,
    hasErrors,
    hasCriticalErrors
  }
}

// ============================================================================
// Global Error Handler Instance
// ============================================================================

let globalErrorHandler: ReturnType<typeof useErrorHandler> | null = null

export function getGlobalErrorHandler() {
  if (!globalErrorHandler) {
    globalErrorHandler = useErrorHandler()
  }
  return globalErrorHandler
}

// ============================================================================
// Vue Error Handler Setup
// ============================================================================

export function setupGlobalErrorHandler(app: any) {
  const errorHandler = getGlobalErrorHandler()

  // Handle Vue component errors
  app.config.errorHandler = (error: Error, instance: any, info: string) => {
    const componentName = instance?.$options?.name || instance?.$options?.__name || 'Unknown'
    
    errorHandler.handleComponentError(componentName, error, {
      info,
      instance: instance?.$el?.tagName
    })
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, {
      showToast: true,
      logToConsole: true
    })
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), {
      showToast: true,
      logToConsole: true,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })
}