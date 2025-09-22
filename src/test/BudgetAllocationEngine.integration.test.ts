import { describe, test, expect } from 'vitest'
import { BudgetAllocationEngine } from '../utils/BudgetAllocationEngine'
import type { Budget, Expense } from '../types'

describe('BudgetAllocationEngine Integration Tests', () => {
  test('Real-world scenario: Monthly budget with varied spending patterns', () => {
    const engine = new BudgetAllocationEngine()
    
    // 真实场景：1月份预算1500元，31天
    const budget: Budget = {
      id: 'budget-jan-2024',
      monthlyAmount: 1500,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 模拟真实的消费模式
    const expenses: Expense[] = [
      // 第1天：正常消费
      { id: '1', amount: 45, categoryId: 'food', description: '午餐', date: new Date('2024-01-01'), createdAt: new Date(), updatedAt: new Date() },
      
      // 第2天：节约的一天
      { id: '2', amount: 25, categoryId: 'food', description: '简单早餐', date: new Date('2024-01-02'), createdAt: new Date(), updatedAt: new Date() },
      
      // 第3天：超支（聚餐）
      { id: '3', amount: 120, categoryId: 'food', description: '朋友聚餐', date: new Date('2024-01-03'), createdAt: new Date(), updatedAt: new Date() },
      
      // 第4天：正常消费
      { id: '4', amount: 50, categoryId: 'transport', description: '交通费', date: new Date('2024-01-04'), createdAt: new Date(), updatedAt: new Date() },
      
      // 第5天：购物日
      { id: '5', amount: 80, categoryId: 'shopping', description: '日用品', date: new Date('2024-01-05'), createdAt: new Date(), updatedAt: new Date() }
    ]
    
    const dailyBase = engine.calculateDailyBaseBudget(budget, new Date('2024-01-01'))
    console.log(`日均预算: ${dailyBase.toFixed(2)}元`) // 1500/31 ≈ 48.39元
    
    // 测试第6天的可用预算
    const availableBudgetDay6 = engine.calculateAvailableBudget(
      new Date('2024-01-06'),
      budget,
      expenses
    )
    
    // 计算预期值：
    // 第1天：48.39 - 45 = 3.39 (剩余)
    // 第2天：48.39 - 25 = 23.39 (剩余)
    // 第3天：48.39 - 120 = -71.61 (超支)
    // 第4天：48.39 - 50 = -1.61 (超支)
    // 第5天：48.39 - 80 = -31.61 (超支)
    // 累积：3.39 + 23.39 - 71.61 - 1.61 - 31.61 = -78.05
    // 第6天可用：48.39 - 78.05 = -29.66，但不能为负，所以是0
    
    expect(availableBudgetDay6).toBe(0) // 由于前面超支太多，第6天没有可用预算
    
    // 测试预算重新分配
    const newMonthlyAmount = 2000 // 增加预算到2000元
    const reallocatedBudget = engine.reallocateBudget(
      newMonthlyAmount,
      new Date('2024-01-06'),
      budget,
      expenses
    )
    
    // 已消费：45 + 25 + 120 + 50 + 80 = 320元
    // 剩余预算：2000 - 320 = 1680元
    // 剩余天数：26天（1月6日到31日）
    // 新日均：1680 / 26 ≈ 64.62元
    
    expect(reallocatedBudget.length).toBe(26)
    expect(reallocatedBudget[0].baseAmount).toBeCloseTo(64.62, 2)
    
    console.log(`重新分配后的日均预算: ${reallocatedBudget[0].baseAmount.toFixed(2)}元`)
  })

  test('Budget validation in real scenario', () => {
    const engine = new BudgetAllocationEngine()
    
    const budget: Budget = {
      id: 'test-budget',
      monthlyAmount: 1200,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const validExpenses: Expense[] = [
      { id: '1', amount: 50, categoryId: 'food', description: '正常消费', date: new Date('2024-01-15'), createdAt: new Date(), updatedAt: new Date() }
    ]
    
    const invalidExpenses: Expense[] = [
      { id: '2', amount: -10, categoryId: 'food', description: '无效金额', date: new Date('2024-01-15'), createdAt: new Date(), updatedAt: new Date() },
      { id: '3', amount: 30, categoryId: 'food', description: '超出范围', date: new Date('2023-12-31'), createdAt: new Date(), updatedAt: new Date() }
    ]
    
    const validResult = engine.validateBudgetAllocation(budget, validExpenses)
    expect(validResult.isValid).toBe(true)
    
    const invalidResult = engine.validateBudgetAllocation(budget, invalidExpenses)
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors.length).toBeGreaterThan(0)
  })

  test('Generate complete monthly allocation', () => {
    const engine = new BudgetAllocationEngine()
    
    const budget: Budget = {
      id: 'monthly-budget',
      monthlyAmount: 1500,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-29'), // 闰年2月
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 简单的消费场景
    const expenses: Expense[] = [
      { id: '1', amount: 30, categoryId: 'food', description: '第5天消费', date: new Date('2024-02-05'), createdAt: new Date(), updatedAt: new Date() }
    ]
    
    const dailyBase = 1500 / 29 // 2月有29天，约51.72元
    
    const allocations = engine.generateDailyAllocations(
      new Date('2024-02-01'),
      new Date('2024-02-29'),
      dailyBase,
      budget,
      expenses
    )
    
    expect(allocations).toHaveLength(29)
    
    // 验证第一天
    expect(allocations[0].baseAmount).toBeCloseTo(dailyBase, 2)
    expect(allocations[0].carryOverAmount).toBe(0)
    expect(allocations[0].spentAmount).toBe(0)
    expect(allocations[0].availableAmount).toBeCloseTo(dailyBase, 2)
    expect(allocations[0].remainingAmount).toBeCloseTo(dailyBase, 2)
    
    // 验证第5天（有消费30元）
    expect(allocations[4].spentAmount).toBe(30)
    expect(allocations[4].baseAmount).toBeCloseTo(dailyBase, 2)
    // 第5天应该有前4天的累积
    expect(allocations[4].carryOverAmount).toBeCloseTo(dailyBase * 4, 2)
    expect(allocations[4].availableAmount).toBeCloseTo(dailyBase * 5, 2) // 基础 + 累积
    expect(allocations[4].remainingAmount).toBeCloseTo(dailyBase * 5 - 30, 2)
    
    // 验证第6天有累积金额（具体数值由算法计算）
    expect(allocations[5].carryOverAmount).toBeGreaterThan(0)
    
    // 验证总预算守恒
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.baseAmount, 0)
    expect(totalAllocated).toBeCloseTo(1500, 2)
    
    // 验证所有天数都有正确的基础预算
    allocations.forEach(allocation => {
      expect(allocation.baseAmount).toBeCloseTo(dailyBase, 2)
    })
  })
})