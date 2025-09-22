import { ref, watch, computed, readonly } from 'vue'
import type { StorageData, Budget, Expense, Category } from '@/types'

// ============================================================================
// Storage Error Types
// ============================================================================

export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CORRUPTION_ERROR = 'CORRUPTION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StorageError {
  type: StorageErrorType
  message: string
  key?: string
  originalError?: Error
  timestamp: Date
}

export interface StorageOptions {
  enableBackup?: boolean
  maxRetries?: number
  retryDelay?: number
  compressionEnabled?: boolean
  encryptionEnabled?: boolean
}

// ============================================================================
// Storage Recovery Service
// ============================================================================

class DataRecoveryService {
  private static readonly BACKUP_PREFIX = 'backup_'
  private static readonly RECOVERY_KEY = 'recovery_info'

  static createBackup(key: string, data: any): void {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${key}`
      const backupData = {
        originalKey: key,
        data,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      localStorage.setItem(backupKey, JSON.stringify(backupData))
    } catch (error) {
      console.warn('Failed to create backup:', error)
    }
  }

  static getBackup(key: string): any | null {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${key}`
      const backupStr = localStorage.getItem(backupKey)
      if (!backupStr) return null

      const backup = JSON.parse(backupStr)
      return backup.data
    } catch (error) {
      console.warn('Failed to retrieve backup:', error)
      return null
    }
  }

  static attemptRecovery(key: string): any | null {
    // Try to get backup data
    const backupData = this.getBackup(key)
    if (backupData) {
      console.info(`Recovered data from backup for key: ${key}`)
      return backupData
    }

    // Try to recover from corrupted data
    try {
      const corruptedData = localStorage.getItem(key)
      if (corruptedData) {
        // Attempt to fix common JSON issues
        const fixedData = this.fixCorruptedJson(corruptedData)
        if (fixedData) {
          console.info(`Recovered corrupted data for key: ${key}`)
          return JSON.parse(fixedData)
        }
      }
    } catch (error) {
      console.warn('Failed to recover corrupted data:', error)
    }

    return null
  }

  private static fixCorruptedJson(jsonStr: string): string | null {
    try {
      // Try to fix common issues like trailing commas, missing quotes, etc.
      let fixed = jsonStr
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to keys
        .trim()

      // Validate the fixed JSON
      JSON.parse(fixed)
      return fixed
    } catch (error) {
      return null
    }
  }

  static recordRecoveryAttempt(key: string, success: boolean, error?: StorageError): void {
    try {
      const recoveryInfo = {
        key,
        success,
        error: error ? {
          type: error.type,
          message: error.message,
          timestamp: error.timestamp
        } : null,
        timestamp: new Date().toISOString()
      }

      const existingInfo = localStorage.getItem(this.RECOVERY_KEY)
      const recoveryLog = existingInfo ? JSON.parse(existingInfo) : []
      recoveryLog.push(recoveryInfo)

      // Keep only last 10 recovery attempts
      if (recoveryLog.length > 10) {
        recoveryLog.splice(0, recoveryLog.length - 10)
      }

      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(recoveryLog))
    } catch (error) {
      console.warn('Failed to record recovery attempt:', error)
    }
  }
}

// ============================================================================
// Data Serialization Service
// ============================================================================

class SerializationService {
  static serialize(data: any): string {
    try {
      return JSON.stringify(data, this.dateReplacer)
    } catch (error) {
      throw new StorageError({
        type: StorageErrorType.SERIALIZATION_ERROR,
        message: 'Failed to serialize data',
        originalError: error as Error,
        timestamp: new Date()
      })
    }
  }

  static deserialize<T>(jsonStr: string): T {
    try {
      return JSON.parse(jsonStr, this.dateReviver)
    } catch (error) {
      throw new StorageError({
        type: StorageErrorType.DESERIALIZATION_ERROR,
        message: 'Failed to deserialize data',
        originalError: error as Error,
        timestamp: new Date()
      })
    }
  }

  private static dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  }

  private static dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  }
}

// ============================================================================
// Storage Error Class
// ============================================================================

class StorageError extends Error {
  public readonly type: StorageErrorType
  public readonly key?: string
  public readonly originalError?: Error
  public readonly timestamp: Date

