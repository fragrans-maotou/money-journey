import { describe, it, expect, beforeEach } from 'vitest'
import type { 
  Budget, 
  BudgetInput, 
  Expense, 
  ExpenseInput, 
  Category, 
  CategoryInput
} from '../types'
import {
  validateBudgetInput,
  validateBudget,
  validateExpenseInput,
  validateExpense,
  validateCategoryInput,
  validateCategory,
  isPositiveNumber,
  isValidDate,
  isNonEmptyString,
  isValidHexColor
} from '../types/validation'

// ============================================================================
// Test Data Factories
// ============================================================================

function createValidBudgetInput(): BudgetInput {
  return {
    monthlyAmount: 3000,
    startDate: new Date('2024-01-01')
  }
}

function createValidBudget(): Budget {
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

function createValidExpenseInput(): ExpenseInput {
  return {
    amount: 50.5,
    categoryId: 'category-123',
    description: '午餐费用',
    date: new Date('2024-01-15')
  }
}

function createValidExpense(): Expense {
  return {
    id: 'expense-123',
    amount: 50.5,
    categoryId: 'category-123',
    description: '午餐费用',
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15T12:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z')
  }
}

function createValidCategoryInput(): CategoryInput {
  return {
    name: '餐饮',
    icon: '🍽️',
    color: '#FF6B6B'
  }
}

function createValidCategory(): Category {
  return {
    id: 'category-123',
    name: '餐饮',
    icon: '🍽️',
    color: '#FF6B6B',
    isDefault: true
  }
}

// ============================================================================
// Budget Validation Tests
// ============================================================================

describe('Budget Validation', () => {
  describe('validateBudgetInput', () => {
    it('should validate correct budget input', () => {
      const input = createValidBudgetInput()
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty monthly amount', () => {
      const input = { ...createValidBudgetInput(), monthlyAmount: 0 }
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('monthlyAmount')
      expect(result.errors[0].code).toBe('MIN_VALUE')
    })

    it('should reject negative monthly amount', () => {
      const input = { ...createValidBudgetInput(), monthlyAmount: -100 }
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('monthlyAmount')
      expect(result.errors[0].code).toBe('MIN_VALUE')
    })

    it('should reject excessive monthly amount', () => {
      const input = { ...createValidBudgetInput(), monthlyAmount: 2000000 }
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('monthlyAmount')
      expect(result.errors[0].code).toBe('MAX_VALUE')
    })

    it('should reject invalid number for monthly amount', () => {
      const input = { ...createValidBudgetInput(), monthlyAmount: NaN }
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('monthlyAmount')
      expect(result.errors[0].code).toBe('INVALID_NUMBER')
    })

    it('should reject invalid start date', () => {
      const input = { ...createValidBudgetInput(), startDate: new Date('invalid') }
      const result = validateBudgetInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('startDate')
      expect(result.errors[0].code).toBe('INVALID_DATE')
    })
  })

  describe('validateBudget', () => {
    it('should validate correct budget', () => {
      const budget = createValidBudget()
      const result = validateBudget(budget)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty ID', () => {
      const budget = { ...createValidBudget(), id: '' }
      const result = validateBudget(budget)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('id')
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should reject end date before start date', () => {
      const budget = { 
        ...createValidBudget(), 
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-10')
      }
      const result = validateBudget(budget)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'endDate' && e.code === 'DATE_RANGE')).toBe(true)
    })
  })
})

// ============================================================================
// Expense Validation Tests
// ============================================================================

describe('Expense Validation', () => {
  describe('validateExpenseInput', () => {
    it('should validate correct expense input', () => {
      const input = createValidExpenseInput()
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject zero amount', () => {
      const input = { ...createValidExpenseInput(), amount: 0 }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('amount')
      expect(result.errors[0].code).toBe('MIN_VALUE')
    })

    it('should reject excessive amount', () => {
      const input = { ...createValidExpenseInput(), amount: 200000 }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('amount')
      expect(result.errors[0].code).toBe('MAX_VALUE')
    })

    it('should reject empty category ID', () => {
      const input = { ...createValidExpenseInput(), categoryId: '' }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('categoryId')
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should reject empty description', () => {
      const input = { ...createValidExpenseInput(), description: '' }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('description')
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should reject overly long description', () => {
      const input = { ...createValidExpenseInput(), description: 'a'.repeat(201) }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('description')
      expect(result.errors[0].code).toBe('MAX_LENGTH')
    })

    it('should accept valid expense without date', () => {
      const input = { ...createValidExpenseInput() }
      delete input.date
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid date when provided', () => {
      const input = { ...createValidExpenseInput(), date: new Date('invalid') }
      const result = validateExpenseInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('date')
      expect(result.errors[0].code).toBe('INVALID_DATE')
    })
  })

  describe('validateExpense', () => {
    it('should validate correct expense', () => {
      const expense = createValidExpense()
      const result = validateExpense(expense)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject expense without required date', () => {
      const expense = { ...createValidExpense() }
      // @ts-ignore - intentionally testing invalid state
      expense.date = null
      const result = validateExpense(expense)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'date' && e.code === 'REQUIRED')).toBe(true)
    })
  })
})

