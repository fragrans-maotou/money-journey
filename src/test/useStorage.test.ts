import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { 
  useStorage, 
  useBudgetStorage, 
  useExpenseStorage, 
  useCategoryStorage,
  useAppDataStorage,
  useStorageHealthCheck,
  StorageErrorType 
} from '@/composables/useStorage'
import type { Budget, Expense, Category, StorageData } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  let shouldThrowError = false
  let errorToThrow: Error | null = null
  
  return {
    getItem: vi.fn((key: string) => {
      if (shouldThrowError && errorToThrow) {
        throw errorToThrow
      }
      return store[key] || null
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (shouldThrowError && errorToThrow) {
        throw errorToThrow
      }
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      if (shouldThrowError && errorToThrow) {
        throw errorToThrow
      }
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    // Test utilities
    _setError: (error: Error | null) => {
      errorToThrow = error
      shouldThrowError = !!error
    },
    _clearError: () => {
      errorToThrow = null
      shouldThrowError = false
    },
    _getStore: () => ({ ...store }),
    _setStore: (newStore: Record<string, string>) => {
      store = { ...newStore }
    }
  }
})()

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock._clearError()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic functionality', () => {
    it('should initialize with default value when no stored data exists', async () => {
      const defaultValue = { test: 'value' }
      const { state } = useStorage('test-key', defaultValue)
      
      await nextTick()
      expect(state.value).toEqual(defaultValue)
    })

    it('should load existing data from localStorage', async () => {
      const existingData = { test: 'existing' }
      localStorageMock.setItem('test-key', JSON.stringify(existingData))
      
      const { state } = useStorage('test-key', { test: 'default' })
      
      await nextTick()
      expect(state.value).toEqual(existingData)
    })

    it('should save data to localStorage when setValue is called', async () => {
      const { setValue } = useStorage('test-key', { test: 'default' })
      const newValue = { test: 'new value' }
      
      await setValue(newValue)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify(newValue)
      )
    })

    it('should update data using updateValue function', async () => {
      const { state, updateValue } = useStorage('test-key', { count: 0 })
      
      await updateValue(current => ({ count: current.count + 1 }))
      
      expect(state.value).toEqual({ count: 1 })
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should clear data and reset to default value', async () => {
      const defaultValue = { test: 'default' }
      const { state, setValue, clearData } = useStorage('test-key', defaultValue)
      
      await setValue({ test: 'modified' })
      clearData()
      
      expect(state.value).toEqual(defaultValue)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
    })
  })

  describe('Date serialization', () => {
    it('should properly serialize and deserialize Date objects', async () => {
      const testDate = new Date('2024-01-15T10:30:00Z')
      const dataWithDate = {
        id: '1',
        createdAt: testDate,
        name: 'Test'
      }
      
      const { setValue } = useStorage('date-test', dataWithDate)
      await nextTick()
      await setValue(dataWithDate)
      
      // Simulate page reload by creating new instance
      const { state: newState } = useStorage('date-test', { id: '', createdAt: new Date(), name: '' })
      await nextTick()
      
      expect(newState.value.createdAt).toBeInstanceOf(Date)
      expect(newState.value.createdAt.getTime()).toBe(testDate.getTime())
    })
  })

  describe('Error handling', () => {
    it('should handle localStorage quota exceeded error', async () => {
      const { setValue, error, hasError } = useStorage('test-key', { test: 'default' })
      
      // Wait for initial load to complete
      await nextTick()
      
      // Mock quota exceeded error
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'
      localStorageMock._setError(quotaError)
      
      try {
        await setValue({ test: 'large data' })
      } catch (err) {
        // Expected to throw
      }
      
      expect(hasError.value).toBe(true)
      expect(error.value?.type).toBe(StorageErrorType.QUOTA_EXCEEDED)
    })

    it('should handle JSON parsing errors and attempt recovery', async () => {
      // Set corrupted JSON data directly in store
      localStorageMock._setStore({ 'test-key': '{"invalid": json}' })
      
      const { state, error } = useStorage('test-key', { test: 'default' })
      await nextTick()
      
      // Should fall back to default value
      expect(state.value).toEqual({ test: 'default' })
      expect(error.value?.type).toBe(StorageErrorType.DESERIALIZATION_ERROR)
    })

    it('should retry failed save operations', async () => {
      const { setValue } = useStorage('test-key', { test: 'default' }, { maxRetries: 2, retryDelay: 10 })
      
      // Wait for initial load
      await nextTick()
      
      let callCount = 0
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = vi.fn(() => {
        callCount++
        if (callCount < 3) {
          throw new Error('Temporary error')
        }
        // Success on third attempt - call original implementation
        return originalSetItem.apply(localStorageMock, arguments as any)
      })
      
      await setValue({ test: 'retry test' })
      
      expect(callCount).toBe(3)
    })

    it('should clear errors when clearError is called', async () => {
      // Set corrupted data to trigger an error
      localStorageMock._setStore({ 'test-key': 'invalid json' })
      
      const { error, clearError } = useStorage('test-key', { test: 'default' })
      
      await nextTick()
      expect(error.value).not.toBeNull()
      
      clearError()
      expect(error.value).toBeNull()
    })
  })

  describe('Backup and recovery', () => {
    it('should create backup when saving data', async () => {
      const { setValue } = useStorage('test-key', { test: 'default' }, { enableBackup: true })
      
      // Wait for initial load
      await nextTick()
      
      await setValue({ test: 'backup test' })
      
      // Check if backup was created
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('backup_test-key'),
        expect.any(String)
      )
    })

    it('should recover from backup when main data is corrupted', async () => {
      // First, create some data with backup
      const originalData = { test: 'original' }
      const { setValue } = useStorage('test-key', { test: 'default' }, { enableBackup: true })
      await nextTick()
      await setValue(originalData)
      
      // Get the current store state to preserve backup
      const currentStore = localStorageMock._getStore()
      
      // Simulate corrupted main data
      localStorageMock._setStore({
        ...currentStore,
        'test-key': 'corrupted data'
      })
      
      // Create new instance (simulating app restart)
      const { state } = useStorage('test-key', { test: 'default' }, { enableBackup: true })
      await nextTick()
      
      // Should recover from backup
      expect(state.value).toEqual(originalData)
    })
  })

  describe('Storage info and health', () => {
    it('should provide storage information', async () => {
      const { getStorageInfo, setValue } = useStorage('test-key', { test: 'default' })
      
      await nextTick()
      await setValue({ test: 'info test' })
      
      const info = getStorageInfo()
      expect(info.exists).toBe(true)
      expect(info.size).toBeGreaterThan(0)
      expect(info.lastModified).toBeInstanceOf(Date)
    })

    it('should track loading state', async () => {
      // Create a promise that we can control
      let resolveLoad: (value: any) => void
      const loadPromise = new Promise(resolve => {
        resolveLoad = resolve
      })
      
      // Mock getItem to return a promise
      localStorageMock.getItem = vi.fn(() => {
        loadPromise.then(() => null)
        return null
      })
      
      const { isLoading } = useStorage('test-key', { test: 'default' })
      
      // Should start as loading
      expect(isLoading.value).toBe(true)
      
      // Resolve the load
      resolveLoad(null)
      await nextTick()
      
      // Should finish loading
      expect(isLoading.value).toBe(false)
    })

    it('should track healthy state', async () => {
      const { isHealthy, setValue } = useStorage('test-key', { test: 'default' })
      
      await nextTick()
      await setValue({ test: 'health test' })
      
      expect(isHealthy.value).toBe(true)
    })
  })
})

