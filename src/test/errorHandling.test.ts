import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useToast } from '@/composables/useToast'
import { useLoadingState } from '@/composables/useLoadingState'
import { useDataRecovery } from '@/composables/useDataRecovery'
import { ErrorType, ErrorSeverity, ToastType } from '@/types/errors'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useErrorHandler', () => {
    it('should create and handle errors correctly', async () => {
      const { handleError, createError, errors } = useErrorHandler()

      const error = createError(
        ErrorType.VALIDATION_ERROR,
        'Test validation error',
        {
          severity: ErrorSeverity.LOW,
          component: 'TestComponent'
        }
      )

      await handleError(error, { showToast: false })

      expect(errors.value).toHaveLength(1)
      expect(errors.value[0].type).toBe(ErrorType.VALIDATION_ERROR)
      expect(errors.value[0].message).toBe('Test validation error')
      expect(errors.value[0].component).toBe('TestComponent')
    })

    it('should handle storage errors with recovery', async () => {
      const { handleStorageError, errors } = useErrorHandler()

      const storageError = new Error('QuotaExceededError')
      await handleStorageError(storageError, { operation: 'save' })

      expect(errors.value).toHaveLength(1)
      expect(errors.value[0].type).toBe(ErrorType.STORAGE_ERROR)
      expect(errors.value[0].recoverable).toBe(true)
    })

    it('should handle calculation errors', async () => {
      const { handleCalculationError, errors } = useErrorHandler()

      const calcError = new Error('Division by zero')
      await handleCalculationError(calcError, { budgetId: 'test-123' })

      expect(errors.value).toHaveLength(1)
      expect(errors.value[0].type).toBe(ErrorType.CALCULATION_ERROR)
      expect(errors.value[0].context?.budgetId).toBe('test-123')
    })

    it('should clear errors correctly', () => {
      const { createError, handleError, clearError, errors } = useErrorHandler()

      const error1 = createError(ErrorType.VALIDATION_ERROR, 'Error 1')
      const error2 = createError(ErrorType.STORAGE_ERROR, 'Error 2')

      handleError(error1, { showToast: false })
      handleError(error2, { showToast: false })

      expect(errors.value).toHaveLength(2)

      clearError(error1.id)
      expect(errors.value).toHaveLength(1)
      expect(errors.value[0].id).toBe(error2.id)
    })
  })

  describe('useToast', () => {
    it('should create and manage toast messages', () => {
      const { showToast, toasts, removeToast } = useToast()

      const toastId = showToast({
        type: ToastType.SUCCESS,
        message: 'Test success message',
        duration: 3000
      })

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe(ToastType.SUCCESS)
      expect(toasts.value[0].message).toBe('Test success message')
      expect(toasts.value[0].id).toBe(toastId)

      removeToast(toastId)
      expect(toasts.value).toHaveLength(0)
    })

    it('should handle different toast types', () => {
      const { showSuccess, showError, showWarning, showInfo, toasts } = useToast()

      showSuccess('Success message')
      showError('Error message')
      showWarning('Warning message')
      showInfo('Info message')

      expect(toasts.value).toHaveLength(4)
      expect(toasts.value[0].type).toBe(ToastType.SUCCESS)
      expect(toasts.value[1].type).toBe(ToastType.ERROR)
      expect(toasts.value[2].type).toBe(ToastType.WARNING)
      expect(toasts.value[3].type).toBe(ToastType.INFO)
    })

    it('should limit maximum number of toasts', () => {
      const { showToast, toasts } = useToast()

      // Create more than the maximum allowed toasts
      for (let i = 0; i < 10; i++) {
        showToast({
          type: ToastType.INFO,
          message: `Toast ${i}`,
          duration: 0 // Prevent auto-removal
        })
      }

      // Should be limited to maximum (5)
      expect(toasts.value.length).toBeLessThanOrEqual(5)
    })

    it('should handle loading toasts', () => {
      const { showLoadingToast, updateLoadingToast, hideLoadingToast, toasts } = useToast()

      const loadingId = showLoadingToast('Loading data...')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].persistent).toBe(true)

      updateLoadingToast(loadingId, 'Still loading...')
      expect(toasts.value[0].message).toBe('Still loading...')

      hideLoadingToast(loadingId, 'Load complete!')
      expect(toasts.value[0].type).toBe(ToastType.SUCCESS)
      expect(toasts.value[0].message).toBe('Load complete!')
    })
  })

  describe('useLoadingState', () => {
    it('should manage loading states correctly', () => {
      const { startLoading, stopLoading, isLoading, isLoadingKey } = useLoadingState()

      expect(isLoading.value).toBe(false)

      startLoading('test-operation', { message: 'Loading...' })
      expect(isLoading.value).toBe(true)
      expect(isLoadingKey('test-operation')).toBe(true)

      stopLoading('test-operation')
      expect(isLoading.value).toBe(false)
      expect(isLoadingKey('test-operation')).toBe(false)
    })

    it('should handle progress updates', () => {
      const { startLoading, updateProgress, getLoadingState } = useLoadingState()

      startLoading('progress-test', { showProgress: true })
      updateProgress('progress-test', 50, 'Half way there...')

      const state = getLoadingState('progress-test')
      expect(state?.progress).toBe(50)
      expect(state?.message).toBe('Half way there...')
    })

    it('should handle global loading state', () => {
      const { 
        setGlobalLoading, 
        isLoading, 
        loadingMessage, 
        updateGlobalProgress,
        loadingProgress 
      } = useLoadingState()

      setGlobalLoading(true, 'Global loading...')
      expect(isLoading.value).toBe(true)
      expect(loadingMessage.value).toBe('Global loading...')

      updateGlobalProgress(75, 'Almost done...')
      expect(loadingProgress.value).toBe(75)
      expect(loadingMessage.value).toBe('Almost done...')
    })

    it('should wrap async operations with loading', async () => {
      const { withLoading, isLoading } = useLoadingState()

      const asyncOperation = vi.fn().mockResolvedValue('success')

      expect(isLoading.value).toBe(false)

      const promise = withLoading('async-test', asyncOperation, {
        message: 'Processing...'
      })

      expect(isLoading.value).toBe(true)

      const result = await promise
      expect(result).toBe('success')
      expect(isLoading.value).toBe(false)
      expect(asyncOperation).toHaveBeenCalledOnce()
    })
  })

  describe('useDataRecovery', () => {
    it('should create and restore backups', async () => {
      const { createBackup, restoreFromBackup, getAvailableBackups } = useDataRecovery()

      const testData = {
        budgets: [],
        expenses: [],
        categories: [],
        lastUpdated: new Date(),
        version: '1.0.0'
      }

      // Mock localStorage for backup operations
      const backupStorage = new Map<string, string>()
      localStorageMock.setItem.mockImplementation((key, value) => {
        backupStorage.set(key, value)
      })
      localStorageMock.getItem.mockImplementation((key) => {
        return backupStorage.get(key) || null
      })

      const backupId = await createBackup(testData, 'Test backup')
      expect(backupId).toBeDefined()

      const backups = getAvailableBackups()
      expect(backups).toHaveLength(1)
      expect(backups[0].label).toBe('Test backup')

      const result = await restoreFromBackup(backupId)
      expect(result.success).toBe(true)
    })

    it('should validate backup data', () => {
      const { validateBackupData } = useDataRecovery()

      const validData = {
        budgets: [],
        expenses: [],
        categories: []
      }

      const invalidData = {
        budgets: 'not an array',
        expenses: null
      }

      const validResult = validateBackupData(validData)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      const invalidResult = validateBackupData(invalidData)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })

    it('should handle data export and import', async () => {
      const { exportData, importData } = useDataRecovery()

      // Mock current data
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'budgets':
            return JSON.stringify([])
          case 'expenses':
            return JSON.stringify([])
          case 'categories':
            return JSON.stringify([])
          default:
            return null
        }
      })

      const exportedData = exportData()
      expect(exportedData).toBeDefined()
      expect(() => JSON.parse(exportedData)).not.toThrow()

      const result = await importData(exportedData)
      expect(result.success).toBe(true)
    })

    it('should attempt auto recovery', async () => {
      const { attemptAutoRecovery } = useDataRecovery()

      // Mock no available backups
      localStorageMock.getItem.mockReturnValue(null)

      const result = await attemptAutoRecovery()
      expect(result.success).toBe(true)
      expect(result.message).toContain('初始化')
    })
  })

  describe('Integration Tests', () => {
    it('should handle error with toast and recovery', async () => {
      const { handleError, createError } = useErrorHandler()
      const { toasts } = useToast()

      const error = createError(
        ErrorType.STORAGE_ERROR,
        'Storage quota exceeded',
        {
          severity: ErrorSeverity.HIGH,
          recoverable: true
        }
      )

      await handleError(error, {
        showToast: true,
        attemptRecovery: false // Disable for test
      })

      // Should create a toast notification
      expect(toasts.value.length).toBeGreaterThan(0)
      expect(toasts.value[0].type).toBe(ToastType.ERROR)
    })

    it('should handle loading with error recovery', async () => {
      const { withLoading } = useLoadingState()
      const { handleError } = useErrorHandler()

      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      try {
        await withLoading('failing-op', failingOperation)
      } catch (error) {
        await handleError(error as Error, { showToast: false })
      }

      expect(failingOperation).toHaveBeenCalledOnce()
    })
  })
})

describe('Error Handling Components', () => {
  // Component tests would go here if we were testing Vue components
  // For now, we focus on the composables and business logic
  
  it('should be properly integrated', () => {
    // This test ensures all the composables can be imported and used together
    const errorHandler = useErrorHandler()
    const toast = useToast()
    const loading = useLoadingState()
    const recovery = useDataRecovery()

    expect(errorHandler).toBeDefined()
    expect(toast).toBeDefined()
    expect(loading).toBeDefined()
    expect(recovery).toBeDefined()
  })
})