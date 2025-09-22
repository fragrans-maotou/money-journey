import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import { useBudget } from '@/composables/useBudget'
import { useExpense } from '@/composables/useExpense'
import type { Budget, BudgetSummary } from '@/types'

// Integration test to verify Dashboard works with real composables
describe('Dashboard Integration', () => {
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

    // Clear localStorage before each test
    localStorage.clear()
  })

  it('integrates with budget and expense composables correctly', async () => {
    // This test verifies that the Dashboard component can work with the actual composables
    // without mocking them, ensuring the integration is correct
    
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: {
          BudgetCard: {
            template: '<div data-testid="budget-card">{{ budgetSummary.totalBudget }}</div>',
            props: ['budgetSummary', 'availableBudget']
          }
        }
      }
    })

    // Should render without errors
    expect(wrapper.find('.dashboard').exists()).toBe(true)
    expect(wrapper.find('.dashboard-header h1').text()).toBe('预算概览')

    // Should show no budget state initially (since localStorage is empty)
    expect(wrapper.find('.no-budget-state').exists()).toBe(true)
  })

  it('shows budget card when budget exists', async () => {
    // Set up a budget in localStorage to simulate existing data
    const mockBudget: Budget = {
      id: 'test-budget',
      monthlyAmount: 3000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    localStorage.setItem('budgets', JSON.stringify([mockBudget]))

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: {
          BudgetCard: {
            template: '<div data-testid="budget-card">Budget: {{ budgetSummary.totalBudget }}</div>',
            props: ['budgetSummary', 'availableBudget']
          }
        }
      }
    })

    // Wait for component to initialize
    await wrapper.vm.$nextTick()

    // Should not show no budget state
    expect(wrapper.find('.no-budget-state').exists()).toBe(false)
    
    // Should show today budget section
    expect(wrapper.find('.today-budget').exists()).toBe(true)
    expect(wrapper.find('.quick-actions').exists()).toBe(true)
  })

  it('calculates today spent correctly with real expenses', async () => {
    // Set up budget and expenses
    const mockBudget: Budget = {
      id: 'test-budget',
      monthlyAmount: 3000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      dailyAllocation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const mockExpenses = [
      {
        id: 'expense-1',
        amount: 50,
        categoryId: 'food',
        description: 'Lunch',
        date: new Date('2024-01-15'), // Today (based on mocked date in setup.ts)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'expense-2',
        amount: 30,
        categoryId: 'transport',
        description: 'Bus',
        date: new Date('2024-01-14'), // Yesterday
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    localStorage.setItem('budgets', JSON.stringify([mockBudget]))
    localStorage.setItem('expenses', JSON.stringify(mockExpenses))

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: {
          BudgetCard: {
            template: '<div data-testid="budget-card">Budget Card</div>',
            props: ['budgetSummary', 'availableBudget']
          }
        }
      }
    })

    await wrapper.vm.$nextTick()

    // The component should calculate today's spent amount correctly
    const vm = wrapper.vm as any
    expect(vm.todaySpent).toBe(50) // Only today's expense
  })

  it('handles navigation correctly', async () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    const vm = wrapper.vm as any

    // Test navigation functions exist
    expect(typeof vm.navigateToSettings).toBe('function')
    expect(typeof vm.navigateToExpenseRecord).toBe('function')
    expect(typeof vm.navigateToStatistics).toBe('function')

    // Test setup budget button navigation
    const setupButton = wrapper.find('.setup-budget-button')
    if (setupButton.exists()) {
      await setupButton.trigger('click')
      // Router navigation should be called
    }
  })
})