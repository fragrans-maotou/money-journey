import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import type {
  Statistics,
  CategoryStat,
  DailyTrendPoint,
  StatisticsPeriod,
  Expense,
  HistoricalComparison,
  BudgetAnalysis,
  TrendAnalysis,
  CustomPeriodAnalysis,
  CategoryComparison
} from '@/types'
import { useExpense } from './useExpense'
import { useBudget } from './useBudget'

/**
 * 统计分析 Composable
 * 提供消费分类统计、趋势分析、预算达成率分析等功能
 */
export function useStatistics() {
  // ============================================================================
  // Dependencies
  // ============================================================================

  const { categories, getExpensesByDateRange } = useExpense()
  const { budgetSummary, currentBudget } = useBudget()

  // ============================================================================
  // Reactive State
  // ============================================================================

  const currentPeriod = ref<StatisticsPeriod>('month')
  const customStartDate = ref<Date>(new Date())
  const customEndDate = ref<Date>(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * 当前统计时间范围
   */
  const currentDateRange = computed(() => {
    const now = new Date()
    
    switch (currentPeriod.value) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // 本周开始（周日）
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // 本周结束（周六）
        weekEnd.setHours(23, 59, 59, 999)
        
        return { startDate: weekStart, endDate: weekEnd }
        
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)
        
        return { startDate: monthStart, endDate: monthEnd }
        
      case 'custom':
        return {
          startDate: customStartDate.value,
          endDate: customEndDate.value
        }
        
      default:
        return { startDate: now, endDate: now }
    }
  })

  /**
   * 当前时间段的消费记录
   */
  const currentPeriodExpenses = computed(() => {
    const { startDate, endDate } = currentDateRange.value
    return getExpensesByDateRange(startDate, endDate)
  })

  /**
   * 消费分类统计
   */
  const categoryBreakdown = computed((): CategoryStat[] => {
    const periodExpenses = currentPeriodExpenses.value
    const totalAmount = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // 按分类汇总
    const categoryMap = new Map<string, { amount: number; count: number }>()
    
    periodExpenses.forEach(expense => {
      if (!categoryMap.has(expense.categoryId)) {
        categoryMap.set(expense.categoryId, { amount: 0, count: 0 })
      }
      const stat = categoryMap.get(expense.categoryId)!
      stat.amount += expense.amount
      stat.count += 1
    })

    // 转换为 CategoryStat 数组
    const categoryStats: CategoryStat[] = Array.from(categoryMap.entries()).map(([categoryId, stat]) => {
      const category = categories.value.find(cat => cat.id === categoryId)
      return {
        categoryId,
        categoryName: category?.name || '未知分类',
        amount: stat.amount,
        percentage: totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0
      }
    })

    // 按金额降序排列
    return categoryStats.sort((a, b) => b.amount - a.amount)
  })

  /**
   * 日消费趋势数据
   */
  const dailyTrend = computed((): DailyTrendPoint[] => {
    const { startDate, endDate } = currentDateRange.value
    const periodExpenses = currentPeriodExpenses.value
    
    // 生成日期范围内的所有日期
    const dates: Date[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    // 按日期汇总消费
    const dailyMap = new Map<string, number>()
    
    periodExpenses.forEach(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (!isNaN(expenseDate.getTime())) {
          const dateKey = expenseDate.toISOString().split('T')[0]
          dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + expense.amount)
        }
      } catch (error) {
        console.warn('Invalid expense date in daily trend:', expense.date, error)
      }
    })

    // 生成趋势数据点
    return dates.map(date => ({
      date: new Date(date),
      amount: dailyMap.get(date.toISOString().split('T')[0]) || 0
    }))
  })

  /**
   * 当前统计数据
   */
  const currentStatistics = computed((): Statistics => {
    const { startDate, endDate } = currentDateRange.value
    const periodExpenses = currentPeriodExpenses.value
    const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // 计算预算利用率
    let budgetUtilization = 0
    if (currentBudget.value && currentPeriod.value === 'month') {
      budgetUtilization = currentBudget.value.monthlyAmount > 0 
        ? (totalSpent / currentBudget.value.monthlyAmount) * 100 
        : 0
    }

    return {
      period: currentPeriod.value,
      startDate,
      endDate,
      totalSpent,
      budgetUtilization,
      categoryBreakdown: categoryBreakdown.value,
      dailyTrend: dailyTrend.value
    }
  })

  /**
   * 增强的预算执行情况分析
   */
  const budgetAnalysis = computed((): BudgetAnalysis | null => {
    if (!currentBudget.value || currentPeriod.value !== 'month') {
      return null
    }

    const summary = budgetSummary.value
    const totalSpent = summary.totalSpent
    const totalBudget = summary.totalBudget
    const remainingBudget = summary.remainingBudget
    const daysRemaining = summary.daysRemaining
    
    // 计算预算达成率
    const achievementRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    
    // 计算预期消费进度（基于时间进度）
    const now = new Date()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const totalDays = monthEnd.getDate()
    const passedDays = now.getDate()
    const expectedProgress = (passedDays / totalDays) * 100
    
    // 计算实际消费进度
    const actualProgress = achievementRate
    
    // 计算日均消费
    const dailyAverageSpent = passedDays > 0 ? totalSpent / passedDays : 0
    const recommendedDailySpend = daysRemaining > 0 ? remainingBudget / daysRemaining : 0
    
    // 预测月末消费
    const projectedMonthEnd = dailyAverageSpent * totalDays
    
    // 计算节省机会
    const savingsOpportunity = Math.max(0, projectedMonthEnd - totalBudget)
    
    // 分析消费状态和风险等级
    let status: 'on_track' | 'ahead' | 'behind' | 'over_budget' = 'on_track'
    let message = ''
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (actualProgress > 100) {
      status = 'over_budget'
      message = '已超出月度预算'
      riskLevel = 'high'
    } else if (projectedMonthEnd > totalBudget * 1.1) {
      status = 'ahead'
      message = '按当前消费速度，月末可能超预算'
      riskLevel = 'high'
    } else if (actualProgress > expectedProgress + 15) {
      status = 'ahead'
      message = '消费进度明显超前，建议控制支出'
      riskLevel = 'medium'
    } else if (actualProgress > expectedProgress + 5) {
      status = 'ahead'
      message = '消费进度略微超前，需要注意'
      riskLevel = 'low'
    } else if (actualProgress < expectedProgress - 15) {
      status = 'behind'
      message = '消费进度较慢，预算控制优秀'
      riskLevel = 'low'
    } else if (actualProgress < expectedProgress - 5) {
      status = 'behind'
      message = '消费进度稍慢，预算控制良好'
      riskLevel = 'low'
    } else {
      status = 'on_track'
      message = '消费进度正常，保持当前节奏'
      riskLevel = 'low'
    }

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      achievementRate,
      expectedProgress,
      actualProgress,
      daysRemaining,
      status,
      message,
      isOverBudget: summary.isOverBudget,
      dailyAverageSpent,
      recommendedDailySpend,
      projectedMonthEnd,
      savingsOpportunity,
      riskLevel
    }
  })

  /**
   * 增强的历史对比数据（与上月同期对比）
   */
  const historicalComparison = computed((): HistoricalComparison | null => {
    if (currentPeriod.value !== 'month') {
      return null
    }

    const now = new Date()
    const thisMonth = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }
    
    const lastMonth = {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    }

    // 获取本月和上月的消费数据
    const thisMonthExpenses = getExpensesByDateRange(thisMonth.start, thisMonth.end)
    const lastMonthExpenses = getExpensesByDateRange(lastMonth.start, lastMonth.end)

    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // 计算每日统计
    const thisMonthDailyAmounts = calculateDailyAmounts(thisMonthExpenses, thisMonth.start, thisMonth.end)
    const lastMonthDailyAmounts = calculateDailyAmounts(lastMonthExpenses, lastMonth.start, lastMonth.end)

    const thisMonthMaxDaily = Math.max(...thisMonthDailyAmounts, 0)
    const thisMonthMinDaily = thisMonthDailyAmounts.length > 0 ? Math.min(...thisMonthDailyAmounts.filter(amount => amount > 0)) : 0
    const thisMonthAverageDaily = thisMonthDailyAmounts.length > 0 ? thisMonthTotal / thisMonthDailyAmounts.length : 0

    const lastMonthMaxDaily = Math.max(...lastMonthDailyAmounts, 0)
    const lastMonthMinDaily = lastMonthDailyAmounts.length > 0 ? Math.min(...lastMonthDailyAmounts.filter(amount => amount > 0)) : 0
    const lastMonthAverageDaily = lastMonthDailyAmounts.length > 0 ? lastMonthTotal / lastMonthDailyAmounts.length : 0

    // 计算变化率
    const changeAmount = thisMonthTotal - lastMonthTotal
    const changePercentage = lastMonthTotal > 0 ? (changeAmount / lastMonthTotal) * 100 : 0

    // 按分类对比
    const thisMonthByCategory = new Map<string, number>()
    const lastMonthByCategory = new Map<string, number>()

    thisMonthExpenses.forEach(expense => {
      thisMonthByCategory.set(expense.categoryId, (thisMonthByCategory.get(expense.categoryId) || 0) + expense.amount)
    })

    lastMonthExpenses.forEach(expense => {
      lastMonthByCategory.set(expense.categoryId, (lastMonthByCategory.get(expense.categoryId) || 0) + expense.amount)
    })

    // 生成分类对比数据
    const categoryComparison: CategoryComparison[] = Array.from(new Set([
      ...thisMonthByCategory.keys(),
      ...lastMonthByCategory.keys()
    ])).map(categoryId => {
      const category = categories.value.find(cat => cat.id === categoryId)
      const thisMonthAmount = thisMonthByCategory.get(categoryId) || 0
      const lastMonthAmount = lastMonthByCategory.get(categoryId) || 0
      const categoryChange = thisMonthAmount - lastMonthAmount
      const categoryChangePercentage = lastMonthAmount > 0 ? (categoryChange / lastMonthAmount) * 100 : 0

      return {
        categoryId,
        categoryName: category?.name || '未知分类',
        thisMonth: thisMonthAmount,
        lastMonth: lastMonthAmount,
        change: categoryChange,
        changePercentage: categoryChangePercentage
      }
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    // 预算对比（如果有预算数据）
    let budgetComparison: BudgetComparison | undefined
    if (currentBudget.value) {
      const thisMonthBudget = currentBudget.value.monthlyAmount
      const thisMonthAchievement = thisMonthBudget > 0 ? (thisMonthTotal / thisMonthBudget) * 100 : 0
      
      // 假设上月预算相同（实际应用中可以从历史数据获取）
      const lastMonthBudget = thisMonthBudget
      const lastMonthAchievement = lastMonthBudget > 0 ? (lastMonthTotal / lastMonthBudget) * 100 : 0
      
      budgetComparison = {
        thisMonthBudget,
        lastMonthBudget,
        thisMonthAchievement,
        lastMonthAchievement,
        achievementChange: thisMonthAchievement - lastMonthAchievement
      }
    }

    return {
      thisMonth: {
        total: thisMonthTotal,
        count: thisMonthExpenses.length,
        period: `${thisMonth.start.getFullYear()}年${thisMonth.start.getMonth() + 1}月`,
        averageDaily: thisMonthAverageDaily,
        maxDaily: thisMonthMaxDaily,
        minDaily: thisMonthMinDaily
      },
      lastMonth: {
        total: lastMonthTotal,
        count: lastMonthExpenses.length,
        period: `${lastMonth.start.getFullYear()}年${lastMonth.start.getMonth() + 1}月`,
        averageDaily: lastMonthAverageDaily,
        maxDaily: lastMonthMaxDaily,
        minDaily: lastMonthMinDaily
      },
      change: {
        amount: changeAmount,
        percentage: changePercentage,
        trend: changeAmount > 0 ? 'increase' : changeAmount < 0 ? 'decrease' : 'stable'
      },
      categoryComparison,
      budgetComparison
    }
  })

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * 设置统计时间段
   */
  const setPeriod = (period: StatisticsPeriod): void => {
    currentPeriod.value = period
  }

  /**
   * 设置自定义时间范围
   */
  const setCustomDateRange = (startDate: Date, endDate: Date): void => {
    customStartDate.value = startDate
    customEndDate.value = endDate
    currentPeriod.value = 'custom'
  }

  /**
   * 获取指定时间段的统计数据
   */
  const getStatistics = (period: StatisticsPeriod, startDate?: Date, endDate?: Date): Statistics => {
    let dateRange: { startDate: Date; endDate: Date }

    if (period === 'custom' && startDate && endDate) {
      dateRange = { startDate, endDate }
    } else {
      const now = new Date()
      
      switch (period) {
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          weekStart.setHours(0, 0, 0, 0)
          
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)
          
          dateRange = { startDate: weekStart, endDate: weekEnd }
          break
          
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          monthEnd.setHours(23, 59, 59, 999)
          
          dateRange = { startDate: monthStart, endDate: monthEnd }
          break
          
        default:
          dateRange = { startDate: now, endDate: now }
      }
    }

    const periodExpenses = getExpensesByDateRange(dateRange.startDate, dateRange.endDate)
    const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // 生成分类统计
    const categoryMap = new Map<string, number>()
    periodExpenses.forEach(expense => {
      categoryMap.set(expense.categoryId, (categoryMap.get(expense.categoryId) || 0) + expense.amount)
    })

    const categoryBreakdown: CategoryStat[] = Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
      const category = categories.value.find(cat => cat.id === categoryId)
      return {
        categoryId,
        categoryName: category?.name || '未知分类',
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }
    }).sort((a, b) => b.amount - a.amount)

    // 生成日趋势数据
    const dailyMap = new Map<string, number>()
    periodExpenses.forEach(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (!isNaN(expenseDate.getTime())) {
          const dateKey = expenseDate.toISOString().split('T')[0]
          dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + expense.amount)
        }
      } catch (error) {
        console.warn('Invalid expense date in statistics:', expense.date, error)
      }
    })

    const dates: Date[] = []
    const current = new Date(dateRange.startDate)
    while (current <= dateRange.endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const dailyTrend: DailyTrendPoint[] = dates.map(date => ({
      date: new Date(date),
      amount: dailyMap.get(date.toISOString().split('T')[0]) || 0
    }))

    // 计算预算利用率
    let budgetUtilization = 0
    if (currentBudget.value && period === 'month') {
      budgetUtilization = currentBudget.value.monthlyAmount > 0 
        ? (totalSpent / currentBudget.value.monthlyAmount) * 100 
        : 0
    }

    return {
      period,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalSpent,
      budgetUtilization,
      categoryBreakdown,
      dailyTrend
    }
  }

  /**
   * 获取消费排行榜（按分类）
   */
  const getCategoryRanking = (limit: number = 5) => {
    return categoryBreakdown.value.slice(0, limit)
  }

  /**
   * 获取增强的消费趋势分析
   */
  const getTrendAnalysis = (): TrendAnalysis => {
    const trend = dailyTrend.value
    if (trend.length < 2) {
      return {
        direction: 'stable',
        averageDaily: 0,
        maxDaily: 0,
        minDaily: 0,
        volatility: 0,
        firstHalfAverage: 0,
        secondHalfAverage: 0,
        weekdayAverage: 0,
        weekendAverage: 0,
        momentum: 0
      }
    }

    const amounts = trend.map(point => point.amount)
    const total = amounts.reduce((sum, amount) => sum + amount, 0)
    const averageDaily = total / amounts.length
    const maxDaily = Math.max(...amounts)
    const minDaily = Math.min(...amounts)

    // 计算波动性（标准差）
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageDaily, 2), 0) / amounts.length
    const volatility = Math.sqrt(variance)

    // 判断趋势方向
    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2))
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2))
    const firstHalfAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length

    // 计算工作日和周末平均消费
    const weekdayAmounts: number[] = []
    const weekendAmounts: number[] = []
    
    trend.forEach(point => {
      const dayOfWeek = point.date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 周末
        weekendAmounts.push(point.amount)
      } else { // 工作日
        weekdayAmounts.push(point.amount)
      }
    })

    const weekdayAverage = weekdayAmounts.length > 0 
      ? weekdayAmounts.reduce((sum, amount) => sum + amount, 0) / weekdayAmounts.length 
      : 0
    const weekendAverage = weekendAmounts.length > 0 
      ? weekendAmounts.reduce((sum, amount) => sum + amount, 0) / weekendAmounts.length 
      : 0

    // 计算动量（最近几天的趋势强度）
    const recentDays = Math.min(7, amounts.length)
    const recentAmounts = amounts.slice(-recentDays)
    const recentAverage = recentAmounts.reduce((sum, amount) => sum + amount, 0) / recentAmounts.length
    const momentum = averageDaily > 0 ? ((recentAverage - averageDaily) / averageDaily) * 100 : 0

    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable'
    const changeThreshold = averageDaily * 0.1 // 10% 变化阈值

    if (secondHalfAvg > firstHalfAvg + changeThreshold) {
      direction = 'increasing'
    } else if (secondHalfAvg < firstHalfAvg - changeThreshold) {
      direction = 'decreasing'
    }

    return {
      direction,
      averageDaily,
      maxDaily,
      minDaily,
      volatility,
      firstHalfAverage: firstHalfAvg,
      secondHalfAverage: secondHalfAvg,
      weekdayAverage,
      weekendAverage,
      momentum
    }
  }

  /**
   * 获取自定义时间段分析
   */
  const getCustomPeriodAnalysis = (startDate: Date, endDate: Date): CustomPeriodAnalysis => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const statistics = getStatistics('custom', startDate, endDate)
    
    // 生成趋势分析
    const periodExpenses = getExpensesByDateRange(startDate, endDate)
    const dailyAmounts = calculateDailyAmounts(periodExpenses, startDate, endDate)
    
    const trends = calculateTrendAnalysis(dailyAmounts, startDate, endDate)
    
    // 生成分析洞察
    const insights = generateAnalysisInsights(statistics, trends, totalDays)
    
    // 如果是月度分析，包含历史对比
    let comparison: HistoricalComparison | undefined
    if (totalDays >= 28 && totalDays <= 31) {
      // 尝试获取同期对比数据
      const prevStartDate = new Date(startDate)
      prevStartDate.setMonth(prevStartDate.getMonth() - 1)
      const prevEndDate = new Date(endDate)
      prevEndDate.setMonth(prevEndDate.getMonth() - 1)
      
      comparison = calculatePeriodComparison(
        { start: startDate, end: endDate },
        { start: prevStartDate, end: prevEndDate }
      )
    }

    return {
      period: 'custom',
      startDate,
      endDate,
      totalDays,
      statistics,
      comparison,
      trends,
      insights
    }
  }

  /**
   * 生成分析洞察
   */
  const generateAnalysisInsights = (
    statistics: Statistics, 
    trends: TrendAnalysis, 
    totalDays: number
  ): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = []

    // 消费趋势洞察
    if (trends.direction === 'increasing' && trends.momentum > 20) {
      insights.push({
        type: 'warning',
        title: '消费增长趋势',
        message: '最近消费呈明显上升趋势，建议关注支出控制',
        actionable: true,
        priority: 'high'
      })
    } else if (trends.direction === 'decreasing' && trends.momentum < -20) {
      insights.push({
        type: 'success',
        title: '消费控制良好',
        message: '消费呈下降趋势，预算控制效果显著',
        actionable: false,
        priority: 'low'
      })
    }

    // 周末消费洞察
    if (trends.weekendAverage > trends.weekdayAverage * 1.5) {
      insights.push({
        type: 'info',
        title: '周末消费较高',
        message: `周末日均消费比工作日高${((trends.weekendAverage / trends.weekdayAverage - 1) * 100).toFixed(0)}%`,
        actionable: true,
        priority: 'medium'
      })
    }

    // 消费波动洞察
    if (trends.volatility > trends.averageDaily * 0.8) {
      insights.push({
        type: 'tip',
        title: '消费波动较大',
        message: '日消费金额变化较大，建议制定更稳定的消费计划',
        actionable: true,
        priority: 'medium'
      })
    }

    // 分类集中度洞察
    const topCategory = statistics.categoryBreakdown[0]
    if (topCategory && topCategory.percentage > 50) {
      insights.push({
        type: 'warning',
        title: '消费过于集中',
        message: `${topCategory.categoryName}占总消费的${topCategory.percentage.toFixed(0)}%，建议分散消费`,
        actionable: true,
        priority: 'medium'
      })
    }

    return insights
  }

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * 计算指定时间段内每日消费金额
   */
  const calculateDailyAmounts = (expenses: Expense[], startDate: Date, endDate: Date): number[] => {
    const dailyMap = new Map<string, number>()
    
    // 初始化所有日期为0
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0]
      dailyMap.set(dateKey, 0)
      current.setDate(current.getDate() + 1)
    }

    // 累加每日消费
    expenses.forEach(expense => {
      try {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
        if (!isNaN(expenseDate.getTime())) {
          const dateKey = expenseDate.toISOString().split('T')[0]
          if (dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, dailyMap.get(dateKey)! + expense.amount)
          }
        }
      } catch (error) {
        console.warn('Invalid expense date in daily calculation:', expense.date, error)
      }
    })

    return Array.from(dailyMap.values())
  }

  /**
   * 计算趋势分析
   */
  const calculateTrendAnalysis = (dailyAmounts: number[], startDate: Date, endDate: Date): TrendAnalysis => {
    if (dailyAmounts.length < 2) {
      return {
        direction: 'stable',
        averageDaily: 0,
        maxDaily: 0,
        minDaily: 0,
        volatility: 0,
        firstHalfAverage: 0,
        secondHalfAverage: 0,
        weekdayAverage: 0,
        weekendAverage: 0,
        momentum: 0
      }
    }

    const total = dailyAmounts.reduce((sum, amount) => sum + amount, 0)
    const averageDaily = total / dailyAmounts.length
    const maxDaily = Math.max(...dailyAmounts)
    const minDaily = Math.min(...dailyAmounts)

    // 计算波动性
    const variance = dailyAmounts.reduce((sum, amount) => sum + Math.pow(amount - averageDaily, 2), 0) / dailyAmounts.length
    const volatility = Math.sqrt(variance)

    // 计算前后半段平均值
    const firstHalf = dailyAmounts.slice(0, Math.floor(dailyAmounts.length / 2))
    const secondHalf = dailyAmounts.slice(Math.floor(dailyAmounts.length / 2))
    const firstHalfAverage = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length
    const secondHalfAverage = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length

    // 计算工作日和周末平均（需要日期信息）
    const weekdayAmounts: number[] = []
    const weekendAmounts: number[] = []
    
    const current = new Date(startDate)
    dailyAmounts.forEach((amount, index) => {
      const dayOfWeek = current.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendAmounts.push(amount)
      } else {
        weekdayAmounts.push(amount)
      }
      current.setDate(current.getDate() + 1)
    })

    const weekdayAverage = weekdayAmounts.length > 0 
      ? weekdayAmounts.reduce((sum, amount) => sum + amount, 0) / weekdayAmounts.length 
      : 0
    const weekendAverage = weekendAmounts.length > 0 
      ? weekendAmounts.reduce((sum, amount) => sum + amount, 0) / weekendAmounts.length 
      : 0

    // 计算动量
    const recentDays = Math.min(7, dailyAmounts.length)
    const recentAmounts = dailyAmounts.slice(-recentDays)
    const recentAverage = recentAmounts.reduce((sum, amount) => sum + amount, 0) / recentAmounts.length
    const momentum = averageDaily > 0 ? ((recentAverage - averageDaily) / averageDaily) * 100 : 0

    // 判断趋势方向
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable'
    const changeThreshold = averageDaily * 0.1

    if (secondHalfAverage > firstHalfAverage + changeThreshold) {
      direction = 'increasing'
    } else if (secondHalfAverage < firstHalfAverage - changeThreshold) {
      direction = 'decreasing'
    }

    return {
      direction,
      averageDaily,
      maxDaily,
      minDaily,
      volatility,
      firstHalfAverage,
      secondHalfAverage,
      weekdayAverage,
      weekendAverage,
      momentum
    }
  }

  /**
   * 计算时间段对比
   */
  const calculatePeriodComparison = (
    currentPeriod: { start: Date; end: Date },
    previousPeriod: { start: Date; end: Date }
  ): HistoricalComparison => {
    const currentExpenses = getExpensesByDateRange(currentPeriod.start, currentPeriod.end)
    const previousExpenses = getExpensesByDateRange(previousPeriod.start, previousPeriod.end)

    const currentTotal = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const previousTotal = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    const currentDailyAmounts = calculateDailyAmounts(currentExpenses, currentPeriod.start, currentPeriod.end)
    const previousDailyAmounts = calculateDailyAmounts(previousExpenses, previousPeriod.start, previousPeriod.end)

    const changeAmount = currentTotal - previousTotal
    const changePercentage = previousTotal > 0 ? (changeAmount / previousTotal) * 100 : 0

    // 分类对比
    const currentByCategory = new Map<string, number>()
    const previousByCategory = new Map<string, number>()

    currentExpenses.forEach(expense => {
      currentByCategory.set(expense.categoryId, (currentByCategory.get(expense.categoryId) || 0) + expense.amount)
    })

    previousExpenses.forEach(expense => {
      previousByCategory.set(expense.categoryId, (previousByCategory.get(expense.categoryId) || 0) + expense.amount)
    })

    const categoryComparison: CategoryComparison[] = Array.from(new Set([
      ...currentByCategory.keys(),
      ...previousByCategory.keys()
    ])).map(categoryId => {
      const category = categories.value.find(cat => cat.id === categoryId)
      const currentAmount = currentByCategory.get(categoryId) || 0
      const previousAmount = previousByCategory.get(categoryId) || 0
      const categoryChange = currentAmount - previousAmount
      const categoryChangePercentage = previousAmount > 0 ? (categoryChange / previousAmount) * 100 : 0

      return {
        categoryId,
        categoryName: category?.name || '未知分类',
        thisMonth: currentAmount,
        lastMonth: previousAmount,
        change: categoryChange,
        changePercentage: categoryChangePercentage
      }
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    return {
      thisMonth: {
        total: currentTotal,
        count: currentExpenses.length,
        period: `${currentPeriod.start.getFullYear()}年${currentPeriod.start.getMonth() + 1}月`,
        averageDaily: currentDailyAmounts.length > 0 ? currentTotal / currentDailyAmounts.length : 0,
        maxDaily: Math.max(...currentDailyAmounts, 0),
        minDaily: currentDailyAmounts.length > 0 ? Math.min(...currentDailyAmounts.filter(amount => amount > 0)) : 0
      },
      lastMonth: {
        total: previousTotal,
        count: previousExpenses.length,
        period: `${previousPeriod.start.getFullYear()}年${previousPeriod.start.getMonth() + 1}月`,
        averageDaily: previousDailyAmounts.length > 0 ? previousTotal / previousDailyAmounts.length : 0,
        maxDaily: Math.max(...previousDailyAmounts, 0),
        minDaily: previousDailyAmounts.length > 0 ? Math.min(...previousDailyAmounts.filter(amount => amount > 0)) : 0
      },
      change: {
        amount: changeAmount,
        percentage: changePercentage,
        trend: changeAmount > 0 ? 'increase' : changeAmount < 0 ? 'decrease' : 'stable'
      },
      categoryComparison
    }
  }

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    currentPeriod: readonly(currentPeriod),
    customStartDate: readonly(customStartDate),
    customEndDate: readonly(customEndDate),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed Properties
    currentDateRange,
    currentPeriodExpenses,
    categoryBreakdown,
    dailyTrend,
    currentStatistics,
    budgetAnalysis,
    historicalComparison,

    // Methods
    setPeriod,
    setCustomDateRange,
    getStatistics,
    getCategoryRanking,
    getTrendAnalysis,
    getCustomPeriodAnalysis,
    clearError
  }
}

