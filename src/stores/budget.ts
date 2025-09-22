import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Budget, Expense } from '@/types'

export const useBudgetStore = defineStore('budget', () => {
  // State
  const currentBudget = ref<Budget | null>(null)
  const expenses = ref<Expense[]>([])

  // Getters
  const totalSpent = computed(() => {
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  })

  const remainingBudget = computed(() => {
    if (!currentBudget.value) return 0
    return currentBudget.value.monthlyAmount - totalSpent.value
  })

  // Actions
  function setBudget(budget: Budget) {
    currentBudget.value = budget
  }

  function addExpense(expense: Expense) {
    expenses.value.push(expense)
  }

  return {
    // State
    currentBudget,
    expenses,
    // Getters
    totalSpent,
    remainingBudget,
    // Actions
    setBudget,
    addExpense
  }
})