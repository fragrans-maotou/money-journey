import { describe, test, expect, beforeEach } from 'vitest'
import { BudgetAllocationEngine } from '../utils/BudgetAllocationEngine'
import type { Budget, Expense } from '../types'

describe('BudgetAllocationEngine', () => {
  let engine: BudgetAllocationEngine
  let mockBudget: Budget
  let mockExpenses: Expense[]

  beforeEach(() => {
    engine = new BudgetAllocationEngine()
    
    // 创建模拟预算：月预算1200元，2024年1月1日到31日
    mockBudget = {
      id: 'budget-1',
      monthlyAmount: 1200,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockExpenses = []
  })

  describe('calculateDailyBaseBudget', () => {
    test('should calculate correct daily base budget', () => {
      const dailyBudget = engine.calculateDailyBaseBudget(mockBudget, new Date('2024-01-15'))
      
      // 1月有31天，1200/31 ≈ 38.71
      expect(dailyBudget).toBeCloseTo(38.71, 2)
    })

    test('should handle different month lengths', () => {
      const februaryBudget = {
        ...mockBudget,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'), // 2024是闰年
        monthlyAmount: 1160
      }
      
      const dailyBudget = engine.calculateDailyBaseBudget(februaryBudget, new Date('2024-02-15'))
      
      // 2月有29天，1160/29 = 40
      expect(dailyBudget).toBe(40)
    })
  })

  describe('calculateAvailableBudget - 余额累进机制', () => {
    test('should carry over remaining budget to next day', () => {
      // 第一天消费30元，日均预算38.71元
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '午餐',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-02'), 
        mockBudget, 
        mockExpenses
      )
      
      // 第一天剩余 38.71 - 30 = 8.71
      // 第二天可用 = 38.71 + 8.71 = 47.42
      expect(availableBudget).toBeCloseTo(47.42, 2)
    })

    test('should handle multiple days of carry over', () => {
      // 前三天都有剩余
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 20, // 剩余 18.71
          categoryId: 'cat-1',
          description: '第一天',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-2',
          amount: 25, // 剩余 13.71
          categoryId: 'cat-1',
          description: '第二天',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-3',
          amount: 30, // 剩余 8.71
          categoryId: 'cat-1',
          description: '第三天',
          date: new Date('2024-01-03'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-04'), 
        mockBudget, 
        mockExpenses
      )
      
      // 累积剩余 = 18.71 + 13.71 + 8.71 = 41.13
      // 第四天可用 = 38.71 + 41.13 = 79.84
      expect(availableBudget).toBeCloseTo(79.84, 2)
    })

    test('should handle overspending correctly', () => {
      // 第一天超支
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 50, // 超支 50 - 38.71 = 11.29
          categoryId: 'cat-1',
          description: '超支消费',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-02'), 
        mockBudget, 
        mockExpenses
      )
      
      // 第一天超支 -11.29
      // 第二天可用 = 38.71 - 11.29 = 27.42
      expect(availableBudget).toBeCloseTo(27.42, 2)
    })

    test('should handle mixed scenarios (some days over, some under)', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 20, // 剩余 18.71
          categoryId: 'cat-1',
          description: '节约的一天',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-2',
          amount: 60, // 超支 -21.29
          categoryId: 'cat-1',
          description: '超支的一天',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-03'), 
        mockBudget, 
        mockExpenses
      )
      
      // 累积 = 18.71 - 21.29 = -2.58
      // 第三天可用 = 38.71 - 2.58 = 36.13
      expect(availableBudget).toBeCloseTo(36.13, 2)
    })

    test('should never return negative available budget', () => {
      // 连续多天大幅超支
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 100,
          categoryId: 'cat-1',
          description: '大额消费1',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exp-2',
          amount: 100,
          categoryId: 'cat-1',
          description: '大额消费2',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-03'), 
        mockBudget, 
        mockExpenses
      )
      
      // 即使累积超支很多，可用预算也不应该为负数
      expect(availableBudget).toBeGreaterThanOrEqual(0)
    })

    test('should handle first day of budget period', () => {
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-01'), 
        mockBudget, 
        mockExpenses
      )
      
      // 第一天没有累积，应该等于日均预算
      expect(availableBudget).toBeCloseTo(38.71, 2)
    })
  })

  describe('reallocateBudget', () => {
    test('should reallocate budget when monthly amount changes', () => {
      // 假设已经到了1月15日，前面已经消费了300元
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 300,
          categoryId: 'cat-1',
          description: '前半月消费',
          date: new Date('2024-01-10'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const newMonthlyAmount = 1500 // 增加预算到1500
      const currentDate = new Date('2024-01-15')
      
      const newAllocations = engine.reallocateBudget(
        newMonthlyAmount,
        currentDate,
        mockBudget,
        mockExpenses
      )
      
      // 剩余天数：1月15日到31日 = 17天
      // 剩余预算：1500 - 300 = 1200
      // 新的日均预算：1200 / 17 ≈ 70.59
      
      expect(newAllocations.length).toBe(17)
      expect(newAllocations[0].baseAmount).toBeCloseTo(70.59, 2)
    })

    test('should handle budget reduction', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 200,
          categoryId: 'cat-1',
          description: '已消费',
          date: new Date('2024-01-05'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const newMonthlyAmount = 800 // 减少预算到800
      const currentDate = new Date('2024-01-10')
      
      const newAllocations = engine.reallocateBudget(
        newMonthlyAmount,
        currentDate,
        mockBudget,
        mockExpenses
      )
      
      // 剩余天数：1月10日到31日 = 22天
      // 剩余预算：800 - 200 = 600
      // 新的日均预算：600 / 22 ≈ 27.27
      
      expect(newAllocations.length).toBe(22)
      expect(newAllocations[0].baseAmount).toBeCloseTo(27.27, 2)
    })
  })

  describe('generateDailyAllocations', () => {
    test('should generate correct daily allocations', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 30,
          categoryId: 'cat-1',
          description: '第一天消费',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const allocations = engine.generateDailyAllocations(
        new Date('2024-01-01'),
        new Date('2024-01-03'),
        40, // 日均预算40元
        mockBudget,
        mockExpenses
      )
      
      expect(allocations).toHaveLength(3)
      
      // 第一天
      expect(allocations[0].baseAmount).toBe(40)
      expect(allocations[0].spentAmount).toBe(30)
      expect(allocations[0].carryOverAmount).toBe(0) // 第一天没有累积
      expect(allocations[0].availableAmount).toBe(40)
      expect(allocations[0].remainingAmount).toBe(10)
      
      // 第二天
      expect(allocations[1].baseAmount).toBe(40)
      expect(allocations[1].spentAmount).toBe(0)
      expect(allocations[1].carryOverAmount).toBe(10) // 第一天剩余10元
      expect(allocations[1].availableAmount).toBe(50)
      expect(allocations[1].remainingAmount).toBe(50)
      
      // 第三天
      expect(allocations[2].baseAmount).toBe(40)
      expect(allocations[2].spentAmount).toBe(0)
      expect(allocations[2].carryOverAmount).toBe(50) // 累积前两天剩余：第一天10 + 第二天40 = 50
      expect(allocations[2].availableAmount).toBe(90)
      expect(allocations[2].remainingAmount).toBe(90)
    })
  })

  describe('validateBudgetAllocation', () => {
    test('should validate correct budget and expenses', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 50,
          categoryId: 'cat-1',
          description: '正常消费',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const result = engine.validateBudgetAllocation(mockBudget, mockExpenses)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect invalid budget amount', () => {
      const invalidBudget = { ...mockBudget, monthlyAmount: 0 }
      
      const result = engine.validateBudgetAllocation(invalidBudget, mockExpenses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('月度预算金额必须大于0')
    })

    test('should detect invalid date range', () => {
      const invalidBudget = {
        ...mockBudget,
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01')
      }
      
      const result = engine.validateBudgetAllocation(invalidBudget, mockExpenses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('开始日期必须早于结束日期')
    })

    test('should detect expenses outside budget period', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 50,
          categoryId: 'cat-1',
          description: '超出范围的消费',
          date: new Date('2023-12-31'), // 在预算期之前
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const result = engine.validateBudgetAllocation(mockBudget, mockExpenses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('消费记录的日期超出预算时间范围'))).toBe(true)
    })

    test('should detect invalid expense amounts', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: -10, // 负数金额
          categoryId: 'cat-1',
          description: '无效金额',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const result = engine.validateBudgetAllocation(mockBudget, mockExpenses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('消费记录的金额无效'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty expenses array', () => {
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-15'),
        mockBudget,
        []
      )
      
      // 没有消费，前14天每天都有剩余38.71元
      // 第15天可用 = 38.71 + (38.71 * 14) = 580.65
      expect(availableBudget).toBeCloseTo(580.65, 2)
    })

    test('should handle single day budget period', () => {
      const singleDayBudget = {
        ...mockBudget,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
        monthlyAmount: 100
      }
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-01'),
        singleDayBudget,
        []
      )
      
      expect(availableBudget).toBe(100)
    })

    test('should handle budget period end date', () => {
      mockExpenses = [
        {
          id: 'exp-1',
          amount: 20,
          categoryId: 'cat-1',
          description: '最后一天消费',
          date: new Date('2024-01-30'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const availableBudget = engine.calculateAvailableBudget(
        new Date('2024-01-31'),
        mockBudget,
        mockExpenses
      )
      
      // 应该能正确处理预算期的最后一天
      expect(availableBudget).toBeGreaterThan(0)
    })
  })
})