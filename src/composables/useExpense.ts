import { ref, computed, watch, readonly, type Ref, type ComputedRef } from 'vue'
import type { 
  Expense, 
  ExpenseInput, 
  ExpenseUpdate, 
  ExpenseFilter,
  Category,
  CategoryInput,
  CategoryUpdate
} from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { useExpenseStorage, useCategoryStorage } from './useStorage'
import { generateId } from '@/types/utils'
import { validateExpenseInput, validateCategoryInput } from '@/types/validation'

/**
 * 消费记录管理 Composable
 * 提供消费记录的 CRUD 操作、分类管理、筛选查询和预算集成功能
 */
export function useExpense() {
  // ============================================================================
  // Dependencies
  // ============================================================================
  
  const expenseStorage = useExpenseStorage()
  const categoryStorage = useCategoryStorage()

  // ============================================================================
  // Reactive State
  // ============================================================================
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentFilter = ref<ExpenseFilter>({})

  // ============================================================================
  // Computed Properties
  // ============================================================================
  
  /**
   * 所有消费记录
   */
  const expenses = computed(() => expenseStorage.state.value)

  /**
   * 所有消费分类
   */
  const categories = computed(() => categoryStorage.state.value)

  /**
   * 筛选后的消费记录
   */
  const filteredExpenses = computed(() => {
    let filtered = expenses.value

    const filter = currentFilter.value

    // 按分类筛选
    if (filter.categoryId) {
      filtered = filtered.filter(expense => expense.categoryId === filter.categoryId)
    }

    // 按日期范围筛选
    if (filter.startDate) {
      filtered = filtered.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
          const startDate = filter.startDate instanceof Date ? filter.startDate : new Date(filter.startDate)
          return !isNaN(expenseDate.getTime()) && !isNaN(startDate.getTime()) && expenseDate >= startDate
        } catch (error) {
          return false
        }
      })
    }
    if (filter.endDate) {
      filtered = filtered.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
          const endDate = filter.endDate instanceof Date ? filter.endDate : new Date(filter.endDate)
          return !isNaN(expenseDate.getTime()) && !isNaN(endDate.getTime()) && expenseDate <= endDate
        } catch (error) {
          return false
        }
      })
    }

    // 按金额范围筛选
    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= filter.minAmount!)
    }
    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= filter.maxAmount!)
    }

    // 按描述筛选
    if (filter.description) {
      const searchTerm = filter.description.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm)
      )
    }

    // 按日期倒序排列
    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date)
      const dateB = b.date instanceof Date ? b.date : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
  })

  /**
   * 今日消费记录
   */
  const todayExpenses = computed(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    return expenses.value.filter(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (isNaN(expenseDate.getTime())) {
          return false
        }
        const expenseStr = expenseDate.toISOString().split('T')[0]
        return expenseStr === todayStr
      } catch (error) {
        console.warn('Invalid expense date:', expense.date, error)
        return false
      }
    })
  })

  /**
   * 今日消费总额
   */
  const todayTotal = computed(() => {
    return todayExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  })

  /**
   * 本月消费记录
   */
  const thisMonthExpenses = computed(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return expenses.value.filter(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (isNaN(expenseDate.getTime())) {
          return false
        }
        return expenseDate >= monthStart && expenseDate <= monthEnd
      } catch (error) {
        console.warn('Invalid expense date:', expense.date, error)
        return false
      }
    })
  })

  /**
   * 本月消费总额
   */
  const thisMonthTotal = computed(() => {
    return thisMonthExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  })

  /**
   * 按分类统计的消费数据
   */
  const expensesByCategory = computed(() => {
    const categoryStats = new Map<string, {
      categoryId: string
      categoryName: string
      amount: number
      count: number
      expenses: Expense[]
    }>()

    filteredExpenses.value.forEach(expense => {
      const category = categories.value.find(cat => cat.id === expense.categoryId)
      const categoryName = category?.name || '未知分类'
      
      if (!categoryStats.has(expense.categoryId)) {
        categoryStats.set(expense.categoryId, {
          categoryId: expense.categoryId,
          categoryName,
          amount: 0,
          count: 0,
          expenses: []
        })
      }

      const stat = categoryStats.get(expense.categoryId)!
      stat.amount += expense.amount
      stat.count += 1
      stat.expenses.push(expense)
    })

    return Array.from(categoryStats.values())
      .sort((a, b) => b.amount - a.amount)
  })

  /**
   * 最近的消费记录（最近10条）
   */
  const recentExpenses = computed(() => {
    return expenses.value
      .sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
        const createdAtB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
        return createdAtB.getTime() - createdAtA.getTime()
      })
      .slice(0, 10)
  })

  // ============================================================================
  // 消费记录 CRUD 操作
  // ============================================================================

  /**
   * 添加消费记录
   */
  const addExpense = async (expenseInput: ExpenseInput): Promise<Expense> => {
    isLoading.value = true
    error.value = null

    try {
      // 验证输入数据
      const validation = validateExpenseInput(expenseInput)
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // 验证分类是否存在
      const categoryExists = categories.value.some(cat => cat.id === expenseInput.categoryId)
      if (!categoryExists) {
        throw new Error('指定的消费分类不存在')
      }

      // 创建新消费记录
      const newExpense: Expense = {
        id: generateId(),
        amount: expenseInput.amount,
        categoryId: expenseInput.categoryId,
        description: expenseInput.description,
        date: expenseInput.date || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 保存到存储
      const updatedExpenses = [...expenses.value, newExpense]
      await expenseStorage.setValue(updatedExpenses)

      return newExpense

    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加消费记录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新消费记录
   */
  const updateExpense = async (id: string, expenseUpdate: ExpenseUpdate): Promise<Expense> => {
    isLoading.value = true
    error.value = null

    try {
      const existingExpense = expenses.value.find(expense => expense.id === id)
      if (!existingExpense) {
        throw new Error('消费记录不存在')
      }

      // 如果更新了分类，验证分类是否存在
      if (expenseUpdate.categoryId) {
        const categoryExists = categories.value.some(cat => cat.id === expenseUpdate.categoryId)
        if (!categoryExists) {
          throw new Error('指定的消费分类不存在')
        }
      }

      // 创建更新后的消费记录
      const updatedExpense: Expense = {
        ...existingExpense,
        ...expenseUpdate,
        updatedAt: new Date()
      }

      // 验证更新后的数据
      const validation = validateExpenseInput({
        amount: updatedExpense.amount,
        categoryId: updatedExpense.categoryId,
        description: updatedExpense.description,
        date: updatedExpense.date
      })
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // 更新存储
      const updatedExpenses = expenses.value.map(expense =>
        expense.id === id ? updatedExpense : expense
      )
      await expenseStorage.setValue(updatedExpenses)

      return updatedExpense

    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新消费记录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除消费记录
   */
  const deleteExpense = async (id: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const expenseExists = expenses.value.some(expense => expense.id === id)
      if (!expenseExists) {
        throw new Error('消费记录不存在')
      }

      const updatedExpenses = expenses.value.filter(expense => expense.id !== id)
      await expenseStorage.setValue(updatedExpenses)

    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除消费记录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 批量删除消费记录
   */
  const deleteExpenses = async (ids: string[]): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const updatedExpenses = expenses.value.filter(expense => !ids.includes(expense.id))
      await expenseStorage.setValue(updatedExpenses)

    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量删除消费记录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // 消费分类管理
  // ============================================================================

  /**
   * 初始化默认分类
   */
  const initializeDefaultCategories = async (): Promise<void> => {
    try {
      if (categories.value.length === 0) {
        const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          id: generateId()
        }))
        
        await categoryStorage.setValue(defaultCategories)
      }
    } catch (err) {
      console.error('Failed to initialize default categories:', err)
    }
  }

  /**
   * 添加消费分类
   */
  const addCategory = async (categoryInput: CategoryInput): Promise<Category> => {
    isLoading.value = true
    error.value = null

    try {
      // 验证输入数据
      const validation = validateCategoryInput(categoryInput)
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // 检查分类名称是否已存在
      const nameExists = categories.value.some(cat => 
        cat.name.toLowerCase() === categoryInput.name.toLowerCase()
      )
      if (nameExists) {
        throw new Error('分类名称已存在')
      }

      // 创建新分类
      const newCategory: Category = {
        id: generateId(),
        name: categoryInput.name,
        icon: categoryInput.icon,
        color: categoryInput.color,
        isDefault: false
      }

      // 保存到存储
      const updatedCategories = [...categories.value, newCategory]
      await categoryStorage.setValue(updatedCategories)

      return newCategory

    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加分类失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新消费分类
   */
  const updateCategory = async (id: string, categoryUpdate: CategoryUpdate): Promise<Category> => {
    isLoading.value = true
    error.value = null

    try {
      const existingCategory = categories.value.find(cat => cat.id === id)
      if (!existingCategory) {
        throw new Error('分类不存在')
      }

      // 如果更新了名称，检查是否与其他分类重复
      if (categoryUpdate.name) {
        const nameExists = categories.value.some(cat => 
          cat.id !== id && cat.name.toLowerCase() === categoryUpdate.name!.toLowerCase()
        )
        if (nameExists) {
          throw new Error('分类名称已存在')
        }
      }

      // 创建更新后的分类
      const updatedCategory: Category = {
        ...existingCategory,
        ...categoryUpdate
      }

      // 验证更新后的数据
      const validation = validateCategoryInput({
        name: updatedCategory.name,
        icon: updatedCategory.icon,
        color: updatedCategory.color
      })
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }

      // 更新存储
      const updatedCategories = categories.value.map(cat =>
        cat.id === id ? updatedCategory : cat
      )
      await categoryStorage.setValue(updatedCategories)

      return updatedCategory

    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新分类失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除消费分类
   */
  const deleteCategory = async (id: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const category = categories.value.find(cat => cat.id === id)
      if (!category) {
        throw new Error('分类不存在')
      }

      // 检查是否有消费记录使用此分类
      const hasExpenses = expenses.value.some(expense => expense.categoryId === id)
      if (hasExpenses) {
        throw new Error('该分类下还有消费记录，无法删除')
      }

      // 不允许删除默认分类
      if (category.isDefault) {
        throw new Error('不能删除默认分类')
      }

      const updatedCategories = categories.value.filter(cat => cat.id !== id)
      await categoryStorage.setValue(updatedCategories)

    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除分类失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // 查询和筛选方法
  // ============================================================================

  /**
   * 根据日期获取消费记录
   */
  const getExpensesByDate = (date: Date): Expense[] => {
    const targetDate = date instanceof Date ? date : new Date(date)
    const targetDateStr = targetDate.toISOString().split('T')[0]
    
    return expenses.value.filter(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (isNaN(expenseDate.getTime())) {
          return false
        }
        const expenseDateStr = expenseDate.toISOString().split('T')[0]
        return expenseDateStr === targetDateStr
      } catch (error) {
        console.warn('Invalid expense date:', expense.date, error)
        return false
      }
    })
  }

  /**
   * 根据日期范围获取消费记录
   */
  const getExpensesByDateRange = (startDate: Date, endDate: Date): Expense[] => {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    
    return expenses.value.filter(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (isNaN(expenseDate.getTime())) {
          return false
        }
        return expenseDate >= start && expenseDate <= end
      } catch (error) {
        console.warn('Invalid expense date:', expense.date, error)
        return false
      }
    })
  }

  /**
   * 根据分类获取消费记录
   */
  const getExpensesByCategory = (categoryId: string): Expense[] => {
    return expenses.value.filter(expense => expense.categoryId === categoryId)
  }

  /**
   * 根据金额范围获取消费记录
   */
  const getExpensesByAmountRange = (minAmount: number, maxAmount: number): Expense[] => {
    return expenses.value.filter(expense => 
      expense.amount >= minAmount && expense.amount <= maxAmount
    )
  }

  /**
   * 搜索消费记录
   */
  const searchExpenses = (searchTerm: string): Expense[] => {
    const term = searchTerm.toLowerCase()
    
    return expenses.value.filter(expense => {
      const category = categories.value.find(cat => cat.id === expense.categoryId)
      const categoryName = category?.name.toLowerCase() || ''
      
      return expense.description.toLowerCase().includes(term) ||
             categoryName.includes(term)
    })
  }

  /**
   * 设置筛选条件
   */
  const setFilter = (filter: ExpenseFilter): void => {
    currentFilter.value = { ...filter }
  }

  /**
   * 清除筛选条件
   */
  const clearFilter = (): void => {
    currentFilter.value = {}
  }

  /**
   * 应用复合筛选条件
   */
  const applyFilter = (filter: ExpenseFilter): Expense[] => {
    let filtered = expenses.value

    // 按分类筛选
    if (filter.categoryId) {
      filtered = filtered.filter(expense => expense.categoryId === filter.categoryId)
    }

    // 按日期范围筛选
    if (filter.startDate) {
      filtered = filtered.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
          const startDate = filter.startDate instanceof Date ? filter.startDate : new Date(filter.startDate)
          return !isNaN(expenseDate.getTime()) && !isNaN(startDate.getTime()) && expenseDate >= startDate
        } catch (error) {
          return false
        }
      })
    }
    if (filter.endDate) {
      filtered = filtered.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
          const endDate = filter.endDate instanceof Date ? filter.endDate : new Date(filter.endDate)
          return !isNaN(expenseDate.getTime()) && !isNaN(endDate.getTime()) && expenseDate <= endDate
        } catch (error) {
          return false
        }
      })
    }

    // 按金额范围筛选
    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= filter.minAmount!)
    }
    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= filter.maxAmount!)
    }

    // 按描述筛选
    if (filter.description) {
      const searchTerm = filter.description.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm)
      )
    }

    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date)
      const dateB = b.date instanceof Date ? b.date : new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
  }

  // ============================================================================
  // 统计和分析方法
  // ============================================================================

  /**
   * 获取指定时间段的消费统计
   */
  const getExpenseStatistics = (startDate: Date, endDate: Date) => {
    const periodExpenses = getExpensesByDateRange(startDate, endDate)
    const totalAmount = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // 按分类统计
    const categoryStats = new Map<string, { amount: number; count: number }>()
    periodExpenses.forEach(expense => {
      if (!categoryStats.has(expense.categoryId)) {
        categoryStats.set(expense.categoryId, { amount: 0, count: 0 })
      }
      const stat = categoryStats.get(expense.categoryId)!
      stat.amount += expense.amount
      stat.count += 1
    })

    // 按日期统计
    const dailyStats = new Map<string, number>()
    periodExpenses.forEach(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (!isNaN(expenseDate.getTime())) {
          const dateStr = expenseDate.toISOString().split('T')[0]
          dailyStats.set(dateStr, (dailyStats.get(dateStr) || 0) + expense.amount)
        }
      } catch (error) {
        console.warn('Invalid expense date in statistics:', expense.date, error)
      }
    })

    return {
      totalAmount,
      totalCount: periodExpenses.length,
      averageAmount: periodExpenses.length > 0 ? totalAmount / periodExpenses.length : 0,
      categoryStats: Array.from(categoryStats.entries()).map(([categoryId, stat]) => {
        const category = categories.value.find(cat => cat.id === categoryId)
        return {
          categoryId,
          categoryName: category?.name || '未知分类',
          amount: stat.amount,
          count: stat.count,
          percentage: totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0
        }
      }).sort((a, b) => b.amount - a.amount),
      dailyStats: Array.from(dailyStats.entries()).map(([date, amount]) => ({
        date: new Date(date),
        amount
      })).sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date)
        const dateB = b.date instanceof Date ? b.date : new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
    }
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 获取分类信息
   */
  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.value.find(cat => cat.id === categoryId)
  }

  /**
   * 获取消费记录详情
   */
  const getExpenseById = (expenseId: string): Expense | undefined => {
    return expenses.value.find(expense => expense.id === expenseId)
  }

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null
  }

  // ============================================================================
  // 初始化
  // ============================================================================

  // 初始化默认分类
  initializeDefaultCategories()

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    currentFilter: readonly(currentFilter),

    // Computed Properties
    expenses,
    categories,
    filteredExpenses,
    todayExpenses,
    todayTotal,
    thisMonthExpenses,
    thisMonthTotal,
    expensesByCategory,
    recentExpenses,

    // 消费记录 CRUD
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpenses,

    // 分类管理
    initializeDefaultCategories,
    addCategory,
    updateCategory,
    deleteCategory,

    // 查询和筛选
    getExpensesByDate,
    getExpensesByDateRange,
    getExpensesByCategory,
    getExpensesByAmountRange,
    searchExpenses,
    setFilter,
    clearFilter,
    applyFilter,

    // 统计分析
    getExpenseStatistics,

    // 工具方法
    getCategoryById,
    getExpenseById,
    clearError
  }
}