/**
 * 统计分析 Composable 的类型定义
 */
export interface StatisticsComposable {
  // State
  currentPeriod: Readonly<Ref<StatisticsPeriod>>
  customStartDate: Readonly<Ref<Date>>
  customEndDate: Readonly<Ref<Date>>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>

  // Computed Properties
  currentDateRange: ComputedRef<{ startDate: Date; endDate: Date }>
  currentPeriodExpenses: ComputedRef<Expense[]>
  categoryBreakdown: ComputedRef<CategoryStat[]>
  dailyTrend: ComputedRef<DailyTrendPoint[]>
  currentStatistics: ComputedRef<Statistics>
  budgetAnalysis: ComputedRef<BudgetAnalysis | null>
  historicalComparison: ComputedRef<HistoricalComparison | null>

  // Methods
  setPeriod: (period: StatisticsPeriod) => void
  setCustomDateRange: (startDate: Date, endDate: Date) => void
  getStatistics: (period: StatisticsPeriod, startDate?: Date, endDate?: Date) => Statistics
  getCategoryRanking: (limit?: number) => CategoryStat[]
  getTrendAnalysis: () => TrendAnalysis
  getCustomPeriodAnalysis: (startDate: Date, endDate: Date) => CustomPeriodAnalysis
  clearError: () => void
}