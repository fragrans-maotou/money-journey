import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStatistics } from '@/composables/useStatistics'
import type { Expense, Category } from '@/types'

// Mock the dependencies
vi.mock('@/composables/useExpense', () => ({
  useExpense: () => ({
    categories: { value: mockCategories },
    getExpensesByDateRange: vi.fn((start: Date, end: Date) => {
      return mockExpenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= start && expenseDate <= end
      })
    })
  })
}))

vi.mock('@/composables/useBudget', () => ({
  useBudget: () => ({
    budgetSummary: { value: mockBudgetSummary },
    currentBudget: { value: mockBudget }
  })
}))

const mockCategories: Category[] = [
  { id: '1', name: '餐饮', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { id: '2', name: '交通', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { id: '3', name: '购物', icon: '🛍️', color: '#45B7D1', isDefault: true }
]

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 50,
    categoryId: '1',
    description: '午餐',
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    amount: 30,
    categoryId: '2',
    description: '地铁',
    date: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '3',
    amount: 100,
    categoryId: '3',
    description: '衣服',
    date: new Date('2024-01-17'),
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  }
]

const mockBudget = {
  id: '1',
  monthlyAmount: 3000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  dailyAllocation: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

const mockBudgetSummary = {
  totalBudget: 3000,
  totalSpent: 180,
  remainingBudget: 2820,
  dailyAverage: 96.77,
  daysRemaining: 15,
  isOverBudget: false
}

describe('useStatistics', () => {
  let statisticsComposable: ReturnType<typeof useStatistics>

  beforeEach(() => {
    vi.clearAllMocks()
    statisticsComposable = useStatistics()
  })

  it('should initialize with default period as month', () => {
    expect(statisticsComposable.currentPeriod.value).toBe('month')
  })

  it('should calculate current date range for month period', () => {
    const dateRange = statisticsComposable.currentDateRange.value
    const now = new Date()
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    expect(dateRange.startDate.getMonth()).toBe(expectedStart.getMonth())
    expect(dateRange.startDate.getFullYear()).toBe(expectedStart.getFullYear())
    expect(dateRange.endDate.getMonth()).toBe(expectedEnd.getMonth())
    expect(dateRange.endDate.getFullYear()).toBe(expectedEnd.getFullYear())
  })

  it('should calculate current date range for week period', () => {
    statisticsComposable.setPeriod('week')
    
    const dateRange = statisticsComposable.currentDateRange.value
    const now = new Date()
    const expectedStart = new Date(now)
    expectedStart.setDate(now.getDate() - now.getDay())
    expectedStart.setHours(0, 0, 0, 0)
    
    expect(dateRange.startDate.getDay()).toBe(0) // Sunday
  })

  it('should set custom date range', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-01-31')
    
    statisticsComposable.setCustomDateRange(startDate, endDate)
    
    expect(statisticsComposable.currentPeriod.value).toBe('custom')
    expect(statisticsComposable.currentDateRange.value.startDate).toEqual(startDate)
    expect(statisticsComposable.currentDateRange.value.endDate).toEqual(endDate)
  })

  it('should generate category breakdown', () => {
    const breakdown = statisticsComposable.categoryBreakdown.value
    
    expect(Array.isArray(breakdown)).toBe(true)
    // The breakdown should be sorted by amount descending
    if (breakdown.length > 1) {
      expect(breakdown[0].amount).toBeGreaterThanOrEqual(breakdown[1].amount)
    }
    // Each item should have the required properties
    breakdown.forEach(item => {
      expect(item).toHaveProperty('categoryId')
      expect(item).toHaveProperty('categoryName')
      expect(item).toHaveProperty('amount')
      expect(item).toHaveProperty('percentage')
      expect(item.amount).toBeGreaterThanOrEqual(0)
      expect(item.percentage).toBeGreaterThanOrEqual(0)
    })
  })

  it('should generate daily trend data', () => {
    const trend = statisticsComposable.dailyTrend.value
    
    expect(Array.isArray(trend)).toBe(true)
    // The trend should contain data points for each day in the current period
    expect(trend.length).toBeGreaterThan(0)
  })

  it('should generate current statistics', () => {
    const stats = statisticsComposable.currentStatistics.value
    
    expect(stats.period).toBe('month')
    expect(stats.startDate).toBeInstanceOf(Date)
    expect(stats.endDate).toBeInstanceOf(Date)
    expect(stats.totalSpent).toBeGreaterThanOrEqual(0)
    expect(stats.budgetUtilization).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(stats.categoryBreakdown)).toBe(true)
    expect(Array.isArray(stats.dailyTrend)).toBe(true)
  })

  it('should provide enhanced budget analysis for month period', () => {
    const analysis = statisticsComposable.budgetAnalysis.value
    
    expect(analysis).toBeDefined()
    expect(analysis.totalBudget).toBe(3000)
    expect(analysis.totalSpent).toBe(180)
    expect(analysis.remainingBudget).toBe(2820)
    expect(analysis.achievementRate).toBeCloseTo(6, 1) // 180/3000 * 100
    expect(analysis.projectedMonthEnd).toBeGreaterThanOrEqual(0)
    expect(analysis.savingsOpportunity).toBeGreaterThanOrEqual(0)
    expect(['low', 'medium', 'high']).toContain(analysis.riskLevel)
    expect(['on_track', 'ahead', 'behind', 'over_budget']).toContain(analysis.status)
  })

  it('should provide enhanced historical comparison for month period', () => {
    const comparison = statisticsComposable.historicalComparison.value
    
    expect(comparison).toBeDefined()
    expect(comparison.thisMonth).toBeDefined()
    expect(comparison.thisMonth.averageDaily).toBeGreaterThanOrEqual(0)
    expect(comparison.thisMonth.maxDaily).toBeGreaterThanOrEqual(0)
    expect(comparison.thisMonth.minDaily).toBeGreaterThanOrEqual(0)
    expect(comparison.lastMonth).toBeDefined()
    expect(comparison.change).toBeDefined()
    expect(['increase', 'decrease', 'stable']).toContain(comparison.change.trend)
    expect(Array.isArray(comparison.categoryComparison)).toBe(true)
  })

  it('should get statistics for specific period', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-01-31')
    
    const stats = statisticsComposable.getStatistics('custom', startDate, endDate)
    
    expect(stats.period).toBe('custom')
    expect(stats.startDate).toEqual(startDate)
    expect(stats.endDate).toEqual(endDate)
  })

  it('should get category ranking', () => {
    const ranking = statisticsComposable.getCategoryRanking(2)
    
    expect(ranking.length).toBeLessThanOrEqual(2)
    // Should be sorted by amount descending
    if (ranking.length > 1) {
      expect(ranking[0].amount).toBeGreaterThanOrEqual(ranking[1].amount)
    }
  })

  it('should get enhanced trend analysis', () => {
    const trendAnalysis = statisticsComposable.getTrendAnalysis()
    
    expect(trendAnalysis).toBeDefined()
    expect(['increasing', 'decreasing', 'stable']).toContain(trendAnalysis.direction)
    expect(trendAnalysis.averageDaily).toBeGreaterThanOrEqual(0)
    expect(trendAnalysis.maxDaily).toBeGreaterThanOrEqual(0)
    expect(trendAnalysis.minDaily).toBeGreaterThanOrEqual(0)
    expect(trendAnalysis.volatility).toBeGreaterThanOrEqual(0)
    expect(trendAnalysis.weekdayAverage).toBeGreaterThanOrEqual(0)
    expect(trendAnalysis.weekendAverage).toBeGreaterThanOrEqual(0)
    expect(typeof trendAnalysis.momentum).toBe('number')
  })

  it('should get custom period analysis', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-01-31')
    
    const analysis = statisticsComposable.getCustomPeriodAnalysis(startDate, endDate)
    
    expect(analysis).toBeDefined()
    expect(analysis.period).toBe('custom')
    expect(analysis.startDate).toEqual(startDate)
    expect(analysis.endDate).toEqual(endDate)
    expect(analysis.totalDays).toBeGreaterThan(0)
    expect(analysis.statistics).toBeDefined()
    expect(analysis.trends).toBeDefined()
    expect(Array.isArray(analysis.insights)).toBe(true)
  })

  it('should clear error', () => {
    // Set an error first
    statisticsComposable.error.value = 'Test error'
    
    statisticsComposable.clearError()
    
    expect(statisticsComposable.error.value).toBeNull()
  })
})