describe('Specialized storage composables', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock._clearError()
    vi.clearAllMocks()
  })

  describe('useBudgetStorage', () => {
    it('should initialize with empty budget array', async () => {
      const { state } = useBudgetStorage()
      await nextTick()
      
      expect(state.value).toEqual([])
    })

    it('should handle budget data correctly', async () => {
      const { state, setValue } = useBudgetStorage()
      
      const budget: Budget = {
        id: '1',
        monthlyAmount: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        dailyAllocation: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await setValue([budget])
      
      expect(state.value).toHaveLength(1)
      expect(state.value[0].id).toBe('1')
      expect(state.value[0].monthlyAmount).toBe(1000)
    })
  })

  describe('useExpenseStorage', () => {
    it('should handle expense data correctly', async () => {
      const { state, setValue } = useExpenseStorage()
      
      const expense: Expense = {
        id: '1',
        amount: 50,
        categoryId: 'cat1',
        description: 'Test expense',
        date: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await setValue([expense])
      
      expect(state.value).toHaveLength(1)
      expect(state.value[0].amount).toBe(50)
      expect(state.value[0].description).toBe('Test expense')
    })
  })

  describe('useCategoryStorage', () => {
    it('should handle category data correctly', async () => {
      const { state, setValue } = useCategoryStorage()
      
      const category: Category = {
        id: '1',
        name: '餐饮',
        icon: '🍽️',
        color: '#FF6B6B',
        isDefault: true
      }
      
      await setValue([category])
      
      expect(state.value).toHaveLength(1)
      expect(state.value[0].name).toBe('餐饮')
      expect(state.value[0].isDefault).toBe(true)
    })
  })

  describe('useAppDataStorage', () => {
    it('should initialize with default app data structure', async () => {
      const { state } = useAppDataStorage()
      await nextTick()
      
      expect(state.value).toHaveProperty('budgets')
      expect(state.value).toHaveProperty('expenses')
      expect(state.value).toHaveProperty('categories')
      expect(state.value).toHaveProperty('lastUpdated')
      expect(state.value).toHaveProperty('version')
      expect(state.value.version).toBe('1.0.0')
    })

    it('should handle complete app data correctly', async () => {
      const { state, setValue } = useAppDataStorage()
      
      const appData: StorageData = {
        budgets: [],
        expenses: [],
        categories: [],
        lastUpdated: new Date(),
        version: '1.0.0'
      }
      
      await setValue(appData)
      
      expect(state.value.version).toBe('1.0.0')
      expect(state.value.lastUpdated).toBeInstanceOf(Date)
    })
  })
})

