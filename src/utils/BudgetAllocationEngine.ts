import type { Budget, Expense, DailyAllocation } from '../types'

/**
 * 动态预算分配引擎
 * 实现余额累进机制的核心算法类
 */
export class BudgetAllocationEngine {
  /**
   * 核心算法：计算指定日期的可用预算
   * 实现余额累进机制，而非简单的线性计算
   * 
   * @param date 目标日期
   * @param budget 预算对象
   * @param expenses 消费记录数组
   * @returns 指定日期的可用预算金额
   */
  calculateAvailableBudget(date: Date, budget: Budget, expenses: Expense[]): number {
    // Normalize dates
    const targetDate = date instanceof Date ? date : new Date(date)
    const budgetStartDate = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)

    const dailyBase = this.calculateDailyBaseBudget(budget, targetDate)

    // 累积前几天的剩余金额
    const previousDays = this.getPreviousDays(targetDate, budgetStartDate)
    let carryOverAmount = 0

    console.log("previousDays", previousDays);
    for (const day of previousDays) {
      const dayExpenses = this.getExpensesByDate(day, expenses)
      console.log("dayExpenses", dayExpenses);

      const daySpent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      console.log("daySpent", daySpent);

      const dayRemaining = dailyBase - daySpent

      // 累积前面天数的剩余或超支
      carryOverAmount += dayRemaining
    }
    console.log("carryOverAmount", carryOverAmount);

