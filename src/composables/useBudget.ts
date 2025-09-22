import { ref, computed, watch, readonly, type Ref, type ComputedRef } from 'vue'
import type {
  Budget,
  BudgetInput,
  BudgetUpdate,
  BudgetSummary,
  Expense,
  DailyAllocation,
  BudgetStatus
} from '@/types'
import { BudgetAllocationEngine } from '@/utils/BudgetAllocationEngine'
import { useBudgetStorage, useExpenseStorage } from './useStorage'
import { generateId } from '@/types/utils'
import { validateBudgetInput } from '@/types/validation'

/**
 * 预算管理 Composable
 * 提供预算设置、更新、状态管理和动态分配功能
 */
export function useBudget() {
  // ============================================================================
  // Dependencies
  // ============================================================================

  const budgetStorage = useBudgetStorage()
  const expenseStorage = useExpenseStorage()
  const allocationEngine = new BudgetAllocationEngine()

  // ============================================================================
  // Reactive State
  // ============================================================================

  const currentBudget = ref<Budget | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * 当前月度预算金额
   */
  const monthlyBudget = computed(() => {
    return currentBudget.value?.monthlyAmount || 0
  })

  /**
   * 日均基础预算
   */
  const dailyBudget = computed(() => {
    if (!currentBudget.value) return 0
    return allocationEngine.calculateDailyBaseBudget(currentBudget.value, new Date())
  })

  /**
   * 当前可用预算（基于动态分配算法）
   */
  const availableBudget = computed(() => {
    if (!currentBudget.value) return 0
    const today = new Date()
    return allocationEngine.calculateAvailableBudget(
      today,
      currentBudget.value,
      expenseStorage.state.value
    )
  })

  /**
   * 总消费金额
   */
  const totalSpent = computed(() => {
    if (!currentBudget.value) return 0

    const expenses = expenseStorage.state.value
    const budgetStart = currentBudget.value.startDate instanceof Date
      ? currentBudget.value.startDate
      : new Date(currentBudget.value.startDate)
    const budgetEnd = currentBudget.value.endDate instanceof Date
      ? currentBudget.value.endDate
      : new Date(currentBudget.value.endDate)

    return expenses
      .filter(expense => {
        const expenseDate = expense.date instanceof Date
          ? expense.date
          : new Date(expense.date)
        return expenseDate >= budgetStart && expenseDate <= budgetEnd
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
  })

  /**
   * 剩余预算
   */
  const remainingBudget = computed(() => {
    return monthlyBudget.value - totalSpent.value
  })

  /**
   * 预算状态
   */
  const budgetStatus = computed((): BudgetStatus => {
    if (!currentBudget.value) return 'active'

    const now = new Date()
    const endDate = currentBudget.value.endDate instanceof Date
      ? currentBudget.value.endDate
      : new Date(currentBudget.value.endDate)
    const isExpired = now > endDate
    const isOverBudget = totalSpent.value > monthlyBudget.value

    if (isExpired) return 'completed'
    if (isOverBudget) return 'exceeded'
    return 'active'
  })

  /**
   * 预算摘要信息
   */
  const budgetSummary = computed((): BudgetSummary => {
    if (!currentBudget.value) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        dailyAverage: 0,
        daysRemaining: 0,
        isOverBudget: false
      }
    }

    const now = new Date()
    const endDate = currentBudget.value.endDate instanceof Date
      ? currentBudget.value.endDate
      : new Date(currentBudget.value.endDate)
    const timeDiff = endDate.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)))

    return {
      totalBudget: monthlyBudget.value,
      totalSpent: totalSpent.value,
      remainingBudget: remainingBudget.value,
      dailyAverage: dailyBudget.value,
      daysRemaining,
      isOverBudget: totalSpent.value > monthlyBudget.value
    }
  })

  /**
   * 日预算分配数组
   */
  const dailyAllocations = computed((): DailyAllocation[] => {
    if (!currentBudget.value) return []

    const startDate = currentBudget.value.startDate instanceof Date
      ? currentBudget.value.startDate
      : new Date(currentBudget.value.startDate)
    const endDate = currentBudget.value.endDate instanceof Date
      ? currentBudget.value.endDate
      : new Date(currentBudget.value.endDate)

    return allocationEngine.generateDailyAllocations(
      startDate,
      endDate,
      dailyBudget.value,
      currentBudget.value,
      expenseStorage.state.value
    )
  })

  /**
   * 今日预算分配信息
   */
  const todayAllocation = computed((): DailyAllocation | null => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    return dailyAllocations.value.find(allocation => {
      const allocationDate = allocation.date instanceof Date
        ? allocation.date
        : new Date(allocation.date)
      const allocationStr = allocationDate.toISOString().split('T')[0]
      return allocationStr === todayStr
    }) || null
  })

  // ============================================================================
  // Core Methods
  // ============================================================================

  /**
   * 设置月度预算
   */
  const setMonthlyBudget = async (budgetInput: BudgetInput): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // 验证输入数据
      const validation = validateBudgetInput(budgetInput)
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // 计算预算日期范围（整月）
      const inputDate = new Date(budgetInput.startDate)
      const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1) // 月初
      const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0) // 月末

      // 创建新预算对象
      const newBudget: Budget = {
        id: generateId(),
        monthlyAmount: budgetInput.monthlyAmount,
        startDate,
        endDate,
        dailyAllocation: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 生成日预算分配
      newBudget.dailyAllocation = allocationEngine.generateDailyAllocations(
        startDate,
        endDate,
        budgetInput.monthlyAmount / getDaysInMonth(startDate),
        newBudget,
        expenseStorage.state.value
      )

      // 保存到存储
      const budgets = [...budgetStorage.state.value]

      // Ensure all existing budget dates are Date objects
      const normalizedBudgets = normalizeBudgets(budgets)

      // 如果存在当前月份的预算，替换它
      const existingIndex = normalizedBudgets.findIndex(budget =>
        isSameMonth(budget.startDate, startDate)
      )

      if (existingIndex >= 0) {
        normalizedBudgets[existingIndex] = newBudget
      } else {
        normalizedBudgets.push(newBudget)
      }

      await budgetStorage.setValue(normalizedBudgets)
      currentBudget.value = newBudget

    } catch (err) {
      error.value = err instanceof Error ? err.message : '设置预算失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新月度预算
   */
  const updateMonthlyBudget = async (budgetUpdate: BudgetUpdate): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      if (!currentBudget.value) {
        throw new Error('没有找到当前预算')
      }
      const updatedBudget: Budget = {
        ...currentBudget.value,
        ...budgetUpdate,
        updatedAt: new Date()
      }

      // 如果更新了预算金额，重新计算分配
      if (budgetUpdate.monthlyAmount !== undefined) {
        updatedBudget.dailyAllocation = allocationEngine.reallocateBudget(
          budgetUpdate.monthlyAmount,
          new Date(),
          currentBudget.value,
          expenseStorage.state.value
        )
      }

      // 更新存储
      const budgets = normalizeBudgets(budgetStorage.state.value).map(budget =>
        budget.id === updatedBudget.id ? updatedBudget : budget
      )

      await budgetStorage.setValue(budgets)
      currentBudget.value = updatedBudget

    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新预算失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 计算指定日期的可用预算
   */
  const calculateAvailableBudget = (date: Date): number => {
    if (!currentBudget.value) return 0

    return allocationEngine.calculateAvailableBudget(
      date,
      currentBudget.value,
      expenseStorage.state.value
    )
  }

  /**
   * 更新预算分配（当消费记录变化时调用）
   */
  const updateBudgetAllocation = async (): Promise<void> => {
    if (!currentBudget.value) return

    try {
      const startDate = currentBudget.value.startDate instanceof Date
        ? currentBudget.value.startDate
        : new Date(currentBudget.value.startDate)
      const endDate = currentBudget.value.endDate instanceof Date
        ? currentBudget.value.endDate
        : new Date(currentBudget.value.endDate)

      const updatedBudget: Budget = {
        ...currentBudget.value,
        startDate,
        endDate,
        dailyAllocation: allocationEngine.generateDailyAllocations(
          startDate,
          endDate,
          dailyBudget.value,
          currentBudget.value,
          expenseStorage.state.value
        ),
        updatedAt: new Date()
      }

      // 更新存储
      const budgets = normalizeBudgets(budgetStorage.state.value).map(budget =>
        budget.id === updatedBudget.id ? updatedBudget : budget
      )

      await budgetStorage.setValue(budgets)
      currentBudget.value = updatedBudget

    } catch (err) {
      console.error('Failed to update budget allocation:', err)
      error.value = '更新预算分配失败'
    }
  }

  /**
   * 应用余额累进机制
   */
  const applyCarryOverMechanism = (date: Date): number => {
    if (!currentBudget.value) return 0

    return allocationEngine.calculateAvailableBudget(
      date,
      currentBudget.value,
      expenseStorage.state.value
    )
  }

  /**
   * 获取当前月份的预算
   */
  const getCurrentMonthBudget = async (): Promise<Budget | null> => {
    try {
      const now = new Date()
      const budgets = budgetStorage.state.value

      // Ensure all budget dates are Date objects
      const normalizedBudgets = normalizeBudgets(budgets)

      const currentMonthBudget = normalizedBudgets.find(budget =>
        isSameMonth(budget.startDate, now)
      )

      currentBudget.value = currentMonthBudget || null
      return currentMonthBudget || null

    } catch (err) {
      error.value = '获取当前预算失败'
      return null
    }
  }

  /**
   * 删除预算
   */
  const deleteBudget = async (budgetId: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const budgets = budgetStorage.state.value.filter(budget => budget.id !== budgetId)
      await budgetStorage.setValue(budgets)

      if (currentBudget.value?.id === budgetId) {
        currentBudget.value = null
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除预算失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 验证预算分配
   */
  const validateBudgetAllocation = (): { isValid: boolean; errors: string[] } => {
    if (!currentBudget.value) {
      return { isValid: false, errors: ['没有找到当前预算'] }
    }

    return allocationEngine.validateBudgetAllocation(
      currentBudget.value,
      expenseStorage.state.value
    )
  }

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * 获取月份天数
   */
  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  /**
   * 检查两个日期是否在同一月份
   */
  function isSameMonth(date1: Date | string, date2: Date | string): boolean {
    // Ensure both dates are Date objects
    const d1 = date1 instanceof Date ? date1 : new Date(date1)
    const d2 = date2 instanceof Date ? date2 : new Date(date2)

    // Check if dates are valid
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false
    }

    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth()
  }

  /**
   * 规范化预算对象，确保所有日期字段都是 Date 对象
   */
  function normalizeBudget(budget: Budget): Budget {
    return {
      ...budget,
      startDate: budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate),
      endDate: budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate),
      createdAt: budget.createdAt instanceof Date ? budget.createdAt : new Date(budget.createdAt),
      updatedAt: budget.updatedAt instanceof Date ? budget.updatedAt : new Date(budget.updatedAt),
      dailyAllocation: budget.dailyAllocation?.map(allocation => ({
        ...allocation,
        date: allocation.date instanceof Date ? allocation.date : new Date(allocation.date)
      })) || []
    }
  }

  /**
   * 规范化预算数组，确保所有日期字段都是 Date 对象
   */
  function normalizeBudgets(budgets: Budget[]): Budget[] {
    return budgets.map(normalizeBudget)
  }

  // ============================================================================
  // Watchers
  // ============================================================================

  // 监听消费记录变化，自动更新预算分配
  watch(
    () => expenseStorage.state.value,
    () => {
      if (currentBudget.value) {
        updateBudgetAllocation()
      }
    },
    { deep: true }
  )

  // ============================================================================
  // Initialization
  // ============================================================================

  // 初始化时获取当前月份预算
  getCurrentMonthBudget()

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    currentBudget: readonly(currentBudget),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed Properties
    monthlyBudget,
    dailyBudget,
    availableBudget,
    totalSpent,
    remainingBudget,
    budgetStatus,
    budgetSummary,
    dailyAllocations,
    todayAllocation,

    // Methods
    setMonthlyBudget,
    updateMonthlyBudget,
    calculateAvailableBudget,
    updateBudgetAllocation,
    applyCarryOverMechanism,
    getCurrentMonthBudget,
    deleteBudget,
    validateBudgetAllocation,
    clearError
  }
}

/**
 * 预算管理 Composable 的类型定义
 */
export interface BudgetComposable {
  // 状态
  currentBudget: Readonly<Ref<Budget | null>>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>

  // 计算属性
  monthlyBudget: ComputedRef<number>
  dailyBudget: ComputedRef<number>
  availableBudget: ComputedRef<number>
  totalSpent: ComputedRef<number>
  remainingBudget: ComputedRef<number>
  budgetStatus: ComputedRef<BudgetStatus>
  budgetSummary: ComputedRef<BudgetSummary>
  dailyAllocations: ComputedRef<DailyAllocation[]>
  todayAllocation: ComputedRef<DailyAllocation | null>

  // 方法
  setMonthlyBudget: (budgetInput: BudgetInput) => Promise<void>
  updateMonthlyBudget: (budgetUpdate: BudgetUpdate) => Promise<void>
  calculateAvailableBudget: (date: Date) => number
  updateBudgetAllocation: () => Promise<void>
  applyCarryOverMechanism: (date: Date) => number
  getCurrentMonthBudget: () => Promise<Budget | null>
  deleteBudget: (budgetId: string) => Promise<void>
  validateBudgetAllocation: () => { isValid: boolean; errors: string[] }
  clearError: () => void
}