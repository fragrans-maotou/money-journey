import type { 
  Budget, 
  Expense, 
  Category, 
  BudgetSummary, 
  ExpenseFilter,
  DEFAULT_CATEGORIES 
} from './index'

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is a valid Budget
 */
export function isBudget(obj: any): obj is Budget {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.monthlyAmount === 'number' &&
    obj.startDate instanceof Date &&
    obj.endDate instanceof Date &&
    Array.isArray(obj.dailyAllocation) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

/**
 * Type guard to check if an object is a valid Expense
 */
export function isExpense(obj: any): obj is Expense {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.categoryId === 'string' &&
    typeof obj.description === 'string' &&
    obj.date instanceof Date &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

/**
 * Type guard to check if an object is a valid Category
 */
export function isCategory(obj: any): obj is Category {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.icon === 'string' &&
    typeof obj.color === 'string' &&
    typeof obj.isDefault === 'boolean'
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique ID for entities
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`
}

/**
 * Creates a new Budget with default values
 */
export function createBudget(monthlyAmount: number, startDate: Date): Budget {
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
  const now = new Date()
  
  return {
    id: generateId('budget'),
    monthlyAmount,
    startDate,
    endDate,
    dailyAllocation: [],
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Creates a new Expense with default values
 */
export function createExpense(
  amount: number, 
  categoryId: string, 
  description: string, 
  date: Date = new Date()
): Expense {
  const now = new Date()
  
  return {
    id: generateId('expense'),
    amount,
    categoryId,
    description,
    date,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Creates a new Category with default values
 */
export function createCategory(
  name: string, 
  icon: string, 
  color: string, 
  isDefault: boolean = false
): Category {
  return {
    id: generateId('category'),
    name,
    icon,
    color,
    isDefault
  }
}

/**
 * Calculates budget summary from budget and expenses
 */
export function calculateBudgetSummary(budget: Budget, expenses: Expense[]): BudgetSummary {
  const now = new Date()
  const totalSpent = expenses
    .filter(expense => 
      expense.date >= budget.startDate && 
      expense.date <= budget.endDate
    )
    .reduce((sum, expense) => sum + expense.amount, 0)
  
  const remainingBudget = budget.monthlyAmount - totalSpent
  const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, Math.ceil((budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyAverage = totalDays > 0 ? budget.monthlyAmount / totalDays : 0
  
  return {
    totalBudget: budget.monthlyAmount,
    totalSpent,
    remainingBudget,
    dailyAverage,
    daysRemaining,
    isOverBudget: totalSpent > budget.monthlyAmount
  }
}

/**
 * Filters expenses based on provided criteria
 */
export function filterExpenses(expenses: Expense[], filter: ExpenseFilter): Expense[] {
  return expenses.filter(expense => {
    if (filter.categoryId && expense.categoryId !== filter.categoryId) {
      return false
    }
    
    if (filter.startDate && expense.date < filter.startDate) {
      return false
    }
    
    if (filter.endDate && expense.date > filter.endDate) {
      return false
    }
    
    if (filter.minAmount && expense.amount < filter.minAmount) {
      return false
    }
    
    if (filter.maxAmount && expense.amount > filter.maxAmount) {
      return false
    }
    
    if (filter.description && !expense.description.toLowerCase().includes(filter.description.toLowerCase())) {
      return false
    }
    
    return true
  })
}

/**
 * Groups expenses by category
 */
export function groupExpensesByCategory(expenses: Expense[], categories: Category[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {}
  
  categories.forEach(category => {
    grouped[category.id] = []
  })
  
  expenses.forEach(expense => {
    if (grouped[expense.categoryId]) {
      grouped[expense.categoryId].push(expense)
    }
  })
  
  return grouped
}

/**
 * Calculates total expenses by category
 */
export function calculateCategoryTotals(expenses: Expense[], categories: Category[]): Record<string, number> {
  const totals: Record<string, number> = {}
  
  categories.forEach(category => {
    totals[category.id] = 0
  })
  
  expenses.forEach(expense => {
    if (totals[expense.categoryId] !== undefined) {
      totals[expense.categoryId] += expense.amount
    }
  })
  
  return totals
}

/**
 * Sorts expenses by date (newest first)
 */
export function sortExpensesByDate(expenses: Expense[], ascending: boolean = false): Expense[] {
  return [...expenses].sort((a, b) => {
    const comparison = a.date.getTime() - b.date.getTime()
    return ascending ? comparison : -comparison
  })
}

/**
 * Gets expenses for a specific date
 */
export function getExpensesForDate(expenses: Expense[], date: Date): Expense[] {
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date.getFullYear(), expense.date.getMonth(), expense.date.getDate())
    return expenseDate.getTime() === targetDate.getTime()
  })
}

/**
 * Gets expenses for current month
 */
export function getCurrentMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return expenses.filter(expense => 
    expense.date >= startOfMonth && expense.date <= endOfMonth
  )
}