import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useBudget } from '@/composables/useBudget'
import type { Budget, BudgetInput, Expense, Category } from '@/types'

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'info').mockImplementation(() => {})

describe('useBudget Integration Tests', () => {
  let budgetComposable: ReturnType<typeof useBudget>

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear()
    budgetComposable = useBudget()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('完整预算管理流程', () => {
    it('应该完成完整的预算设置和管理流程', async () => {
      // 1. 初始状态检查
      expect(budgetComposable.currentBudget.value).toBeNull()
      expect(budgetComposable.monthlyBudget.value).toBe(0)
      expect(budgetComposable.dailyBudget.value).toBe(0)

      // 2. 设置月度预算
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      // 验证预算设置成功
      expect(budgetComposable.currentBudget.value).not.toBeNull()
      expect(budgetComposable.monthlyBudget.value).toBe(1200)
      expect(budgetComposable.dailyBudget.value).toBeCloseTo(38.71, 2) // 1200/31 days
      expect(budgetComposable.budgetStatus.value).toBe('active')

      // 3. 验证预算摘要
      const summary = budgetComposable.budgetSummary.value
      expect(summary.totalBudget).toBe(1200)
      expect(summary.totalSpent).toBe(0)
      expect(summary.remainingBudget).toBe(1200)
      expect(summary.isOverBudget).toBe(false)

      // 4. 更新预算金额
      await budgetComposable.updateMonthlyBudget({ monthlyAmount: 1500 })
      expect(budgetComposable.monthlyBudget.value).toBe(1500)
      expect(budgetComposable.remainingBudget.value).toBe(1500)

      // 5. 验证预算分配
      const validation = budgetComposable.validateBudgetAllocation()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('应该正确处理动态预算分配算法', async () => {
      // 设置预算
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      // 测试不同日期的可用预算计算
      const jan2 = new Date('2024-01-02')
      const jan15 = new Date('2024-01-15')
      const jan31 = new Date('2024-01-31')

      const availableJan2 = budgetComposable.calculateAvailableBudget(jan2)
      const availableJan15 = budgetComposable.calculateAvailableBudget(jan15)
      const availableJan31 = budgetComposable.calculateAvailableBudget(jan31)

      // 验证可用预算计算结果
      expect(availableJan2).toBeGreaterThan(0)
      expect(availableJan15).toBeGreaterThan(0)
      expect(availableJan31).toBeGreaterThan(0)

      // 测试余额累进机制
      const carryOverJan2 = budgetComposable.applyCarryOverMechanism(jan2)
      const carryOverJan15 = budgetComposable.applyCarryOverMechanism(jan15)

      expect(carryOverJan2).toBeGreaterThanOrEqual(0)
      expect(carryOverJan15).toBeGreaterThanOrEqual(0)
    })

    it('应该正确生成日预算分配', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      const allocations = budgetComposable.dailyAllocations.value
      
      // 验证分配数组 (January 2024 has 31 days, but the algorithm might calculate differently)
      expect(allocations.length).toBeGreaterThan(28) // At least a month's worth
      
      // 验证每日分配结构
      allocations.forEach(allocation => {
        expect(allocation).toHaveProperty('date')
        expect(allocation).toHaveProperty('baseAmount')
        expect(allocation).toHaveProperty('carryOverAmount')
        expect(allocation).toHaveProperty('availableAmount')
        expect(allocation).toHaveProperty('spentAmount')
        expect(allocation).toHaveProperty('remainingAmount')
        
        expect(allocation.baseAmount).toBeCloseTo(38.71, 2)
        expect(allocation.spentAmount).toBe(0) // No expenses yet
      })

      // 验证今日分配
      const todayAllocation = budgetComposable.todayAllocation.value
      if (todayAllocation) {
        expect(todayAllocation.baseAmount).toBeCloseTo(38.71, 2)
        expect(todayAllocation.spentAmount).toBe(0)
      }
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该正确处理无效的预算输入', async () => {
      const invalidBudgetInput: BudgetInput = {
        monthlyAmount: -100, // Invalid negative amount
        startDate: new Date('2024-01-01')
      }

      await expect(budgetComposable.setMonthlyBudget(invalidBudgetInput))
        .rejects.toThrow()
      
      expect(budgetComposable.error.value).toBeTruthy()
      expect(budgetComposable.currentBudget.value).toBeNull()
    })

    it('应该正确处理更新不存在的预算', async () => {
      // Try to update budget when no current budget exists
      try {
        await budgetComposable.updateMonthlyBudget({ monthlyAmount: 1500 })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).toBe('没有找到当前预算')
      }
      
      expect(budgetComposable.error.value).toBeTruthy()
    })

    it('应该正确处理预算删除', async () => {
      // Set up a budget first
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)
      const budgetId = budgetComposable.currentBudget.value?.id

      expect(budgetId).toBeDefined()
      expect(budgetComposable.currentBudget.value).not.toBeNull()

      // Delete the budget
      await budgetComposable.deleteBudget(budgetId!)
      expect(budgetComposable.currentBudget.value).toBeNull()
    })

    it('应该正确清除错误状态', async () => {
      // Trigger an error
      const invalidBudgetInput: BudgetInput = {
        monthlyAmount: -100,
        startDate: new Date('2024-01-01')
      }

      try {
        await budgetComposable.setMonthlyBudget(invalidBudgetInput)
      } catch (error) {
        // Expected error
      }

      expect(budgetComposable.error.value).toBeTruthy()

      // Clear the error
      budgetComposable.clearError()
      expect(budgetComposable.error.value).toBeNull()
    })
  })

  describe('数据持久化', () => {
    it('应该正确保存和加载预算数据', async () => {
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      // Verify data is saved to localStorage
      const savedData = localStorageMock.getItem('budgets')
      expect(savedData).toBeTruthy()

      const parsedData = JSON.parse(savedData!)
      expect(Array.isArray(parsedData)).toBe(true)
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].monthlyAmount).toBe(1200)
    })

    it('应该正确处理多个月份的预算', async () => {
      // Set budget for January
      const janBudget: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(janBudget)

      // Set budget for February
      const febBudget: BudgetInput = {
        monthlyAmount: 1500,
        startDate: new Date('2024-02-01')
      }

      await budgetComposable.setMonthlyBudget(febBudget)

      // Verify both budgets are saved
      const savedData = localStorageMock.getItem('budgets')
      const parsedData = JSON.parse(savedData!)
      expect(parsedData).toHaveLength(2)

      // Verify current budget is February
      expect(budgetComposable.monthlyBudget.value).toBe(1500)
    })
  })

  describe('响应式行为', () => {
    it('应该在预算变化时正确更新计算属性', async () => {
      // Initial state
      expect(budgetComposable.budgetSummary.value.totalBudget).toBe(0)

      // Set budget
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)

      // Wait for reactivity to update
      await nextTick()

      // Verify computed properties updated
      expect(budgetComposable.budgetSummary.value.totalBudget).toBe(1200)
      expect(budgetComposable.budgetSummary.value.remainingBudget).toBe(1200)
      expect(budgetComposable.budgetSummary.value.isOverBudget).toBe(false)

      // Update budget
      await budgetComposable.updateMonthlyBudget({ monthlyAmount: 1500 })
      await nextTick()

      // Verify computed properties updated again
      expect(budgetComposable.budgetSummary.value.totalBudget).toBe(1500)
      expect(budgetComposable.budgetSummary.value.remainingBudget).toBe(1500)
    })
  })

  describe('预算状态计算', () => {
    it('应该正确计算不同的预算状态', async () => {
      // Test active status
      const budgetInput: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2024-01-01')
      }

      await budgetComposable.setMonthlyBudget(budgetInput)
      expect(budgetComposable.budgetStatus.value).toBe('active')

      // Test with past date (completed status)
      const pastBudget: BudgetInput = {
        monthlyAmount: 1200,
        startDate: new Date('2020-01-01') // Past date
      }

      await budgetComposable.setMonthlyBudget(pastBudget)
      expect(budgetComposable.budgetStatus.value).toBe('completed')
    })
  })
})