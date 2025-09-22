import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useExpense } from '@/composables/useExpense'
import { useBudget } from '@/composables/useBudget'
import type { ExpenseInput, CategoryInput, BudgetInput } from '@/types'

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useExpense Integration Tests', () => {
  let expenseComposable: ReturnType<typeof useExpense>
  let budgetComposable: ReturnType<typeof useBudget>

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Initialize composables
    expenseComposable = useExpense()
    budgetComposable = useBudget()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('与预算系统集成', () => {
    it('应该在添加消费记录后更新预算分配', async () => {
      // 1. 设置月度预算
      const budgetInput: BudgetInput = {
        monthlyAmount: 3000,
        startDate: new Date(2024, 0, 1) // January 1, 2024
      }
      
      await budgetComposable.setMonthlyBudget(budgetInput)
      await nextTick()

      // 2. 获取初始可用预算
      const initialAvailableBudget = budgetComposable.availableBudget.value
      expect(initialAvailableBudget).toBeGreaterThan(0)

      // 3. 添加消费记录
      const expenseInput: ExpenseInput = {
        amount: 50,
        categoryId: expenseComposable.categories.value[0]?.id || 'default-cat',
        description: '午餐',
        date: new Date(2024, 0, 15) // January 15, 2024
      }

      await expenseComposable.addExpense(expenseInput)
      await nextTick()

      // 4. 验证预算已更新
      const updatedAvailableBudget = budgetComposable.availableBudget.value
      const totalSpent = budgetComposable.totalSpent.value
      
      expect(totalSpent).toBe(50)
      expect(updatedAvailableBudget).toBeLessThan(initialAvailableBudget)
    })

    it('应该在删除消费记录后恢复预算', async () => {
      // 1. 设置预算
      await budgetComposable.setMonthlyBudget({
        monthlyAmount: 3000,
        startDate: new Date(2024, 0, 1)
      })

      // 2. 添加消费记录
      const expense = await expenseComposable.addExpense({
        amount: 100,
        categoryId: expenseComposable.categories.value[0]?.id || 'default-cat',
        description: '购物',
        date: new Date(2024, 0, 15)
      })
      await nextTick()

      const spentAfterAdd = budgetComposable.totalSpent.value
      expect(spentAfterAdd).toBe(100)

      // 3. 删除消费记录
      await expenseComposable.deleteExpense(expense.id)
      await nextTick()

      const spentAfterDelete = budgetComposable.totalSpent.value
      expect(spentAfterDelete).toBe(0)
    })

    it('应该在更新消费记录后正确调整预算', async () => {
      // 1. 设置预算
      await budgetComposable.setMonthlyBudget({
        monthlyAmount: 3000,
        startDate: new Date(2024, 0, 1)
      })

      // 2. 添加消费记录
      const expense = await expenseComposable.addExpense({
        amount: 50,
        categoryId: expenseComposable.categories.value[0]?.id || 'default-cat',
        description: '午餐',
        date: new Date(2024, 0, 15)
      })
      await nextTick()

      expect(budgetComposable.totalSpent.value).toBe(50)

      // 3. 更新消费金额
      await expenseComposable.updateExpense(expense.id, { amount: 80 })
      await nextTick()

      expect(budgetComposable.totalSpent.value).toBe(80)
    })
  })

  describe('数据持久化集成', () => {
    it('应该持久化消费记录到 localStorage', async () => {
      // 添加消费记录
      await expenseComposable.addExpense({
        amount: 25.5,
        categoryId: expenseComposable.categories.value[0]?.id || 'default-cat',
        description: '咖啡',
        date: new Date()
      })

      // 验证数据已保存到 localStorage
      const storedExpenses = localStorage.getItem('expenses')
      expect(storedExpenses).toBeTruthy()
      
      const parsedExpenses = JSON.parse(storedExpenses!)
      expect(parsedExpenses).toHaveLength(1)
      expect(parsedExpenses[0].amount).toBe(25.5)
      expect(parsedExpenses[0].description).toBe('咖啡')
    })

    it('应该持久化分类数据到 localStorage', async () => {
      // 添加自定义分类
      await expenseComposable.addCategory({
        name: '健身',
        icon: '💪',
        color: '#FF5733'
      })

      // 验证数据已保存到 localStorage
      const storedCategories = localStorage.getItem('categories')
      expect(storedCategories).toBeTruthy()
      
      const parsedCategories = JSON.parse(storedCategories!)
      const customCategory = parsedCategories.find((cat: any) => cat.name === '健身')
      expect(customCategory).toBeTruthy()
      expect(customCategory.icon).toBe('💪')
      expect(customCategory.color).toBe('#FF5733')
      expect(customCategory.isDefault).toBe(false)
    })

    it('应该在重新初始化时恢复数据', async () => {
      // 1. 添加一些数据
      await expenseComposable.addExpense({
        amount: 30,
        categoryId: expenseComposable.categories.value[0]?.id || 'default-cat',
        description: '早餐'
      })

      await expenseComposable.addCategory({
        name: '学习',
        icon: '📚',
        color: '#3498DB'
      })

      // 2. 创建新的 composable 实例（模拟应用重启）
      const newExpenseComposable = useExpense()
      await nextTick()

      // 3. 验证数据已恢复
      expect(newExpenseComposable.expenses.value).toHaveLength(1)
      expect(newExpenseComposable.expenses.value[0].description).toBe('早餐')
      
      const customCategory = newExpenseComposable.categories.value.find(cat => cat.name === '学习')
      expect(customCategory).toBeTruthy()
      expect(customCategory?.icon).toBe('📚')
    })
  })

  describe('默认分类初始化', () => {
    it('应该在首次使用时初始化默认分类', async () => {
      // 等待初始化完成
      await nextTick()

      // 验证默认分类已创建
      const categories = expenseComposable.categories.value
      expect(categories.length).toBeGreaterThan(0)

      // 验证包含预期的默认分类
      const expectedCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '其他']
      expectedCategories.forEach(name => {
        const category = categories.find(cat => cat.name === name)
        expect(category).toBeTruthy()
        expect(category?.isDefault).toBe(true)
      })
    })

    it('应该不重复创建默认分类', async () => {
      // 第一次初始化
      await nextTick()
      const firstCount = expenseComposable.categories.value.length

      // 创建新的 composable 实例
      const newComposable = useExpense()
      await nextTick()

      // 验证分类数量没有增加
      expect(newComposable.categories.value.length).toBe(firstCount)
    })
  })

  describe('复杂查询和筛选场景', () => {
    beforeEach(async () => {
      // 准备测试数据
      const categories = expenseComposable.categories.value
      const foodCat = categories.find(cat => cat.name === '餐饮')?.id || 'food'
      const transportCat = categories.find(cat => cat.name === '交通')?.id || 'transport'

      // 添加多条消费记录
      const expenses = [
        { amount: 25, categoryId: foodCat, description: '早餐', date: new Date(2024, 0, 15) },
        { amount: 45, categoryId: foodCat, description: '午餐', date: new Date(2024, 0, 15) },
        { amount: 80, categoryId: foodCat, description: '晚餐', date: new Date(2024, 0, 15) },
        { amount: 20, categoryId: transportCat, description: '地铁', date: new Date(2024, 0, 15) },
        { amount: 35, categoryId: transportCat, description: '打车', date: new Date(2024, 0, 16) },
        { amount: 60, categoryId: foodCat, description: '聚餐', date: new Date(2024, 0, 16) }
      ]

      for (const expense of expenses) {
        await expenseComposable.addExpense(expense)
      }
      await nextTick()
    })

    it('应该正确统计今日消费', () => {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const jan15Str = new Date(2024, 0, 15).toISOString().split('T')[0]

      if (todayStr === jan15Str) {
        // 如果今天是测试日期，应该有4条记录
        expect(expenseComposable.todayExpenses.value).toHaveLength(4)
        expect(expenseComposable.todayTotal.value).toBe(170) // 25+45+80+20
      } else {
        // 否则今日无消费
        expect(expenseComposable.todayExpenses.value).toHaveLength(0)
        expect(expenseComposable.todayTotal.value).toBe(0)
      }
    })

    it('应该正确按分类统计消费', () => {
      const categoryStats = expenseComposable.expensesByCategory.value
      
      const foodStats = categoryStats.find(stat => stat.categoryName === '餐饮')
      const transportStats = categoryStats.find(stat => stat.categoryName === '交通')

      expect(foodStats?.amount).toBe(210) // 25+45+80+60
      expect(foodStats?.count).toBe(4)
      
      expect(transportStats?.amount).toBe(55) // 20+35
      expect(transportStats?.count).toBe(2)
    })

    it('应该正确应用复合筛选条件', () => {
      // 筛选餐饮分类且金额大于30的记录
      const foodCat = expenseComposable.categories.value.find(cat => cat.name === '餐饮')
      const filter = {
        categoryId: foodCat?.id,
        minAmount: 30
      }

      const filtered = expenseComposable.applyFilter(filter)
      expect(filtered).toHaveLength(3) // 午餐45, 晚餐80, 聚餐60
      expect(filtered.every(exp => exp.amount >= 30)).toBe(true)
      expect(filtered.every(exp => exp.categoryId === foodCat?.id)).toBe(true)
    })

    it('应该正确生成统计报告', () => {
      const startDate = new Date(2024, 0, 15)
      const endDate = new Date(2024, 0, 16)
      
      const stats = expenseComposable.getExpenseStatistics(startDate, endDate)
      
      expect(stats.totalAmount).toBe(265) // 所有消费总和
      expect(stats.totalCount).toBe(6)
      expect(stats.averageAmount).toBeCloseTo(44.17, 2)
      
      // 验证分类统计
      expect(stats.categoryStats).toHaveLength(2)
      const foodStats = stats.categoryStats.find(stat => stat.categoryName === '餐饮')
      expect(foodStats?.percentage).toBeCloseTo(79.25, 2) // 210/265 * 100
      
      // 验证日统计
      expect(stats.dailyStats).toHaveLength(2)
      const jan15Stats = stats.dailyStats.find(stat => 
        stat.date.toISOString().split('T')[0] === '2024-01-15'
      )
      expect(jan15Stats?.amount).toBe(170) // 15号的消费总和
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该处理无效的消费记录输入', async () => {
      const invalidExpense = {
        amount: -10, // 负数金额
        categoryId: 'non-existent-category',
        description: ''
      }

      await expect(expenseComposable.addExpense(invalidExpense as ExpenseInput))
        .rejects.toThrow()
    })

    it('应该处理无效的分类输入', async () => {
      const invalidCategory = {
        name: '', // 空名称
        icon: '',
        color: 'invalid-color' // 无效颜色格式
      }

      await expect(expenseComposable.addCategory(invalidCategory as CategoryInput))
        .rejects.toThrow()
    })

    it('应该处理存储错误', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      try {
        await expect(expenseComposable.addExpense({
          amount: 50,
          categoryId: expenseComposable.categories.value[0]?.id || 'default',
          description: '测试'
        })).rejects.toThrow()
      } finally {
        // Restore original method
        localStorage.setItem = originalSetItem
      }
    })

    it('应该处理空数据的统计计算', () => {
      // 清空所有数据
      expenseComposable.expenses.value.length = 0

      const stats = expenseComposable.getExpenseStatistics(
        new Date(2024, 0, 1),
        new Date(2024, 0, 31)
      )

      expect(stats.totalAmount).toBe(0)
      expect(stats.totalCount).toBe(0)
      expect(stats.averageAmount).toBe(0)
      expect(stats.categoryStats).toHaveLength(0)
      expect(stats.dailyStats).toHaveLength(0)
    })
  })

  describe('性能和内存管理', () => {
    it('应该高效处理大量数据', async () => {
      const startTime = Date.now()
      
      // 添加大量消费记录
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(expenseComposable.addExpense({
          amount: Math.random() * 100,
          categoryId: expenseComposable.categories.value[0]?.id || 'default',
          description: `测试消费 ${i}`,
          date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        }))
      }
      
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 验证性能（应该在合理时间内完成）
      expect(duration).toBeLessThan(5000) // 5秒内完成
      expect(expenseComposable.expenses.value).toHaveLength(100)
    })

    it('应该正确处理并发操作', async () => {
      // 同时添加多个消费记录
      const promises = [
        expenseComposable.addExpense({
          amount: 30,
          categoryId: expenseComposable.categories.value[0]?.id || 'default',
          description: '并发测试1'
        }),
        expenseComposable.addExpense({
          amount: 40,
          categoryId: expenseComposable.categories.value[0]?.id || 'default',
          description: '并发测试2'
        }),
        expenseComposable.addExpense({
          amount: 50,
          categoryId: expenseComposable.categories.value[0]?.id || 'default',
          description: '并发测试3'
        })
      ]

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      expect(expenseComposable.expenses.value).toHaveLength(3)
      expect(expenseComposable.thisMonthTotal.value).toBe(120)
    })
  })
})