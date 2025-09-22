import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetSettings from '@/views/BudgetSettings.vue'
import { useBudget } from '@/composables/useBudget'
import type { Budget, BudgetSummary } from '@/types'

// Mock the composables
vi.mock('@/composables/useBudget')

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/budget-settings', component: BudgetSettings }
  ]
})

describe('BudgetSettings', () => {
  const mockBudget: Budget = {
    id: '1',
    monthlyAmount: 3000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    dailyAllocation: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockBudgetSummary: BudgetSummary = {
    totalBudget: 3000,
    totalSpent: 1200,
    remainingBudget: 1800,
    dailyAverage: 100,
    daysRemaining: 15,
    isOverBudget: false
  }

  const mockUseBudget = {
    currentBudget: { value: null },
    budgetSummary: { value: mockBudgetSummary },
    isLoading: { value: false },
    error: { value: null },
    setMonthlyBudget: vi.fn(),
    updateMonthlyBudget: vi.fn(),
    deleteBudget: vi.fn(),
    clearError: vi.fn()
  }

  beforeEach(() => {
    vi.mocked(useBudget).mockReturnValue(mockUseBudget as any)
  })

  it('renders correctly with default state', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.find('.budget-settings').exists()).toBe(true)
    expect(wrapper.find('.settings-header h1').text()).toBe('预算设置')
    expect(wrapper.find('.settings-subtitle').text()).toBe('管理您的月度预算和预警设置')
  })

  it('displays budget form section', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const budgetSection = wrapper.find('.settings-section')
    expect(budgetSection.find('h2').text()).toBe('月度预算')
    expect(budgetSection.find('p').text()).toBe('设置您的月度预算金额')
  })

  it('displays warning settings section', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const sections = wrapper.findAll('.settings-section')
    const warningSection = sections[1]
    
    expect(warningSection.find('h2').text()).toBe('预算预警')
    expect(warningSection.find('p').text()).toBe('当预算使用达到设定比例时提醒您')
  })

  it('displays budget status when budget exists', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = { ...mockBudgetSummary, totalBudget: 3000 }
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const sections = wrapper.findAll('.settings-section')
    const statusSection = sections[2]
    
    expect(statusSection.find('h2').text()).toBe('当前预算状态')
    expect(statusSection.find('.status-grid').exists()).toBe(true)
  })

  it('shows correct budget status values', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = mockBudgetSummary
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const statusItems = wrapper.findAll('.status-item')
    
    expect(statusItems[0].find('.status-label').text()).toBe('总预算')
    expect(statusItems[0].find('.status-value').text()).toBe('¥3,000.00')
    
    expect(statusItems[1].find('.status-label').text()).toBe('已使用')
    expect(statusItems[1].find('.status-value').text()).toBe('¥1,200.00')
    
    expect(statusItems[2].find('.status-label').text()).toBe('剩余')
    expect(statusItems[2].find('.status-value').text()).toBe('¥1,800.00')
    
    expect(statusItems[3].find('.status-label').text()).toBe('剩余天数')
    expect(statusItems[3].find('.status-value').text()).toBe('15天')
  })

  it('displays progress bar with correct percentage', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = mockBudgetSummary
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const progressFill = wrapper.find('.progress-fill')
    const progressText = wrapper.find('.progress-text')
    
    expect(progressFill.attributes('style')).toContain('width: 40%') // 1200/3000 = 40%
    expect(progressText.text()).toBe('已使用 40%')
  })

  it('shows warning class when usage exceeds threshold', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = {
      ...mockBudgetSummary,
      totalSpent: 2500 // 83% usage
    }
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.classes()).toContain('warning')
  })

  it('shows exceeded class when over budget', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = {
      ...mockBudgetSummary,
      totalSpent: 3500,
      remainingBudget: -500,
      isOverBudget: true
    }
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const progressFill = wrapper.find('.progress-fill')
    const remainingValue = wrapper.findAll('.status-value')[2]
    
    expect(progressFill.classes()).toContain('exceeded')
    expect(remainingValue.classes()).toContain('negative')
  })

  it('enables save button when form is valid', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    // Set a valid budget amount
    await wrapper.setData({ budgetAmount: 3000 })
    
    const saveButton = wrapper.find('.settings-actions .ios-button')
    expect(saveButton.attributes('disabled')).toBeUndefined()
  })

  it('disables save button when form is invalid', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    // Set invalid budget amount
    await wrapper.setData({ budgetAmount: 0, budgetError: '预算金额必须大于0' })
    
    const saveButton = wrapper.find('.settings-actions .ios-button')
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('calls setMonthlyBudget when creating new budget', async () => {
    mockUseBudget.currentBudget.value = null
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.setData({ budgetAmount: 3000 })
    
    const saveButton = wrapper.find('.settings-actions .ios-button')
    await saveButton.trigger('click')
    
    expect(mockUseBudget.setMonthlyBudget).toHaveBeenCalledWith({
      monthlyAmount: 3000,
      startDate: expect.any(Date)
    })
  })

  it('calls updateMonthlyBudget when updating existing budget', async () => {
    mockUseBudget.currentBudget.value = mockBudget
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.setData({ budgetAmount: 3500 })
    
    const saveButton = wrapper.find('.settings-actions .ios-button')
    await saveButton.trigger('click')
    
    expect(mockUseBudget.updateMonthlyBudget).toHaveBeenCalledWith({
      monthlyAmount: 3500
    })
  })

  it('shows delete button when budget exists', () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = { ...mockBudgetSummary, totalBudget: 3000 }
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const buttons = wrapper.findAll('.settings-actions .ios-button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1].text()).toBe('删除预算')
  })

  it('handles warning threshold changes', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const slider = wrapper.find('.slider')
    await slider.setValue('90')
    
    expect(wrapper.find('.threshold-value').text()).toBe('90%')
  })

  it('handles daily reminder toggle', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const toggle = wrapper.find('.ios-switch input')
    await toggle.setChecked(false)
    
    expect(toggle.element.checked).toBe(false)
  })

  it('shows period picker when period change button is clicked', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const changeButton = wrapper.find('.budget-period .ios-button')
    await changeButton.trigger('click')
    
    expect(wrapper.vm.showPeriodPicker).toBe(true)
  })

  it('shows delete confirmation when delete button is clicked', async () => {
    mockUseBudget.currentBudget.value = mockBudget
    mockUseBudget.budgetSummary.value = { ...mockBudgetSummary, totalBudget: 3000 }
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const deleteButton = wrapper.findAll('.settings-actions .ios-button')[1]
    await deleteButton.trigger('click')
    
    expect(wrapper.vm.showDeleteConfirm).toBe(true)
  })

  it('initializes form with existing budget data', () => {
    mockUseBudget.currentBudget.value = mockBudget
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.vm.budgetAmount).toBe(3000)
  })

  it('handles loading state correctly', () => {
    mockUseBudget.isLoading.value = true
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    const saveButton = wrapper.find('.settings-actions .ios-button')
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('displays error messages', () => {
    mockUseBudget.error.value = '保存失败'
    
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.vm.budgetError).toBe('保存失败')
  })
})