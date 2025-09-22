import { describe, it, expect, beforeEach } from 'vitest'
import {
  isBudget,
  isExpense,
  isCategory,
  generateId,
  createBudget,
  createExpense,
  createCategory,
  calculateBudgetSummary,
  filterExpenses,
  groupExpensesByCategory,
  calculateCategoryTotals,
  sortExpensesByDate,
  getExpensesForDate,
  getCurrentMonthExpenses
} from '../types/utils'
import type { Budget, Expense, Category, ExpenseFilter } from '../types'

// ============================================================================
// Test Data Factories
// ============================================================================

function createTestBudget(): Budget {
  return {
    id: 'budget-123',
    monthlyAmount: 3000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    dailyAllocation: [],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  }
}

function createTestExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-123',
    amount: 50,
    categoryId: 'category-123',
    description: '午餐',
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15T12:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z'),
    ...overrides
  }
}

function createTestCategory(): Category {
  return {
    id: 'category-123',
    name: '餐饮',
    icon: '🍽️',
    color: '#FF6B6B',
    isDefault: true
  }
}

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Type Guards', () => {
  describe('isBudget', () => {
    it('should return true for valid budget', () => {
      const budget = createTestBudget()
      expect(isBudget(budget)).toBe(true)
    })

    it('should return false for invalid budget', () => {
      expect(isBudget(null)).toBe(false)
      expect(isBudget(undefined)).toBe(false)
      expect(isBudget({})).toBe(false)
      expect(isBudget({ id: 'test' })).toBe(false)
      
      const invalidBudget = { ...createTestBudget(), monthlyAmount: 'invalid' }
      expect(isBudget(invalidBudget)).toBe(false)
    })
  })

  describe('isExpense', () => {
    it('should return true for valid expense', () => {
      const expense = createTestExpense()
      expect(isExpense(expense)).toBe(true)
    })

    it('should return false for invalid expense', () => {
      expect(isExpense(null)).toBe(false)
      expect(isExpense({})).toBe(false)
      
      const invalidExpense = { ...createTestExpense(), amount: 'invalid' }
      expect(isExpense(invalidExpense)).toBe(false)
    })
  })

  describe('isCategory', () => {
    it('should return true for valid category', () => {
      const category = createTestCategory()
      expect(isCategory(category)).toBe(true)
    })

    it('should return false for invalid category', () => {
      expect(isCategory(null)).toBe(false)
      expect(isCategory({})).toBe(false)
      
      const invalidCategory = { ...createTestCategory(), isDefault: 'invalid' }
      expect(isCategory(invalidCategory)).toBe(false)
    })
  })
})

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('should include prefix when provided', () => {
      const id = generateId('test')
      expect(id.startsWith('test-')).toBe(true)
    })
  })

  describe('createBudget', () => {
    it('should create valid budget with correct properties', () => {
      const monthlyAmount = 3000
      const startDate = new Date('2024-01-01')
      const budget = createBudget(monthlyAmount, startDate)
      
      expect(budget.monthlyAmount).toBe(monthlyAmount)
      expect(budget.startDate).toEqual(startDate)
      expect(budget.endDate.getMonth()).toBe(startDate.getMonth())
      expect(budget.id).toBeTruthy()
      expect(Array.isArray(budget.dailyAllocation)).toBe(true)
      expect(budget.createdAt).toBeInstanceOf(Date)
      expect(budget.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('createExpense', () => {
    it('should create valid expense with correct properties', () => {
      const amount = 100
      const categoryId = 'cat-123'
      const description = '测试消费'
      const date = new Date('2024-01-15')
      
      const expense = createExpense(amount, categoryId, description, date)
      
      expect(expense.amount).toBe(amount)
      expect(expense.categoryId).toBe(categoryId)
      expect(expense.description).toBe(description)
      expect(expense.date).toEqual(date)
      expect(expense.id).toBeTruthy()
      expect(expense.createdAt).toBeInstanceOf(Date)
      expect(expense.updatedAt).toBeInstanceOf(Date)
    })

    it('should use current date when date not provided', () => {
      const expense = createExpense(100, 'cat-123', '测试')
      expect(expense.date).toBeInstanceOf(Date)
    })
  })

  describe('createCategory', () => {
    it('should create valid category with correct properties', () => {
      const name = '测试分类'
      const icon = '🎯'
      const color = '#FF0000'
      const isDefault = true
      
      const category = createCategory(name, icon, color, isDefault)
      
      expect(category.name).toBe(name)
      expect(category.icon).toBe(icon)
      expect(category.color).toBe(color)
      expect(category.isDefault).toBe(isDefault)
      expect(category.id).toBeTruthy()
    })

    it('should default isDefault to false', () => {
      const category = createCategory('测试', '🎯', '#FF0000')
      expect(category.isDefault).toBe(false)
    })
  })

  describe('calculateBudgetSummary', () => {
    it('should calculate correct budget summary', () => {
      const budget = createTestBudget()
      const expenses = [
        createTestExpense({ amount: 100, date: new Date('2024-01-10') }),
        createTestExpense({ amount: 200, date: new Date('2024-01-15') }),
        createTestExpense({ amount: 50, date: new Date('2024-01-20') })
      ]
      
      const summary = calculateBudgetSummary(budget, expenses)
      
      expect(summary.totalBudget).toBe(3000)
      expect(summary.totalSpent).toBe(350)
      expect(summary.remainingBudget).toBe(2650)
      expect(summary.isOverBudget).toBe(false)
      expect(summary.dailyAverage).toBeGreaterThan(0)
    })

    it('should detect over budget situation', () => {
      const budget = createTestBudget()
      const expenses = [
        createTestExpense({ amount: 4000, date: new Date('2024-01-10') })
      ]
      
      const summary = calculateBudgetSummary(budget, expenses)
      
      expect(summary.isOverBudget).toBe(true)
      expect(summary.remainingBudget).toBe(-1000)
    })

    it('should exclude expenses outside budget period', () => {
      const budget = createTestBudget()
      const expenses = [
        createTestExpense({ amount: 100, date: new Date('2024-01-10') }), // included
        createTestExpense({ amount: 200, date: new Date('2023-12-31') }), // excluded
        createTestExpense({ amount: 300, date: new Date('2024-02-01') })  // excluded
      ]
      
      const summary = calculateBudgetSummary(budget, expenses)
      
      expect(summary.totalSpent).toBe(100)
    })
  })

  describe('filterExpenses', () => {
    const expenses = [
      createTestExpense({ 
        id: 'exp-1', 
        amount: 100, 
        categoryId: 'cat-1', 
        description: '午餐',
        date: new Date('2024-01-10') 
      }),
      createTestExpense({ 
        id: 'exp-2', 
        amount: 200, 
        categoryId: 'cat-2', 
        description: '晚餐',
        date: new Date('2024-01-15') 
      }),
      createTestExpense({ 
        id: 'exp-3', 
        amount: 50, 
        categoryId: 'cat-1', 
        description: '咖啡',
        date: new Date('2024-01-20') 
      })
    ]

    it('should filter by category', () => {
      const filter: ExpenseFilter = { categoryId: 'cat-1' }
      const filtered = filterExpenses(expenses, filter)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(exp => exp.categoryId === 'cat-1')).toBe(true)
    })

    it('should filter by date range', () => {
      const filter: ExpenseFilter = { 
        startDate: new Date('2024-01-12'),
        endDate: new Date('2024-01-18')
      }
      const filtered = filterExpenses(expenses, filter)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('exp-2')
    })

    it('should filter by amount range', () => {
      const filter: ExpenseFilter = { 
        minAmount: 75,
        maxAmount: 150
      }
      const filtered = filterExpenses(expenses, filter)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].amount).toBe(100)
    })

    it('should filter by description', () => {
      const filter: ExpenseFilter = { description: '餐' }
      const filtered = filterExpenses(expenses, filter)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(exp => exp.description.includes('餐'))).toBe(true)
    })

    it('should combine multiple filters', () => {
      const filter: ExpenseFilter = { 
        categoryId: 'cat-1',
        minAmount: 75
      }
      const filtered = filterExpenses(expenses, filter)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('exp-1')
    })
  })

  describe('groupExpensesByCategory', () => {
    it('should group expenses by category', () => {
      const categories = [
        createTestCategory(),
        { ...createTestCategory(), id: 'cat-2', name: '交通' }
      ]
      const expenses = [
        createTestExpense({ categoryId: 'category-123' }),
        createTestExpense({ categoryId: 'cat-2' }),
        createTestExpense({ categoryId: 'category-123' })
      ]
      
      const grouped = groupExpensesByCategory(expenses, categories)
      
      expect(grouped['category-123']).toHaveLength(2)
      expect(grouped['cat-2']).toHaveLength(1)
    })
  })

  describe('calculateCategoryTotals', () => {
    it('should calculate correct totals by category', () => {
      const categories = [
        createTestCategory(),
        { ...createTestCategory(), id: 'cat-2', name: '交通' }
      ]
      const expenses = [
        createTestExpense({ categoryId: 'category-123', amount: 100 }),
        createTestExpense({ categoryId: 'cat-2', amount: 200 }),
        createTestExpense({ categoryId: 'category-123', amount: 150 })
      ]
      
      const totals = calculateCategoryTotals(expenses, categories)
      
      expect(totals['category-123']).toBe(250)
      expect(totals['cat-2']).toBe(200)
    })
  })

  describe('sortExpensesByDate', () => {
    it('should sort expenses by date descending by default', () => {
      const expenses = [
        createTestExpense({ date: new Date('2024-01-10') }),
        createTestExpense({ date: new Date('2024-01-20') }),
        createTestExpense({ date: new Date('2024-01-15') })
      ]
      
      const sorted = sortExpensesByDate(expenses)
      
      expect(sorted[0].date.getDate()).toBe(20)
      expect(sorted[1].date.getDate()).toBe(15)
      expect(sorted[2].date.getDate()).toBe(10)
    })

    it('should sort expenses by date ascending when specified', () => {
      const expenses = [
        createTestExpense({ date: new Date('2024-01-20') }),
        createTestExpense({ date: new Date('2024-01-10') }),
        createTestExpense({ date: new Date('2024-01-15') })
      ]
      
      const sorted = sortExpensesByDate(expenses, true)
      
      expect(sorted[0].date.getDate()).toBe(10)
      expect(sorted[1].date.getDate()).toBe(15)
      expect(sorted[2].date.getDate()).toBe(20)
    })
  })

  describe('getExpensesForDate', () => {
    it('should return expenses for specific date', () => {
      const targetDate = new Date('2024-01-15')
      const expenses = [
        createTestExpense({ date: new Date('2024-01-15T10:00:00') }),
        createTestExpense({ date: new Date('2024-01-15T15:30:00') }),
        createTestExpense({ date: new Date('2024-01-16T10:00:00') })
      ]
      
      const filtered = getExpensesForDate(expenses, targetDate)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(exp => exp.date.getDate() === 15)).toBe(true)
    })
  })

  describe('getCurrentMonthExpenses', () => {
    it('should return expenses for current month', () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const expenses = [
        createTestExpense({ date: new Date(currentYear, currentMonth, 10) }),
        createTestExpense({ date: new Date(currentYear, currentMonth, 20) }),
        createTestExpense({ date: new Date(currentYear, currentMonth - 1, 15) }) // previous month
      ]
      
      const filtered = getCurrentMonthExpenses(expenses)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(exp => exp.date.getMonth() === currentMonth)).toBe(true)
    })
  })
})