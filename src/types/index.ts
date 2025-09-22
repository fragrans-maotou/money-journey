// Core data models for the budget tracker application

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Budget {
  id: string
  monthlyAmount: number
  startDate: Date
  endDate: Date
  dailyAllocation: DailyAllocation[]
  createdAt: Date
  updatedAt: Date
}

export interface DailyAllocation {
  date: Date
  baseAmount: number        // 基础日均预算
  carryOverAmount: number   // 累积金额
  availableAmount: number   // 实际可用金额
  spentAmount: number       // 已消费金额
  remainingAmount: number   // 剩余金额
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
}

export interface Statistics {
  period: 'week' | 'month' | 'custom'
  startDate: Date
  endDate: Date
  totalSpent: number
  budgetUtilization: number
  categoryBreakdown: CategoryStat[]
  dailyTrend: DailyTrendPoint[]
}

// Historical comparison interfaces
export interface HistoricalComparison {
  thisMonth: PeriodSummary
  lastMonth: PeriodSummary
  change: ComparisonChange
  categoryComparison: CategoryComparison[]
  budgetComparison?: BudgetComparison
}

export interface PeriodSummary {
  total: number
  count: number
  period: string
  averageDaily: number
  maxDaily: number
  minDaily: number
}

export interface ComparisonChange {
  amount: number
  percentage: number
  trend: 'increase' | 'decrease' | 'stable'
}

export interface CategoryComparison {
  categoryId: string
  categoryName: string
  thisMonth: number
  lastMonth: number
  change: number
  changePercentage: number
}

export interface BudgetComparison {
  thisMonthBudget: number
  lastMonthBudget: number
  thisMonthAchievement: number
  lastMonthAchievement: number
  achievementChange: number
}

// Enhanced budget analysis
export interface BudgetAnalysis {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  achievementRate: number
  expectedProgress: number
  actualProgress: number
  daysRemaining: number
  status: 'on_track' | 'ahead' | 'behind' | 'over_budget'
  message: string
  isOverBudget: boolean
  dailyAverageSpent: number
  recommendedDailySpend: number
  projectedMonthEnd: number
  savingsOpportunity: number
  riskLevel: 'low' | 'medium' | 'high'
}

// Custom period analysis
export interface CustomPeriodAnalysis {
  period: StatisticsPeriod
  startDate: Date
  endDate: Date
  totalDays: number
  statistics: Statistics
  comparison?: HistoricalComparison
  trends: TrendAnalysis
  insights: AnalysisInsight[]
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  averageDaily: number
  maxDaily: number
  minDaily: number
  volatility: number
  firstHalfAverage: number
  secondHalfAverage: number
  weekdayAverage: number
  weekendAverage: number
  momentum: number
}

export interface AnalysisInsight {
  type: 'warning' | 'info' | 'success' | 'tip'
  title: string
  message: string
  actionable: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
}

export interface DailyTrendPoint {
  date: Date
  amount: number
}

// ============================================================================
// Input Types (for forms and API)
// ============================================================================

export interface BudgetInput {
  monthlyAmount: number
  startDate: Date
}

export interface ExpenseInput {
  amount: number
  categoryId: string
  description: string
  date?: Date
}

export interface CategoryInput {
  name: string
  icon: string
  color: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type BudgetStatus = 'active' | 'completed' | 'exceeded'
export type ExpensePeriod = 'today' | 'week' | 'month' | 'custom'
export type StatisticsPeriod = 'week' | 'month' | 'custom'

// Partial types for updates
export type BudgetUpdate = Partial<Pick<Budget, 'monthlyAmount'>>
export type ExpenseUpdate = Partial<Pick<Expense, 'amount' | 'categoryId' | 'description' | 'date'>>
export type CategoryUpdate = Partial<Pick<Category, 'name' | 'icon' | 'color'>>

// Query and filter types
export interface ExpenseFilter {
  categoryId?: string
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
  description?: string
}

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  dailyAverage: number
  daysRemaining: number
  isOverBudget: boolean
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

// Storage types
export interface StorageData {
  budgets: Budget[]
  expenses: Expense[]
  categories: Category[]
  lastUpdated: Date
  version: string
}

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// ============================================================================
// Default Categories
// ============================================================================

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '餐饮', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { name: '交通', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { name: '购物', icon: '🛍️', color: '#45B7D1', isDefault: true },
  { name: '娱乐', icon: '🎬', color: '#96CEB4', isDefault: true },
  { name: '医疗', icon: '🏥', color: '#FFEAA7', isDefault: true },
  { name: '教育', icon: '📚', color: '#DDA0DD', isDefault: true },
  { name: '其他', icon: '📝', color: '#95A5A6', isDefault: true }
]

// ============================================================================
// Re-export validation functions and utilities
// ============================================================================

export * from './validation'
export * from './utils'