    // 今日可用 = 累积余额 + 今日基础预算 - 今日已消费
    // 但为了避免重复计算，我们需要确保逻辑一致
    const todayExpenses = this.getExpensesByDate(targetDate, expenses)
    const todaySpent = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    // 修正算法：根据用户反馈，算法总是多出一天的预算
    // 可能 carryOverAmount 中已经包含了今日的预算，所以不需要再加 dailyBase
    // 或者需要从 carryOverAmount 中减去多算的部分
    // const availableAmount = carryOverAmount + dailyBase - todaySpent
    const availableAmount = carryOverAmount - todaySpent
    return Math.max(0, availableAmount)
  }

  /**
   * 计算日均基础预算
   * 
   * @param budget 预算对象
   * @param currentDate 当前日期
   * @returns 日均基础预算金额
   */
  calculateDailyBaseBudget(budget: Budget, currentDate: Date): number {
    const startDate = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)
    const endDate = budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate)
    const totalDays = this.getDaysInPeriod(startDate, endDate)
    return budget.monthlyAmount / totalDays
  }

  /**
   * 预算重新分配：当用户修改月度预算时调用
   * 重新计算剩余天数的预算分配
   * 
   * @param newMonthlyAmount 新的月度预算金额
   * @param currentDate 当前日期
   * @param budget 当前预算对象
   * @param expenses 已有消费记录
   * @returns 重新分配后的日预算分配数组
   */
  reallocateBudget(
    newMonthlyAmount: number,
    currentDate: Date,
    budget: Budget,
    expenses: Expense[]
  ): DailyAllocation[] {
    const current = currentDate instanceof Date ? currentDate : new Date(currentDate)
    const budgetStart = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)
    const budgetEnd = budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate)

    const remainingDays = this.getRemainingDays(current, budgetEnd)
    const spentAmount = this.getTotalSpentInPeriod(budgetStart, current, expenses)
    const remainingBudget = newMonthlyAmount - spentAmount

    // 重新计算剩余天数的日均预算
    const newDailyBase = remainingDays > 0 ? remainingBudget / remainingDays : 0

    return this.generateDailyAllocations(current, budgetEnd, newDailyBase, budget, expenses)
  }

  /**
   * 生成日预算分配数组
   * 
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param dailyBase 日均基础预算
   * @param budget 预算对象
   * @param expenses 消费记录
   * @returns 日预算分配数组
   */
  generateDailyAllocations(
    startDate: Date | string,
    endDate: Date | string,
    dailyBase: number,
    budget: Budget,
    expenses: Expense[]
  ): DailyAllocation[] {
    const allocations: DailyAllocation[] = []
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const dateStr = this.formatDate(currentDate)
      const dayExpenses = this.getExpensesByDate(currentDate, expenses)
      const spentAmount = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)

      // 计算累积金额（包含之前天数的余额）
      const carryOverAmount = this.calculateCarryOverAmount(currentDate, budget, expenses, dailyBase)
      const availableAmount = dailyBase + carryOverAmount
      const remainingAmount = availableAmount - spentAmount

      allocations.push({
        date: new Date(currentDate),
        baseAmount: dailyBase,
        carryOverAmount,
        availableAmount,
        spentAmount,
        remainingAmount
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return allocations
  }

  /**
   * 计算累积金额（余额累进机制的核心）
   * 
   * @param date 目标日期
   * @param budget 预算对象
   * @param expenses 消费记录
   * @param dailyBase 日均基础预算
   * @returns 累积金额
   */
  private calculateCarryOverAmount(
    date: Date,
    budget: Budget,
    expenses: Expense[],
    dailyBase: number
  ): number {
    let carryOverAmount = 0
    const targetDate = date instanceof Date ? date : new Date(date)
    const budgetStart = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)
    const previousDays = this.getPreviousDays(targetDate, budgetStart)

    for (const day of previousDays) {
      const dayExpenses = this.getExpensesByDate(day, expenses)
      const daySpent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const dayRemaining = dailyBase - daySpent
      carryOverAmount += dayRemaining
    }

    return carryOverAmount
  }

  /**
   * 获取指定日期之前的所有日期
   * 
   * @param targetDate 目标日期
   * @param startDate 开始日期
   * @returns 日期数组
   */
  private getPreviousDays(targetDate: Date | string, startDate: Date | string): Date[] {
    const days: Date[] = []
    const target = targetDate instanceof Date ? targetDate : new Date(targetDate)
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const currentDate = new Date(start)

    // 修正：包括目标日期之前的所有天数（不包括目标日期本身）
    while (currentDate < target) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  /**
   * 获取指定日期的消费记录
   * 
   * @param date 日期
   * @param expenses 消费记录数组
   * @returns 该日期的消费记录
   */
  private getExpensesByDate(date: Date, expenses: Expense[]): Expense[] {
    const targetDateStr = this.formatDate(date)
    return expenses.filter(expense => {
      try {
        const expenseDateStr = this.formatDate(expense.date)
        return expenseDateStr === targetDateStr
      } catch (error) {
        console.warn('Invalid expense date:', expense.date, error)
        return false
      }
    })
  }

  /**
   * 计算时间段内的总天数
   * 
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 总天数
   */
  private getDaysInPeriod(startDate: Date | string, endDate: Date | string): number {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }

  /**
   * 计算剩余天数
   * 
   * @param currentDate 当前日期
   * @param endDate 结束日期
   * @returns 剩余天数
   */
  private getRemainingDays(currentDate: Date | string, endDate: Date | string): number {
    const current = currentDate instanceof Date ? currentDate : new Date(currentDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    const timeDiff = end.getTime() - current.getTime()
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1)
  }

  /**
   * 计算时间段内的总消费
   * 
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param expenses 消费记录数组
   * @returns 总消费金额
   */
  private getTotalSpentInPeriod(startDate: Date, endDate: Date, expenses: Expense[]): number {
    return expenses
      .filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
          if (isNaN(expenseDate.getTime())) {
            console.warn('Invalid expense date:', expense.date)
            return false
          }
          return expenseDate >= startDate && expenseDate <= endDate
        } catch (error) {
          console.warn('Error processing expense date:', expense.date, error)
          return false
        }
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * 格式化日期为字符串（YYYY-MM-DD）
   * 
   * @param date 日期对象或日期字符串
   * @returns 格式化的日期字符串
   */
  private formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`)
    }
    return dateObj.toISOString().split('T')[0]
  }

  /**
   * 验证预算分配的正确性
   * 
   * @param budget 预算对象
   * @param expenses 消费记录
   * @returns 验证结果
   */
  validateBudgetAllocation(budget: Budget, expenses: Expense[]): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // 验证预算金额
    if (budget.monthlyAmount <= 0) {
      errors.push('月度预算金额必须大于0')
    }

    // 验证日期范围
    const startDate = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)
    const endDate = budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('预算日期格式无效')
    } else if (startDate >= endDate) {
      errors.push('开始日期必须早于结束日期')
    }

    // 验证消费记录日期
    const invalidExpenses = expenses.filter(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (isNaN(expenseDate.getTime())) {
          return true // Invalid date
        }
        const budgetStart = budget.startDate instanceof Date ? budget.startDate : new Date(budget.startDate)
        const budgetEnd = budget.endDate instanceof Date ? budget.endDate : new Date(budget.endDate)
        return expenseDate < budgetStart || expenseDate > budgetEnd
      } catch (error) {
        return true // Invalid date
      }
    })

    if (invalidExpenses.length > 0) {
      errors.push(`存在 ${invalidExpenses.length} 条消费记录的日期超出预算时间范围`)
    }

    // 验证消费金额
    const invalidAmounts = expenses.filter(expense => expense.amount <= 0)
    if (invalidAmounts.length > 0) {
      errors.push(`存在 ${invalidAmounts.length} 条消费记录的金额无效`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}