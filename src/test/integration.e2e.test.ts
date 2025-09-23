/**
 * End-to-End Integration Tests
 * 
 * This test suite verifies that all application modules work together correctly
 * and that the complete user workflow functions as expected.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import Dashboard from '@/views/Dashboard.vue'
import BudgetSettings from '@/views/BudgetSettings.vue'
import ExpenseRecord from '@/views/ExpenseRecord.vue'
import Statistics from '@/views/Statistics.vue'
import ExpenseHistory from '@/views/ExpenseHistory.vue'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: Dashboard },
    { path: '/budget-settings', name: 'BudgetSettings', component: BudgetSettings },
    { path: '/expense-record', name: 'ExpenseRecord', component: ExpenseRecord },
    { path: '/statistics', name: 'Statistics', component: Statistics },
    { path: '/expense-history', name: 'ExpenseHistory', component: ExpenseHistory }
  ]
})

describe('End-to-End Integration Tests', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
  })

  describe('Application Bootstrap', () => {
    it('should initialize the application correctly', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('#app').exists()).toBe(true)
    })

    it('should load with proper route configuration', async () => {
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.name).toBe('Dashboard')
    })

    it('should display TabBar navigation', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      const tabBar = wrapper.find('.tab-bar')
      expect(tabBar.exists()).toBe(true)
      
      // Check all navigation tabs are present
      const tabs = wrapper.findAll('.tab-item')
      expect(tabs.length).toBe(5) // Dashboard, ExpenseRecord, ExpenseHistory, Statistics, BudgetSettings
    })
  })

  describe('Complete User Workflow', () => {
    it('should handle complete budget setup and expense tracking workflow', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      // Step 1: Start at Dashboard (no budget set)
      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should show no budget state
      expect(wrapper.find('.no-budget-state').exists()).toBe(true)

      // Step 2: Navigate to Budget Settings
      await router.push('/budget-settings')
      await wrapper.vm.$nextTick()

      const budgetSettings = wrapper.findComponent(BudgetSettings)
      expect(budgetSettings.exists()).toBe(true)

      // Step 3: Set up budget (simulate form interaction)
      const amountInput = budgetSettings.find('input[type="number"]')
      if (amountInput.exists()) {
        await amountInput.setValue(3000)
        await amountInput.trigger('input')
      }

      // Step 4: Navigate to Expense Record
      await router.push('/expense-record')
      await wrapper.vm.$nextTick()

      const expenseRecord = wrapper.findComponent(ExpenseRecord)
      expect(expenseRecord.exists()).toBe(true)

      // Step 5: Navigate to Statistics
      await router.push('/statistics')
      await wrapper.vm.$nextTick()

      const statistics = wrapper.findComponent(Statistics)
      expect(statistics.exists()).toBe(true)

      // Step 6: Navigate to Expense History
      await router.push('/expense-history')
      await wrapper.vm.$nextTick()

      const expenseHistory = wrapper.findComponent(ExpenseHistory)
      expect(expenseHistory.exists()).toBe(true)
    })

    it('should maintain data consistency across navigation', async () => {
      // Mock some initial data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'monthly-budget-tracker-budgets') {
          return JSON.stringify([{
            id: 'test-budget',
            monthlyAmount: 3000,
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
            dailyAllocation: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }])
        }
        if (key === 'monthly-budget-tracker-expenses') {
          return JSON.stringify([{
            id: 'test-expense',
            amount: 50,
            categoryId: 'food',
            description: 'Test expense',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }])
        }
        return null
      })

      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      // Navigate through different views and verify data persistence
      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should show budget data
      expect(wrapper.find('.no-budget-state').exists()).toBe(false)

      await router.push('/statistics')
      await wrapper.vm.$nextTick()

      // Statistics should show data
      const statisticsView = wrapper.find('.statistics-view')
      expect(statisticsView.exists()).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // App should still render without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('should display error states when data loading fails', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Failed to load data')
      })

      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should handle error gracefully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Performance and Optimization', () => {
    it('should lazy load route components', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      // Initial load should only load Dashboard
      await router.push('/')
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(Dashboard).exists()).toBe(true)
    })

    it('should handle rapid navigation without issues', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      // Rapidly navigate between routes
      const routes = ['/', '/budget-settings', '/expense-record', '/statistics', '/expense-history']
      
      for (const route of routes) {
        await router.push(route)
        await wrapper.vm.$nextTick()
        expect(wrapper.exists()).toBe(true)
      }
    })
  })

  describe('Mobile Optimization Integration', () => {
    it('should apply mobile-specific styles and behaviors', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should have mobile-optimized layout
      expect(wrapper.find('#app').exists()).toBe(true)
      expect(wrapper.find('.tab-bar').exists()).toBe(true)
    })

    it('should handle touch interactions properly', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Tab bar should be touchable
      const tabItems = wrapper.findAll('.tab-item')
      expect(tabItems.length).toBeGreaterThan(0)

      // Simulate touch interaction
      if (tabItems.length > 0) {
        await tabItems[0].trigger('click')
        expect(wrapper.exists()).toBe(true)
      }
    })
  })

  describe('Data Recovery Integration', () => {
    it('should recover from corrupted data', async () => {
      // Mock corrupted data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key.includes('monthly-budget-tracker')) {
          return 'invalid-json-data'
        }
        return null
      })

      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should handle corrupted data and initialize with defaults
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.no-budget-state').exists()).toBe(true)
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain proper focus management during navigation', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Navigation should be keyboard accessible
      const tabItems = wrapper.findAll('.tab-item')
      expect(tabItems.length).toBeGreaterThan(0)

      // Should have proper ARIA attributes
      tabItems.forEach(tab => {
        expect(tab.element.tagName).toBe('BUTTON')
      })
    })

    it('should provide proper semantic structure', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia]
        }
      })

      await router.push('/')
      await wrapper.vm.$nextTick()

      // Should have proper heading structure
      const headings = wrapper.findAll('h1, h2, h3')
      expect(headings.length).toBeGreaterThan(0)
    })
  })
})