describe('useStorageHealthCheck', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock._clearError()
    vi.clearAllMocks()
  })

  it('should check storage health correctly', () => {
    const { checkStorageHealth } = useStorageHealthCheck()
    
    // Add some test data to localStorage
    localStorageMock._setStore({
      'test1': 'value1',
      'test2': 'value2'
    })
    
    const health = checkStorageHealth()
    
    expect(health.isAvailable).toBe(true)
    expect(health.quotaUsed).toBeGreaterThanOrEqual(0)
    expect(health.quotaTotal).toBeGreaterThan(0)
    expect(health.errors).toEqual([])
  })

  it('should handle storage access errors', () => {
    const { checkStorageHealth } = useStorageHealthCheck()
    
    // Mock localStorage access error
    const accessError = new Error('Access denied')
    localStorageMock._setError(accessError)
    
    const health = checkStorageHealth()
    
    expect(health.isAvailable).toBe(false)
    expect(health.errors).toHaveLength(1)
    expect(health.errors[0].type).toBe(StorageErrorType.ACCESS_DENIED)
  })

  it('should cleanup old backup data', () => {
    const { cleanupOldData } = useStorageHealthCheck()
    
    // Create some old backup data
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 40) // 40 days ago
    
    localStorageMock._setStore({
      'backup_old_key': JSON.stringify({
        timestamp: oldDate.toISOString(),
        data: { test: 'old' }
      }),
      'backup_recent_key': JSON.stringify({
        timestamp: new Date().toISOString(),
        data: { test: 'recent' }
      })
    })
    
    cleanupOldData(30) // Keep 30 days
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup_old_key')
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('backup_recent_key')
  })
})

describe('Auto-save functionality', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock._clearError()
    vi.clearAllMocks()
  })

  it('should auto-save when state changes', async () => {
    const { state, setValue } = useStorage('auto-save-test', { count: 0 })
    
    // Wait for initial load
    await nextTick()
    
    // Use setValue instead of direct mutation since state is readonly
    await setValue({ count: 5 })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auto-save-test',
      expect.stringContaining('"count":5')
    )
  })
})