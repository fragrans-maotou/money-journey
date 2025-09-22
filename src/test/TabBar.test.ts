import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import TabBar from '../components/layout/TabBar.vue'

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/expense-record', name: 'ExpenseRecord', component: { template: '<div>Expense</div>' } },
      { path: '/statistics', name: 'Statistics', component: { template: '<div>Statistics</div>' } },
      { path: '/budget-settings', name: 'BudgetSettings', component: { template: '<div>Settings</div>' } }
    ]
  })
}

describe('TabBar', () => {
  let wrapper: any
  let router: any

  beforeEach(async () => {
    router = createMockRouter()
    
    wrapper = mount(TabBar, {
      global: {
        plugins: [router]
      }
    })
    
    // Wait for router to be ready
    await router.isReady()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should render all tab items', () => {
    const tabItems = wrapper.findAll('.tab-item')
    expect(tabItems).toHaveLength(4)
    
    // Check tab labels
    const labels = tabItems.map((item: any) => item.find('.tab-label').text())
    expect(labels).toEqual(['概览', '记录', '统计', '设置'])
  })

  it('should highlight active tab', async () => {
    // Navigate to Dashboard (should be active by default)
    await router.push('/')
    await wrapper.vm.$nextTick()
    
    const activeTab = wrapper.find('.tab-item.active')
    expect(activeTab.exists()).toBe(true)
    expect(activeTab.find('.tab-label').text()).toBe('概览')
  })

  it('should navigate when tab is clicked', async () => {
    const expenseTab = wrapper.findAll('.tab-item')[1] // Second tab (记录)
    
    await expenseTab.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(router.currentRoute.value.name).toBe('ExpenseRecord')
  })

  it('should have proper iOS styling classes', () => {
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
    expect(wrapper.find('.tab-bar-background').exists()).toBe(true)
    expect(wrapper.find('.tab-bar-content').exists()).toBe(true)
  })

  it('should render icons for each tab', () => {
    const tabItems = wrapper.findAll('.tab-item')
    
    tabItems.forEach((item: any) => {
      const icon = item.find('.tab-icon svg')
      expect(icon.exists()).toBe(true)
    })
  })
})