  constructor(options: {
    type: StorageErrorType
    message: string
    key?: string
    originalError?: Error
    timestamp: Date
  }) {
    super(options.message)
    this.name = 'StorageError'
    this.type = options.type
    this.key = options.key
    this.originalError = options.originalError
    this.timestamp = options.timestamp
  }
}

// ============================================================================
// Enhanced Storage Composable
// ============================================================================

/**
 * Enhanced composable for localStorage operations with comprehensive error handling,
 * data recovery, and serialization support
 */
export function useStorage<T>(
  key: string, 
  defaultValue: T, 
  options: StorageOptions = {}
) {
  const {
    enableBackup = true,
    maxRetries = 3,
    retryDelay = 1000,
    compressionEnabled = false,
    encryptionEnabled = false
  } = options

  // Reactive state
  const state = ref<T>(defaultValue)
  const isLoading = ref(false)
  const error = ref<StorageError | null>(null)
  const lastSaved = ref<Date | null>(null)

  // Computed properties
  const hasError = computed(() => error.value !== null)
  const isHealthy = computed(() => !hasError.value && lastSaved.value !== null)

  // ============================================================================
  // Core Storage Operations
  // ============================================================================

  const loadData = async (): Promise<T> => {
    isLoading.value = true
    error.value = null

    try {
      const storedValue = localStorage.getItem(key)
      
      if (!storedValue) {
        // No stored data, use default value
        state.value = defaultValue
        return defaultValue
      }

      // Attempt to deserialize stored data
      const deserializedData = SerializationService.deserialize<T>(storedValue)
      state.value = deserializedData
      return deserializedData

    } catch (err) {
      console.warn(`Failed to load data for key "${key}":`, err)
      
      // Attempt data recovery
      const recoveredData = DataRecoveryService.attemptRecovery(key)
      if (recoveredData) {
        state.value = recoveredData
        DataRecoveryService.recordRecoveryAttempt(key, true)
        return recoveredData
      }

      // Recovery failed, use default value and record error
      const storageError = err instanceof StorageError ? err : new StorageError({
        type: StorageErrorType.DESERIALIZATION_ERROR,
        message: `Failed to load data for key "${key}"`,
        key,
        originalError: err as Error,
        timestamp: new Date()
      })

      error.value = storageError
      DataRecoveryService.recordRecoveryAttempt(key, false, storageError)
      state.value = defaultValue
      return defaultValue

    } finally {
      isLoading.value = false
    }
  }

  const saveData = async (data: T, retryCount = 0): Promise<void> => {
    try {
      // Create backup before saving if enabled
      if (enableBackup) {
        DataRecoveryService.createBackup(key, state.value)
      }

      // Serialize and save data
      const serializedData = SerializationService.serialize(data)
      localStorage.setItem(key, serializedData)
      
      // Update state and metadata
      state.value = data
      lastSaved.value = new Date()
      error.value = null

    } catch (err) {
      const originalError = err as Error
      let storageError: StorageError

      // Determine error type based on the original error
      if (originalError.name === 'QuotaExceededError' || 
          originalError.message.includes('quota')) {
        storageError = new StorageError({
          type: StorageErrorType.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded. Please clear some data.',
          key,
          originalError,
          timestamp: new Date()
        })
      } else if (originalError.message.includes('access')) {
        storageError = new StorageError({
          type: StorageErrorType.ACCESS_DENIED,
          message: 'Access to localStorage denied',
          key,
          originalError,
          timestamp: new Date()
        })
      } else if (err instanceof StorageError) {
        storageError = err
      } else {
        storageError = new StorageError({
          type: StorageErrorType.UNKNOWN_ERROR,
          message: `Failed to save data for key "${key}"`,
          key,
          originalError,
          timestamp: new Date()
        })
      }

      // Retry logic
      if (retryCount < maxRetries) {
        console.warn(`Save attempt ${retryCount + 1} failed, retrying...`, storageError)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return saveData(data, retryCount + 1)
      }

      // All retries failed
      error.value = storageError
      throw storageError
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  const setValue = async (value: T): Promise<void> => {
    await saveData(value)
  }

  const updateValue = async (updater: (current: T) => T): Promise<void> => {
    const newValue = updater(state.value)
    await saveData(newValue)
  }

  const clearData = (): void => {
    try {
      localStorage.removeItem(key)
      state.value = defaultValue
      lastSaved.value = null
      error.value = null
    } catch (err) {
      error.value = new StorageError({
        type: StorageErrorType.ACCESS_DENIED,
        message: `Failed to clear data for key "${key}"`,
        key,
        originalError: err as Error,
        timestamp: new Date()
      })
    }
  }

  const refreshData = async (): Promise<void> => {
    await loadData()
  }

  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem(key)
      return {
        exists: data !== null,
        size: data ? new Blob([data]).size : 0,
        lastModified: lastSaved.value,
        hasBackup: DataRecoveryService.getBackup(key) !== null
      }
    } catch (err) {
      return {
        exists: false,
        size: 0,
        lastModified: null,
        hasBackup: false,
        error: err
      }
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  // ============================================================================
  // Initialization and Watchers
  // ============================================================================

  // Initialize data on composable creation
  loadData()

  // Watch for changes and auto-save
  watch(state, async (newValue) => {
    if (newValue !== defaultValue) {
      try {
        await saveData(newValue)
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }
  }, { deep: true })

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    state: readonly(state),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastSaved: readonly(lastSaved),
    
    // Computed
    hasError,
    isHealthy,
    
    // Methods
    setValue,
    updateValue,
    clearData,
    refreshData,
    getStorageInfo,
    clearError,
    
    // Advanced methods
    loadData,
    saveData: (data: T) => saveData(data)
  }
}

// ============================================================================
// Specialized Storage Composables
// ============================================================================

/**
 * Specialized composable for budget data storage
 */
export function useBudgetStorage() {
  return useStorage<Budget[]>('budgets', [], {
    enableBackup: true,
    maxRetries: 3
  })
}

/**
 * Specialized composable for expense data storage
 */
export function useExpenseStorage() {
  return useStorage<Expense[]>('expenses', [], {
    enableBackup: true,
    maxRetries: 3
  })
}

/**
 * Specialized composable for category data storage
 */
export function useCategoryStorage() {
  return useStorage<Category[]>('categories', [], {
    enableBackup: true,
    maxRetries: 3
  })
}

/**
 * Specialized composable for complete app data storage
 */
export function useAppDataStorage() {
  const currentVersion = '1.0.0'
  
  const defaultData: StorageData = {
    budgets: [],
    expenses: [],
    categories: [],
    lastUpdated: new Date(),
    version: currentVersion
  }

  return useStorage<StorageData>('app_data', defaultData, {
    enableBackup: true,
    maxRetries: 5,
    retryDelay: 2000
  })
}

// ============================================================================
// Storage Health Check Utility
// ============================================================================

export function useStorageHealthCheck() {
  const checkStorageHealth = (): {
    isAvailable: boolean
    quotaUsed: number
    quotaTotal: number
    errors: StorageError[]
  } => {
    const result = {
      isAvailable: false,
      quotaUsed: 0,
      quotaTotal: 0,
      errors: [] as StorageError[]
    }

    try {
      // Test localStorage availability
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      result.isAvailable = true

      // Estimate storage usage (approximate)
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      result.quotaUsed = totalSize

      // Estimate total quota (this is approximate)
      result.quotaTotal = 5 * 1024 * 1024 // Assume 5MB default

    } catch (error) {
      result.errors.push(new StorageError({
        type: StorageErrorType.ACCESS_DENIED,
        message: 'localStorage is not available',
        originalError: error as Error,
        timestamp: new Date()
      }))
    }

    return result
  }

  const cleanupOldData = (daysToKeep: number = 30): void => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    try {
      // Clean up old backup data
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('backup_')) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key) || '{}')
            const backupDate = new Date(backupData.timestamp)
            if (backupDate < cutoffDate) {
              keysToRemove.push(key)
            }
          } catch (error) {
            // If we can't parse the backup, it's probably corrupted, remove it
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.info(`Cleaned up ${keysToRemove.length} old backup entries`)

    } catch (error) {
      console.warn('Failed to cleanup old data:', error)
    }
  }

  return {
    checkStorageHealth,
    cleanupOldData
  }
}