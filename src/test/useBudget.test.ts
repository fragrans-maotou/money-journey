import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useBudget } from '@/composables/useBudget'
import type { Budget, BudgetInput, Expense } from '@/types'

// Mock the storage composables
vi.mock('@/composables/useStorage', () => ({
  useBudgetStorage: () => ({
    state: { value: [] },
    setValue: vi.fn().mockResolvedValue(undefined)
  }),
  useExpenseStorage: () => ({
    state: { value: [] },
    setValue: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock the BudgetAllocationEngine
vi.mock('@/utils/BudgetAllocationEngine', () => ({
  BudgetAllocationEngine: vi.fn().mockImplementation(() => ({
    calculateDailyBaseBudget: vi.fn().mockReturnValue(40),
    calculateAvailableBudget: vi.fn().mockReturnValue(50),
    generateDailyAllocations: vi.fn().mockReturnValue([]),
    reallocateBudget: vi.fn().mockReturnValue([]),
    validateBudgetAllocation: vi.fn().mockReturnValue({ isValid: true, errors: [] })
  }))
}))

// Mock utility functions
vi.mock('@/types/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-id-123')
}))

// Mock validation functions
vi.mock('@/types/validation', () => ({
  validateBudgetInput: vi.fn().mockReturnValue({ isValid: true, errors: [] })
}))

describe('useBudget', () => {
  let budgetComposable: ReturnType<typeof useBudget>

  beforeEach(() => {
    vi.clearAllMocks()
    budgetComposable = useBudget()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为默认状态', () => {
      expect(budgetComposable.currentBudget.value).toBeNull()
      expect(budgetComposable.isLoading.value).toBe(false)
      expect(budgetComposable.error.value).toBeNull()
      expect(budgetComposable.monthlyBudget.value).toBe(0)
      expect(budgetComposable.dailyBudget.value).toBe(0)
      expect(budgetComposable.totalSpent.value).toBe(0)
    })

    it('应该正确计算预算摘要', () => {
      const summary = budgetComposable.budgetSummary.value
      expect(summary.totalBudget).toBe(0)
      expect(summary.totalSpent).toBe(0)
      expect(summary.remainingBudget).toBe(0)
      expect(summary.dailyAverage).toBe(0)
      expect(summary.daysRemaining).toBe(0)
      expect(summary.isOverBudget).toBe(false)
    })
  })

  describe('setMonthlyBudget', () => {
    it('应该成功设置月度预算', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      expect(budgetComposable.isLoading.value).toBe(false)
      expect(budgetComposable.error.value).toBeNull()
      expect(budgetComposable.currentBudget.value).not.toBeNull()
      expect(budgetComposable.monthlyBudget.value).toBe(1200)
    })

    it('应该在验证失败时抛出错误', async () => {
      // Mock validation to fail
      const { validateBudgetInput } = await import('@/types/validation')
      vi.mocked(validateBudgetInput).mockReturnValue({
        isValid: false,
        errors: [{ field: 'monthlyAmount', message: '月度预算金额必须大于0', code: 'INVALID_AMOUNT' }]
      })

      const budgetInput: BudgetInput = {
        monthlyAmount: -100,
        startDate: new Date('2024-01-01')
      }

      await expect(budgetComposable.setMonthlyBudget(budgetInput)).rejects.toThrow('月度预算金额必须大于0')
      expect(budgetComposable.error.value).toBe('月度预算金额必须大于0')
    })

    it('应该正确处理加载状态', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      const promise = budgetComposable.setMonthlyBudget(budgetInput)
      expect(budgetComposable.isLoading.value).toBe(true)

      await promise
      expect(budgetComposable.isLoading.value).toBe(false)
    })
  })

  describe('updateMonthlyBudget', () => {
    beforeEach(async () => {
      // Set up a current budget first
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)
    })

    it('应该成功更新月度预算', async () => {
      await budgetComposable.updateMonthlyBudget({ monthlyAmount: 1500 })

      expect(budgetComposable.error.value).toBeNull()
      expect(budgetComposable.monthlyBudget.value).toBe(1500)
    })

    it('应该在没有当前预算时抛出错误', async () => {
      budgetComposable.currentBudget.value = null

      await expect(budgetComposable.updateMonthlyBudget({ monthlyAmount: 1500 }))
        .rejects.toThrow('没有找到当前预算')
    })
  })

  describe('calculateAvailableBudget', () => {
    it('应该在没有当前预算时返回0', () => {
      const result = budgetComposable.calculateAvailableBudget(new Date())
      expect(result).toBe(0)
    })

    it('应该调用分配引擎计算可用预算', async () => {
      // Set up a current budget
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)

      const testDate = new Date('2024-01-15')
      const result = budgetComposable.calculateAvailableBudget(testDate)

      expect(result).toBe(50) // Mocked return value
    })
  })

  describe('budgetStatus', () => {
    it('应该在没有预算时返回active', () => {
      expect(budgetComposable.budgetStatus.value).toBe('active')
    })

    it('应该正确计算预算状态', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)

      expect(budgetComposable.budgetStatus.value).toBe('active')
    })
  })

  describe('deleteBudget', () => {
    it('应该成功删除预算', async () => {
      // Set up a current budget first
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)
      
      const budgetId = budgetComposable.currentBudget.value?.id
      expect(budgetId).toBeDefined()

      await budgetComposable.deleteBudget(budgetId!)
      expect(budgetComposable.currentBudget.value).toBeNull()
    })
  })

  describe('validateBudgetAllocation', () => {
    it('应该在没有当前预算时返回无效', () => {
      const result = budgetComposable.validateBudgetAllocation()
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('没有找到当前预算')
    })

    it('应该调用分配引擎验证预算', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)

      const result = budgetComposable.validateBudgetAllocation()
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('clearError', () => {
    it('应该清除错误状态', async () => {
      // Trigger an error first
      const { validateBudgetInput } = await import('@/types/validation')
      vi.mocked(validateBudgetInput).mockReturnValue({
        isValid: false,
        errors: [{ field: 'monthlyAmount', message: '测试错误', code: 'TEST_ERROR' }]
      })

      const budgetInput: BudgetInput = {
        monthlyAmount: -100,
        startDate: new Date('2024-01-01')
      }

      try {
        await budgetComposable.setMonthlyBudget(budgetInput)
      } catch (error) {
        // Expected error
      }

      expect(budgetComposable.error.value).toBeTruthy()

      budgetComposable.clearError()
      expect(budgetComposable.error.value).toBeNull()
    })
  })

  describe('响应式更新', () => {
    it('应该在消费记录变化时更新预算分配', async () => {
      // This test would require more complex mocking of the storage watchers
      // For now, we'll test that the method exists and can be called
      expect(typeof budgetComposable.updateBudgetAllocation).toBe('function')
      
      // Test that it doesn't throw when called without a current budget
      await expect(budgetComposable.updateBudgetAllocation()).resolves.toBeUndefined()
    })
  })

  describe('计算属性', () => {
    beforeEach(async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }
      await budgetComposable.setMonthlyBudget(budgetInput)
    })

    it('应该正确计算剩余预算', () => {
      expect(budgetComposable.remainingBudget.value).toBe(1200) // No expenses mocked
    })

    it('应该正确计算今日分配', () => {
      // Since we're mocking the allocation engine to return empty array,
      // todayAllocation should be null
      expect(budgetComposable.todayAllocation.value).toBeNull()
    })

    it('应该正确计算日预算分配', () => {
      expect(Array.isArray(budgetComposable.dailyAllocations.value)).toBe(true)
    })
  })
})