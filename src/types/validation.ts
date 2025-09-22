import type { 
  Budget, 
  BudgetInput, 
  Expense, 
  ExpenseInput, 
  Category, 
  CategoryInput,
  ValidationResult,
  ValidationError 
} from './index'

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Creates a validation error object
 */
function createValidationError(field: string, message: string, code: string): ValidationError {
  return { field, message, code }
}

/**
 * Creates a successful validation result
 */
function createSuccessResult(): ValidationResult {
  return { isValid: true, errors: [] }
}

/**
 * Creates a failed validation result
 */
function createFailureResult(errors: ValidationError[]): ValidationResult {
  return { isValid: false, errors }
}

// ============================================================================
// Budget Validation
// ============================================================================

/**
 * Validates budget input data
 * 需求 1.1: 用户设置月度总预算时的验证
 */
export function validateBudgetInput(input: BudgetInput): ValidationResult {
  const errors: ValidationError[] = []

  // Validate monthly amount
  if (typeof input.monthlyAmount !== 'number') {
    errors.push(createValidationError('monthlyAmount', '月度预算金额不能为空', 'REQUIRED'))
  } else if (!Number.isFinite(input.monthlyAmount)) {
    errors.push(createValidationError('monthlyAmount', '月度预算金额必须是有效数字', 'INVALID_NUMBER'))
  } else if (input.monthlyAmount <= 0) {
    errors.push(createValidationError('monthlyAmount', '月度预算金额必须大于0', 'MIN_VALUE'))
  } else if (input.monthlyAmount > 1000000) {
    errors.push(createValidationError('monthlyAmount', '月度预算金额不能超过100万', 'MAX_VALUE'))
  }

  // Validate start date
  if (!input.startDate || !(input.startDate instanceof Date)) {
    errors.push(createValidationError('startDate', '开始日期不能为空', 'REQUIRED'))
  } else if (isNaN(input.startDate.getTime())) {
    errors.push(createValidationError('startDate', '开始日期格式无效', 'INVALID_DATE'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

/**
 * Validates complete budget object
 */
export function validateBudget(budget: Budget): ValidationResult {
  const errors: ValidationError[] = []

  // Validate ID
  if (!budget.id || typeof budget.id !== 'string' || budget.id.trim().length === 0) {
    errors.push(createValidationError('id', '预算ID不能为空', 'REQUIRED'))
  }

  // Validate input fields
  const inputValidation = validateBudgetInput({
    monthlyAmount: budget.monthlyAmount,
    startDate: budget.startDate
  })
  errors.push(...inputValidation.errors)

  // Validate end date
  if (!budget.endDate || !(budget.endDate instanceof Date)) {
    errors.push(createValidationError('endDate', '结束日期不能为空', 'REQUIRED'))
  } else if (isNaN(budget.endDate.getTime())) {
    errors.push(createValidationError('endDate', '结束日期格式无效', 'INVALID_DATE'))
  } else if (budget.startDate && budget.endDate <= budget.startDate) {
    errors.push(createValidationError('endDate', '结束日期必须晚于开始日期', 'DATE_RANGE'))
  }

  // Validate timestamps
  if (!budget.createdAt || !(budget.createdAt instanceof Date)) {
    errors.push(createValidationError('createdAt', '创建时间无效', 'INVALID_DATE'))
  }
  if (!budget.updatedAt || !(budget.updatedAt instanceof Date)) {
    errors.push(createValidationError('updatedAt', '更新时间无效', 'INVALID_DATE'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

// ============================================================================
// Expense Validation
// ============================================================================

/**
 * Validates expense input data
 * 需求 3.1: 用户添加消费记录时的验证
 */
export function validateExpenseInput(input: ExpenseInput): ValidationResult {
  const errors: ValidationError[] = []

  // Validate amount
  if (typeof input.amount !== 'number') {
    errors.push(createValidationError('amount', '消费金额不能为空', 'REQUIRED'))
  } else if (!Number.isFinite(input.amount)) {
    errors.push(createValidationError('amount', '消费金额必须是有效数字', 'INVALID_NUMBER'))
  } else if (input.amount <= 0) {
    errors.push(createValidationError('amount', '消费金额必须大于0', 'MIN_VALUE'))
  } else if (input.amount > 100000) {
    errors.push(createValidationError('amount', '单笔消费金额不能超过10万', 'MAX_VALUE'))
  }

  // Validate category ID
  if (!input.categoryId || typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
    errors.push(createValidationError('categoryId', '消费分类不能为空', 'REQUIRED'))
  }

  // Validate description
  if (!input.description || typeof input.description !== 'string' || input.description.trim().length === 0) {
    errors.push(createValidationError('description', '消费描述不能为空', 'REQUIRED'))
  } else if (input.description.length > 200) {
    errors.push(createValidationError('description', '消费描述不能超过200个字符', 'MAX_LENGTH'))
  }

  // Validate date (optional)
  if (input.date && (!(input.date instanceof Date) || isNaN(input.date.getTime()))) {
    errors.push(createValidationError('date', '消费日期格式无效', 'INVALID_DATE'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

/**
 * Validates complete expense object
 */
export function validateExpense(expense: Expense): ValidationResult {
  const errors: ValidationError[] = []

  // Validate ID
  if (!expense.id || typeof expense.id !== 'string' || expense.id.trim().length === 0) {
    errors.push(createValidationError('id', '消费记录ID不能为空', 'REQUIRED'))
  }

  // Validate input fields
  const inputValidation = validateExpenseInput({
    amount: expense.amount,
    categoryId: expense.categoryId,
    description: expense.description,
    date: expense.date
  })
  errors.push(...inputValidation.errors)

  // Validate required date
  if (!expense.date || !(expense.date instanceof Date)) {
    errors.push(createValidationError('date', '消费日期不能为空', 'REQUIRED'))
  } else if (isNaN(expense.date.getTime())) {
    errors.push(createValidationError('date', '消费日期格式无效', 'INVALID_DATE'))
  }

  // Validate timestamps
  if (!expense.createdAt || !(expense.createdAt instanceof Date)) {
    errors.push(createValidationError('createdAt', '创建时间无效', 'INVALID_DATE'))
  }
  if (!expense.updatedAt || !(expense.updatedAt instanceof Date)) {
    errors.push(createValidationError('updatedAt', '更新时间无效', 'INVALID_DATE'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

// ============================================================================
// Category Validation
// ============================================================================

/**
 * Validates category input data
 * 需求 3.1: 用户创建自定义分类时的验证
 */
export function validateCategoryInput(input: CategoryInput): ValidationResult {
  const errors: ValidationError[] = []

  // Validate name
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push(createValidationError('name', '分类名称不能为空', 'REQUIRED'))
  } else if (input.name.length > 20) {
    errors.push(createValidationError('name', '分类名称不能超过20个字符', 'MAX_LENGTH'))
  }

  // Validate icon
  if (!input.icon || typeof input.icon !== 'string' || input.icon.trim().length === 0) {
    errors.push(createValidationError('icon', '分类图标不能为空', 'REQUIRED'))
  }

  // Validate color (hex color format)
  if (!input.color || typeof input.color !== 'string') {
    errors.push(createValidationError('color', '分类颜色不能为空', 'REQUIRED'))
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
    errors.push(createValidationError('color', '分类颜色格式无效，请使用十六进制格式（如 #FF0000）', 'INVALID_FORMAT'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

/**
 * Validates complete category object
 */
export function validateCategory(category: Category): ValidationResult {
  const errors: ValidationError[] = []

  // Validate ID
  if (!category.id || typeof category.id !== 'string' || category.id.trim().length === 0) {
    errors.push(createValidationError('id', '分类ID不能为空', 'REQUIRED'))
  }

  // Validate input fields
  const inputValidation = validateCategoryInput({
    name: category.name,
    icon: category.icon,
    color: category.color
  })
  errors.push(...inputValidation.errors)

  // Validate isDefault
  if (typeof category.isDefault !== 'boolean') {
    errors.push(createValidationError('isDefault', '默认分类标识必须是布尔值', 'INVALID_TYPE'))
  }

  return errors.length > 0 ? createFailureResult(errors) : createSuccessResult()
}

// ============================================================================
// Utility Validation Functions
// ============================================================================

/**
 * Validates if a value is a positive number
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Validates if a value is a valid date
 */
export function isValidDate(value: any): boolean {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Validates if a string is not empty
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates if a value is a valid hex color
 */
export function isValidHexColor(value: any): boolean {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
}