// ============================================================================
// Category Validation Tests
// ============================================================================

describe('Category Validation', () => {
  describe('validateCategoryInput', () => {
    it('should validate correct category input', () => {
      const input = createValidCategoryInput()
      const result = validateCategoryInput(input)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty name', () => {
      const input = { ...createValidCategoryInput(), name: '' }
      const result = validateCategoryInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should reject overly long name', () => {
      const input = { ...createValidCategoryInput(), name: 'a'.repeat(21) }
      const result = validateCategoryInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].code).toBe('MAX_LENGTH')
    })

    it('should reject empty icon', () => {
      const input = { ...createValidCategoryInput(), icon: '' }
      const result = validateCategoryInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('icon')
      expect(result.errors[0].code).toBe('REQUIRED')
    })

    it('should reject invalid color format', () => {
      const input = { ...createValidCategoryInput(), color: 'red' }
      const result = validateCategoryInput(input)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('color')
      expect(result.errors[0].code).toBe('INVALID_FORMAT')
    })

    it('should accept valid hex colors', () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#123ABC']
      
      validColors.forEach(color => {
        const input = { ...createValidCategoryInput(), color }
        const result = validateCategoryInput(input)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject invalid hex colors', () => {
      const invalidColors = ['#FF', '#GGGGGG', 'FF0000', '#FF00', '#FF00000', 'red', '']
      
      invalidColors.forEach(color => {
        const input = { ...createValidCategoryInput(), color }
        const result = validateCategoryInput(input)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('validateCategory', () => {
    it('should validate correct category', () => {
      const category = createValidCategory()
      const result = validateCategory(category)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid isDefault type', () => {
      const category = { ...createValidCategory() }
      // @ts-ignore - intentionally testing invalid state
      category.isDefault = 'true'
      const result = validateCategory(category)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('isDefault')
      expect(result.errors[0].code).toBe('INVALID_TYPE')
    })
  })
})

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Utility Validation Functions', () => {
  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true)
      expect(isPositiveNumber(0.1)).toBe(true)
      expect(isPositiveNumber(1000)).toBe(true)
    })

    it('should return false for non-positive numbers', () => {
      expect(isPositiveNumber(0)).toBe(false)
      expect(isPositiveNumber(-1)).toBe(false)
      expect(isPositiveNumber(-0.1)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('1')).toBe(false)
      expect(isPositiveNumber(null)).toBe(false)
      expect(isPositiveNumber(undefined)).toBe(false)
      expect(isPositiveNumber(NaN)).toBe(false)
      expect(isPositiveNumber(Infinity)).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date('2024-01-01'))).toBe(true)
      expect(isValidDate(new Date(2024, 0, 1))).toBe(true)
    })

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false)
      expect(isValidDate('2024-01-01')).toBe(false)
      expect(isValidDate(null)).toBe(false)
      expect(isValidDate(undefined)).toBe(false)
      expect(isValidDate(123456789)).toBe(false)
    })
  })

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('a')).toBe(true)
      expect(isNonEmptyString(' hello ')).toBe(true)
    })

    it('should return false for empty or non-strings', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
    })
  })

  describe('isValidHexColor', () => {
    it('should return true for valid hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true)
      expect(isValidHexColor('#00FF00')).toBe(true)
      expect(isValidHexColor('#0000FF')).toBe(true)
      expect(isValidHexColor('#FFFFFF')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
      expect(isValidHexColor('#123ABC')).toBe(true)
      expect(isValidHexColor('#abcdef')).toBe(true)
    })

    it('should return false for invalid hex colors', () => {
      expect(isValidHexColor('#FF')).toBe(false)
      expect(isValidHexColor('#GGGGGG')).toBe(false)
      expect(isValidHexColor('FF0000')).toBe(false)
      expect(isValidHexColor('#FF00')).toBe(false)
      expect(isValidHexColor('#FF00000')).toBe(false)
      expect(isValidHexColor('red')).toBe(false)
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
    })
  })
})

// ============================================================================
// Default Categories Tests
// ============================================================================

describe('Default Categories', () => {
  it('should have valid default categories', async () => {
    // Import DEFAULT_CATEGORIES for testing
    const { DEFAULT_CATEGORIES } = await import('../types')
    
    expect(DEFAULT_CATEGORIES).toBeDefined()
    expect(Array.isArray(DEFAULT_CATEGORIES)).toBe(true)
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0)
    
    DEFAULT_CATEGORIES.forEach((category: any) => {
      expect(category.name).toBeTruthy()
      expect(category.icon).toBeTruthy()
      expect(isValidHexColor(category.color)).toBe(true)
      expect(category.isDefault).toBe(true)
    })
  })

  it('should include essential categories', async () => {
    const { DEFAULT_CATEGORIES } = await import('../types')
    const categoryNames = DEFAULT_CATEGORIES.map((c: any) => c.name)
    
    expect(categoryNames).toContain('餐饮')
    expect(categoryNames).toContain('交通')
    expect(categoryNames).toContain('购物')
    expect(categoryNames).toContain('娱乐')
    expect(categoryNames).toContain('其他')
  })
})