/**
 * 消费记录管理 Composable 的类型定义
 */
export interface ExpenseComposable {
  // 状态
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  currentFilter: Readonly<Ref<ExpenseFilter>>

  // 计算属性
  expenses: ComputedRef<Expense[]>
  categories: ComputedRef<Category[]>
  filteredExpenses: ComputedRef<Expense[]>
  todayExpenses: ComputedRef<Expense[]>
  todayTotal: ComputedRef<number>
  thisMonthExpenses: ComputedRef<Expense[]>
  thisMonthTotal: ComputedRef<number>
  expensesByCategory: ComputedRef<Array<{
    categoryId: string
    categoryName: string
    amount: number
    count: number
    expenses: Expense[]
  }>>
  recentExpenses: ComputedRef<Expense[]>

  // 消费记录 CRUD
  addExpense: (expenseInput: ExpenseInput) => Promise<Expense>
  updateExpense: (id: string, expenseUpdate: ExpenseUpdate) => Promise<Expense>
  deleteExpense: (id: string) => Promise<void>
  deleteExpenses: (ids: string[]) => Promise<void>

  // 分类管理
  initializeDefaultCategories: () => Promise<void>
  addCategory: (categoryInput: CategoryInput) => Promise<Category>
  updateCategory: (id: string, categoryUpdate: CategoryUpdate) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>

  // 查询和筛选
  getExpensesByDate: (date: Date) => Expense[]
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Expense[]
  getExpensesByCategory: (categoryId: string) => Expense[]
  getExpensesByAmountRange: (minAmount: number, maxAmount: number) => Expense[]
  searchExpenses: (searchTerm: string) => Expense[]
  setFilter: (filter: ExpenseFilter) => void
  clearFilter: () => void
  applyFilter: (filter: ExpenseFilter) => Expense[]

  // 统计分析
  getExpenseStatistics: (startDate: Date, endDate: Date) => {
    totalAmount: number
    totalCount: number
    averageAmount: number
    categoryStats: Array<{
      categoryId: string
      categoryName: string
      amount: number
      count: number
      percentage: number
    }>
    dailyStats: Array<{
      date: Date
      amount: number
    }>
  }

  // 工具方法
  getCategoryById: (categoryId: string) => Category | undefined
  getExpenseById: (expenseId: string) => Expense | undefined
  clearError: () => void
}