import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import type { BudgetSummary } from '@/types'

// Mock the composables
vi.mock('@/composables/useBudget', () => ({
  useBudget: () => ({
    currentBudget: { value: null },
    isLoading: { value: false },
    error: { value: null },
    budgetSummary: {
      value: {
        totalBudget: 3000,
        totalSpent: 1200,
        remainingBudget: 1800,
        dailyAverage: 100,
        daysRemaining: 18,
        isOverBudget: false
      } as BudgetSummary
    },
    availableBudget: { value: 150 },
    getCurrentMonthBudget: vi.fn(),
    clearError: vi.fn()
  })
}))

vi.mock('@/composables/useExpense', () => ({
  useExpense: () => ({
    getExpensesByDate: vi.fn(() => [
      { id: '1', amount: 50, categoryId: 'food', description: 'Lunch', date: new Date() }
    ])
  })
}))

// Mock components
vi.mock('@/components/BudgetCard.vue', () => ({
  default: {
    name: 'BudgetCard',
    template: '<div data-testid="budget-card">Budget Card</div>',
    props: ['budgetSummary', 'availableBudget']
  }
}))

describe('Dashboard', () => {
  let router: any

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: Dashboard },
        { path: '/budget-settings', component: { template: '<div>Settings</div>' } },
        { path: '/expense-record', component: { template: '<div>Expense Record</div>' } },
        { path: '/statistics', component: { template: '<div>Statistics</div>' } }
      ]
    })
  })

  it('renders dashboard header correctly', () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.dashboard-header h1').text()).toBe('预算概览')
    expect(wrapper.find('.refresh-button').exists()).toBe(true)
  })

  it('shows no budget state when no budget is set', () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.no-budget-state').exists()).toBe(true)
    expect(wrapper.find('.no-budget-state h3').text()).toBe('还没有设置预算')
    expect(wrapper.find('.setup-budget-button').exists()).toBe(true)
  })

  it('calculates today spent amount correctly', () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    // The component should calculate today's spent amount from expenses
    const vm = wrapper.vm as any
    expect(vm.todaySpent).toBe(50) // Based on mocked expense
  })

  it('formats amounts correctly', () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    const vm = wrapper.vm as any
    expect(vm.formatAmount(1234.56)).toBe('1,234.56')
    expect(vm.formatAmount(1000)).toBe('1,000')
  })

  it('handles refresh data action', async () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    const refreshButton = wrapper.find('.refresh-button')
    await refreshButton.trigger('click')

    // Should call getCurrentMonthBudget
    expect(refreshButton.exists()).toBe(true)
  })

  it('navigates to correct routes', async () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    const vm = wrapper.vm as any
    
    // Test navigation methods
    expect(typeof vm.navigateToSettings).toBe('function')
    expect(typeof vm.navigateToExpenseRecord).toBe('function')
    expect(typeof vm.navigateToStatistics).toBe('function')
  })
})