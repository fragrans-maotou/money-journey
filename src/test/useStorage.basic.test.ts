import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useStorage, StorageErrorType } from '@/composables/useStorage'

// Simple localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _getStore: () => ({ ...store }),
    _setStore: (newStore: Record<string, string>) => {
      store = { ...newStore }
    }
  }
}

const localStorageMock = createLocalStorageMock()

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('useStorage - Basic Functionality', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default value when no stored data exists', async () => {
    const defaultValue = { test: 'value' }
    const { state } = useStorage('test-key', defaultValue)
    
    await nextTick()
    expect(state.value).toEqual(defaultValue)
  })

  it('should load existing data from localStorage', async () => {
    const existingData = { test: 'existing' }
    localStorageMock._setStore({ 'test-key': JSON.stringify(existingData) })
    
    const { state } = useStorage('test-key', { test: 'default' })
    
    await nextTick()
    expect(state.value).toEqual(existingData)
  })

  it('should save data to localStorage when setValue is called', async () => {
    const { setValue } = useStorage('test-key', { test: 'default' })
    const newValue = { test: 'new value' }
    
    await nextTick() // Wait for initial load
    await setValue(newValue)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key', 
      JSON.stringify(newValue)
    )
  })

  it('should update data using updateValue function', async () => {
    const { state, updateValue } = useStorage('test-key', { count: 0 })
    
    await nextTick() // Wait for initial load
    await updateValue(current => ({ count: current.count + 1 }))
    
    expect(state.value).toEqual({ count: 1 })
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should clear data and reset to default value', async () => {
    const defaultValue = { test: 'default' }
    const { state, setValue, clearData } = useStorage('test-key', defaultValue)
    
    await nextTick() // Wait for initial load
    await setValue({ test: 'modified' })
    clearData()
    
    expect(state.value).toEqual(defaultValue)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

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
    expect(newState.value.createdAt.toISOString()).toBe(testDate.toISOString())
  })

  it('should handle JSON parsing errors gracefully', async () => {
    // Set corrupted JSON data directly in store
    localStorageMock._setStore({ 'test-key': '{"invalid": json}' })
    
    const { state, error } = useStorage('test-key', { test: 'default' })
    await nextTick()
    
    // Should fall back to default value
    expect(state.value).toEqual({ test: 'default' })
    expect(error.value?.type).toBe(StorageErrorType.DESERIALIZATION_ERROR)
  })

  it('should provide storage information', async () => {
    const { getStorageInfo, setValue } = useStorage('test-key', { test: 'default' })
    
    await nextTick()
    await setValue({ test: 'info test' })
    
    const info = getStorageInfo()
    expect(info.exists).toBe(true)
    expect(info.size).toBeGreaterThan(0)
    expect(info.lastModified).toBeInstanceOf(Date)
  })

  it('should track healthy state after successful operations', async () => {
    const { isHealthy, setValue } = useStorage('test-key', { test: 'default' })
    
    await nextTick()
    await setValue({ test: 'health test' })
    
    expect(isHealthy.value).toBe(true)
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

describe('useStorage - Specialized Storage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should work with complex data structures', async () => {
    const complexData = {
      budgets: [
        {
          id: '1',
          monthlyAmount: 1000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          dailyAllocation: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      expenses: [
        {
          id: '1',
          amount: 50,
          categoryId: 'cat1',
          description: 'Test expense',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      categories: [
        {
          id: '1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF6B6B',
          isDefault: true
        }
      ],
      lastUpdated: new Date(),
      version: '1.0.0'
    }
    
    const { state, setValue } = useStorage('complex-data', complexData)
    
    await nextTick()
    await setValue(complexData)
    
    // Create new instance to test persistence
    const { state: newState } = useStorage('complex-data', {
      budgets: [],
      expenses: [],
      categories: [],
      lastUpdated: new Date(),
      version: '1.0.0'
    })
    
    await nextTick()
    
    expect(newState.value.budgets).toHaveLength(1)
    expect(newState.value.expenses).toHaveLength(1)
    expect(newState.value.categories).toHaveLength(1)
    expect(newState.value.budgets[0].startDate).toBeInstanceOf(Date)
    expect(newState.value.expenses[0].date).toBeInstanceOf(Date)
    expect(newState.value.lastUpdated).toBeInstanceOf(Date)
  })
})