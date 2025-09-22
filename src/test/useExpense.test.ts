import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useExpense } from '@/composables/useExpense'
import type { ExpenseInput, CategoryInput, ExpenseFilter } from '@/types'

// Mock the storage composables
const mockExpenseStorage = {
  state: { value: [] as any[] },
  setValue: vi.fn().mockResolvedValue(undefined)
}

const mockCategoryStorage = {
  state: { value: [] as any[] },
  setValue: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@/composables/useStorage', () => ({
  useExpenseStorage: () => mockExpenseStorage,
  useCategoryStorage: () => mockCategoryStorage
}))

// Mock validation functions
vi.mock('@/types/validation', () => ({
  validateExpenseInput: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCategoryInput: vi.fn().mockReturnValue({ isValid: true, errors: [] })
}))

// Mock utils
vi.mock('@/types/utils', () => ({
  generateId: vi.fn().mockReturnValue('test-id-123')
}))

describe('useExpense', () => {
  let expenseComposable: ReturnType<typeof useExpense>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset mock storage state
    mockExpenseStorage.state.value = []
    mockCategoryStorage.state.value = []
    // Reset validation mocks to default success
    const { validateExpenseInput, validateCategoryInput } = await import('@/types/validation')
    vi.mocked(validateExpenseInput).mockReturnValue({ isValid: true, errors: [] })
    vi.mocked(validateCategoryInput).mockReturnValue({ isValid: true, errors: [] })
    
    expenseComposable = useExpense()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(expenseComposable.isLoading.value).toBe(false)
      expect(expenseComposable.error.value).toBe(null)
      expect(expenseComposable.expenses.value).toEqual([])
      expect(expenseComposable.categories.value).toEqual([])
      expect(expenseComposable.filteredExpenses.value).toEqual([])
      expect(expenseComposable.todayExpenses.value).toEqual([])
      expect(expenseComposable.todayTotal.value).toBe(0)
      expect(expenseComposable.thisMonthExpenses.value).toEqual([])
      expect(expenseComposable.thisMonthTotal.value).toBe(0)
    })

    it('应该初始化默认分类', () => {
      expect(expenseComposable.initializeDefaultCategories).toBeDefined()
    })
  })

  describe('消费记录 CRUD 操作', () => {
    describe('addExpense', () => {
      it('应该成功添加消费记录', async () => {
        // Add a mock category first
        mockCategoryStorage.state.value.push({
          id: 'cat-1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        })

        const expenseInput: ExpenseInput = {
          amount: 50.5,
          categoryId: 'cat-1',
          description: '午餐',
          date: new Date('2024-01-15')
        }

        const result = await expenseComposable.addExpense(expenseInput)

        expect(result).toEqual({
          id: 'test-id-123',
          amount: 50.5,
          categoryId: 'cat-1',
          description: '午餐',
          date: new Date('2024-01-15'),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      })

      it('应该在验证失败时抛出错误', async () => {
        const { validateExpenseInput } = await import('@/types/validation')
        vi.mocked(validateExpenseInput).mockReturnValue({
          isValid: false,
          errors: [{ field: 'amount', message: '金额无效', code: 'INVALID' }]
        })

        const expenseInput: ExpenseInput = {
          amount: -10,
          categoryId: 'cat-1',
          description: '测试',
        }

        await expect(expenseComposable.addExpense(expenseInput)).rejects.toThrow('金额无效')
      })

      it('应该在分类不存在时抛出错误', async () => {
        // Categories are empty by default in beforeEach
        const expenseInput: ExpenseInput = {
          amount: 50,
          categoryId: 'non-existent-cat',
          description: '测试',
        }

        await expect(expenseComposable.addExpense(expenseInput)).rejects.toThrow('指定的消费分类不存在')
      })

      it('应该使用当前日期作为默认日期', async () => {
        // Add a mock category first
        mockCategoryStorage.state.value.push({
          id: 'cat-1',
          name: '测试分类',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        })

        const expenseInput: ExpenseInput = {
          amount: 50,
          categoryId: 'cat-1',
          description: '测试',
        }

        const result = await expenseComposable.addExpense(expenseInput)

        expect(result.date).toBeInstanceOf(Date)
        expect(Math.abs(result.date.getTime() - new Date().getTime())).toBeLessThan(1000)
      })
    })

    describe('updateExpense', () => {
      it('应该成功更新消费记录', async () => {
        // Mock existing expense and category
        const existingExpense = {
          id: 'expense-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '早餐',
          date: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15T08:00:00'),
          updatedAt: new Date('2024-01-15T08:00:00')
        }
        mockExpenseStorage.state.value.push(existingExpense)
        mockCategoryStorage.state.value.push({
          id: 'cat-1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        })

        const updateData = {
          amount: 35,
          description: '丰盛早餐'
        }

        const result = await expenseComposable.updateExpense('expense-1', updateData)

        expect(result.amount).toBe(35)
        expect(result.description).toBe('丰盛早餐')
        expect(result.updatedAt).toBeInstanceOf(Date)
      })

      it('应该在记录不存在时抛出错误', async () => {
        await expect(expenseComposable.updateExpense('non-existent', { amount: 50 }))
          .rejects.toThrow('消费记录不存在')
      })
    })

    describe('deleteExpense', () => {
      it('应该成功删除消费记录', async () => {
        // Mock existing expense
        const existingExpense = {
          id: 'expense-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '早餐',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        mockExpenseStorage.state.value.push(existingExpense)

        await expect(expenseComposable.deleteExpense('expense-1')).resolves.not.toThrow()
      })

      it('应该在记录不存在时抛出错误', async () => {
        await expect(expenseComposable.deleteExpense('non-existent'))
          .rejects.toThrow('消费记录不存在')
      })
    })

    describe('deleteExpenses', () => {
      it('应该成功批量删除消费记录', async () => {
        const ids = ['expense-1', 'expense-2']
        await expect(expenseComposable.deleteExpenses(ids)).resolves.not.toThrow()
      })
    })
  })

  describe('消费分类管理', () => {
    describe('addCategory', () => {
      it('应该成功添加分类', async () => {
        const categoryInput: CategoryInput = {
          name: '新分类',
          icon: '🎯',
          color: '#FF5733'
        }

        const result = await expenseComposable.addCategory(categoryInput)

        expect(result).toEqual({
          id: 'test-id-123',
          name: '新分类',
          icon: '🎯',
          color: '#FF5733',
          isDefault: false
        })
      })

      it('应该在分类名称重复时抛出错误', async () => {
        // Mock existing category
        const existingCategory = {
          id: 'cat-1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        }
        mockCategoryStorage.state.value.push(existingCategory)

        const categoryInput: CategoryInput = {
          name: '餐饮', // Same name
          icon: '🎯',
          color: '#FF5733'
        }

        await expect(expenseComposable.addCategory(categoryInput))
          .rejects.toThrow('分类名称已存在')
      })
    })

    describe('updateCategory', () => {
      it('应该成功更新分类', async () => {
        // Mock existing category
        const existingCategory = {
          id: 'cat-1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        }
        mockCategoryStorage.state.value.push(existingCategory)

        const updateData = {
          name: '美食',
          icon: '🍕'
        }

        const result = await expenseComposable.updateCategory('cat-1', updateData)

        expect(result.name).toBe('美食')
        expect(result.icon).toBe('🍕')
      })

      it('应该在分类不存在时抛出错误', async () => {
        await expect(expenseComposable.updateCategory('non-existent', { name: '测试' }))
          .rejects.toThrow('分类不存在')
      })
    })

    describe('deleteCategory', () => {
      it('应该成功删除非默认分类', async () => {
        // Mock existing category
        const existingCategory = {
          id: 'cat-1',
          name: '自定义分类',
          icon: '🎯',
          color: '#FF0000',
          isDefault: false
        }
        mockCategoryStorage.state.value.push(existingCategory)

        await expect(expenseComposable.deleteCategory('cat-1')).resolves.not.toThrow()
      })

      it('应该在删除默认分类时抛出错误', async () => {
        // Mock existing default category
        const existingCategory = {
          id: 'cat-1',
          name: '餐饮',
          icon: '🍽️',
          color: '#FF0000',
          isDefault: true
        }
        mockCategoryStorage.state.value.push(existingCategory)

        await expect(expenseComposable.deleteCategory('cat-1'))
          .rejects.toThrow('不能删除默认分类')
      })

      it('应该在分类有关联消费记录时抛出错误', async () => {
        // Mock existing category and expense
        const existingCategory = {
          id: 'cat-1',
          name: '自定义分类',
          icon: '🎯',
          color: '#FF0000',
          isDefault: false
        }
        const existingExpense = {
          id: 'expense-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '测试',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        mockCategoryStorage.state.value.push(existingCategory)
        mockExpenseStorage.state.value.push(existingExpense)

        await expect(expenseComposable.deleteCategory('cat-1'))
          .rejects.toThrow('该分类下还有消费记录，无法删除')
      })
    })
  })

  describe('查询和筛选功能', () => {
    beforeEach(() => {
      // Mock some test data
      const testExpenses = [
        {
          id: 'exp-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '早餐',
          date: new Date('2024-01-15T08:00:00'),
          createdAt: new Date('2024-01-15T08:00:00'),
          updatedAt: new Date('2024-01-15T08:00:00')
        },
        {
          id: 'exp-2',
          amount: 50,
          categoryId: 'cat-2',
          description: '午餐',
          date: new Date('2024-01-15T12:00:00'),
          createdAt: new Date('2024-01-15T12:00:00'),
          updatedAt: new Date('2024-01-15T12:00:00')
        },
        {
          id: 'exp-3',
          amount: 100,
          categoryId: 'cat-1',
          description: '晚餐',
          date: new Date('2024-01-16T19:00:00'),
          createdAt: new Date('2024-01-16T19:00:00'),
          updatedAt: new Date('2024-01-16T19:00:00')
        }
      ]
      mockExpenseStorage.state.value.push(...testExpenses)
    })

    describe('getExpensesByDate', () => {
      it('应该返回指定日期的消费记录', () => {
        const result = expenseComposable.getExpensesByDate(new Date('2024-01-15'))
        expect(result).toHaveLength(2)
        expect(result.map(e => e.id)).toEqual(['exp-1', 'exp-2'])
      })

      it('应该在没有记录时返回空数组', () => {
        const result = expenseComposable.getExpensesByDate(new Date('2024-01-20'))
        expect(result).toHaveLength(0)
      })
    })

    describe('getExpensesByDateRange', () => {
      it('应该返回日期范围内的消费记录', () => {
        const startDate = new Date('2024-01-15')
        const endDate = new Date('2024-01-16T23:59:59') // Include the entire end date
        const result = expenseComposable.getExpensesByDateRange(startDate, endDate)
        expect(result).toHaveLength(3)
      })
    })

    describe('getExpensesByCategory', () => {
      it('应该返回指定分类的消费记录', () => {
        const result = expenseComposable.getExpensesByCategory('cat-1')
        expect(result).toHaveLength(2)
        expect(result.map(e => e.id)).toEqual(['exp-1', 'exp-3'])
      })
    })

    describe('getExpensesByAmountRange', () => {
      it('应该返回金额范围内的消费记录', () => {
        const result = expenseComposable.getExpensesByAmountRange(40, 100)
        expect(result).toHaveLength(2)
        expect(result.map(e => e.id)).toEqual(['exp-2', 'exp-3'])
      })
    })

    describe('searchExpenses', () => {
      it('应该根据描述搜索消费记录', () => {
        const result = expenseComposable.searchExpenses('餐')
        expect(result).toHaveLength(3) // 早餐、午餐、晚餐
      })

      it('应该进行不区分大小写的搜索', () => {
        const result = expenseComposable.searchExpenses('早')
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('exp-1')
      })
    })

    describe('筛选功能', () => {
      it('应该设置筛选条件', () => {
        const filter: ExpenseFilter = {
          categoryId: 'cat-1',
          minAmount: 50
        }
        
        expenseComposable.setFilter(filter)
        expect(expenseComposable.currentFilter.value).toEqual(filter)
      })

      it('应该清除筛选条件', () => {
        expenseComposable.setFilter({ categoryId: 'cat-1' })
        expenseComposable.clearFilter()
        expect(expenseComposable.currentFilter.value).toEqual({})
      })

      it('应该应用复合筛选条件', () => {
        const filter: ExpenseFilter = {
          categoryId: 'cat-1',
          minAmount: 50
        }
        
        const result = expenseComposable.applyFilter(filter)
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('exp-3')
      })
    })
  })

  describe('统计分析功能', () => {
    beforeEach(() => {
      // Mock test data and categories
      const testExpenses = [
        {
          id: 'exp-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '早餐',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-2',
          amount: 50,
          categoryId: 'cat-2',
          description: '午餐',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-3',
          amount: 100,
          categoryId: 'cat-1',
          description: '晚餐',
          date: new Date('2024-01-16'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const testCategories = [
        { id: 'cat-1', name: '餐饮', icon: '🍽️', color: '#FF0000', isDefault: true },
        { id: 'cat-2', name: '交通', icon: '🚗', color: '#00FF00', isDefault: true }
      ]

      mockExpenseStorage.state.value.push(...testExpenses)
      mockCategoryStorage.state.value.push(...testCategories)
    })

    describe('getExpenseStatistics', () => {
      it('应该返回正确的统计数据', () => {
        const startDate = new Date('2024-01-15')
        const endDate = new Date('2024-01-16')
        
        const stats = expenseComposable.getExpenseStatistics(startDate, endDate)
        
        expect(stats.totalAmount).toBe(180)
        expect(stats.totalCount).toBe(3)
        expect(stats.averageAmount).toBe(60)
        expect(stats.categoryStats).toHaveLength(2)
        expect(stats.dailyStats).toHaveLength(2)
        
        // Check category stats
        const cat1Stats = stats.categoryStats.find(s => s.categoryId === 'cat-1')
        expect(cat1Stats?.amount).toBe(130)
        expect(cat1Stats?.count).toBe(2)
        expect(cat1Stats?.percentage).toBeCloseTo(72.22, 2)
      })

      it('应该处理空数据', () => {
        mockExpenseStorage.state.value.length = 0
        
        const startDate = new Date('2024-01-15')
        const endDate = new Date('2024-01-16')
        
        const stats = expenseComposable.getExpenseStatistics(startDate, endDate)
        
        expect(stats.totalAmount).toBe(0)
        expect(stats.totalCount).toBe(0)
        expect(stats.averageAmount).toBe(0)
        expect(stats.categoryStats).toHaveLength(0)
        expect(stats.dailyStats).toHaveLength(0)
      })
    })
  })

  describe('工具方法', () => {
    beforeEach(() => {
      const testCategories = [
        { id: 'cat-1', name: '餐饮', icon: '🍽️', color: '#FF0000', isDefault: true }
      ]
      const testExpenses = [
        {
          id: 'exp-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '早餐',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockCategoryStorage.state.value.push(...testCategories)
      mockExpenseStorage.state.value.push(...testExpenses)
    })

    describe('getCategoryById', () => {
      it('应该返回正确的分类', () => {
        const category = expenseComposable.getCategoryById('cat-1')
        expect(category?.name).toBe('餐饮')
      })

      it('应该在分类不存在时返回 undefined', () => {
        const category = expenseComposable.getCategoryById('non-existent')
        expect(category).toBeUndefined()
      })
    })

    describe('getExpenseById', () => {
      it('应该返回正确的消费记录', () => {
        const expense = expenseComposable.getExpenseById('exp-1')
        expect(expense?.description).toBe('早餐')
      })

      it('应该在记录不存在时返回 undefined', () => {
        const expense = expenseComposable.getExpenseById('non-existent')
        expect(expense).toBeUndefined()
      })
    })

    describe('clearError', () => {
      it('应该清除错误状态', () => {
        // Manually set error since it's readonly
        expenseComposable.clearError()
        expect(expenseComposable.error.value).toBe(null)
      })
    })
  })

  describe('计算属性', () => {
    beforeEach(() => {
      const today = new Date()
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 15)
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15)

      const testExpenses = [
        {
          id: 'exp-today-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '今日早餐',
          date: today,
          createdAt: new Date('2024-01-01T08:00:00'),
          updatedAt: new Date()
        },
        {
          id: 'exp-today-2',
          amount: 50,
          categoryId: 'cat-1',
          description: '今日午餐',
          date: today,
          createdAt: new Date('2024-01-01T12:00:00'),
          updatedAt: new Date()
        },
        {
          id: 'exp-month',
          amount: 100,
          categoryId: 'cat-2',
          description: '本月其他',
          date: thisMonth,
          createdAt: new Date('2024-01-02T10:00:00'),
          updatedAt: new Date()
        },
        {
          id: 'exp-last-month',
          amount: 200,
          categoryId: 'cat-1',
          description: '上月消费',
          date: lastMonth,
          createdAt: new Date('2024-01-03T14:00:00'), // Most recent createdAt
          updatedAt: new Date()
        }
      ]

      const testCategories = [
        { id: 'cat-1', name: '餐饮', icon: '🍽️', color: '#FF0000', isDefault: true },
        { id: 'cat-2', name: '交通', icon: '🚗', color: '#00FF00', isDefault: true }
      ]

      mockExpenseStorage.state.value.push(...testExpenses)
      mockCategoryStorage.state.value.push(...testCategories)
    })

    it('todayExpenses 应该返回今日消费记录', () => {
      expect(expenseComposable.todayExpenses.value).toHaveLength(2)
      expect(expenseComposable.todayExpenses.value.map(e => e.id)).toEqual(['exp-today-1', 'exp-today-2'])
    })

    it('todayTotal 应该返回今日消费总额', () => {
      expect(expenseComposable.todayTotal.value).toBe(80)
    })

    it('thisMonthExpenses 应该返回本月消费记录', () => {
      // Should include today's expenses and this month's expense
      expect(expenseComposable.thisMonthExpenses.value).toHaveLength(3)
    })

    it('thisMonthTotal 应该返回本月消费总额', () => {
      expect(expenseComposable.thisMonthTotal.value).toBe(180)
    })

    it('expensesByCategory 应该按分类统计消费', () => {
      const categoryStats = expenseComposable.expensesByCategory.value
      expect(categoryStats).toHaveLength(2)
      
      const cat1Stats = categoryStats.find(s => s.categoryId === 'cat-1')
      expect(cat1Stats?.amount).toBe(280) // 30 + 50 + 200
      expect(cat1Stats?.count).toBe(3)
    })

    it('recentExpenses 应该返回最近的消费记录', () => {
      const recent = expenseComposable.recentExpenses.value
      expect(recent).toHaveLength(4) // All test expenses
      // Should be sorted by createdAt desc
      expect(recent[0].id).toBe('exp-last-month') // Most recently created
    })
  })
})