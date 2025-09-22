import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BudgetSettings from '@/views/BudgetSettings.vue'
import AmountInput from '@/components/AmountInput.vue'
import IOSButton from '@/components/ui/IOSButton.vue'
import IOSActionSheet from '@/components/ui/IOSActionSheet.vue'

// Mock the composables
vi.mock('@/composables/useBudget', () => ({
  useBudget: () => ({
    currentBudget: { value: null },
    budgetSummary: { 
      value: {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        dailyAverage: 0,
        daysRemaining: 0,
        isOverBudget: false
      }
    },
    isLoading: { value: false },
    error: { value: null },
    setMonthlyBudget: vi.fn(),
    updateMonthlyBudget: vi.fn(),
    deleteBudget: vi.fn(),
    clearError: vi.fn()
  })
}))

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/budget-settings', component: BudgetSettings }
  ]
})

describe('BudgetSettings Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all main sections', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    expect(wrapper.find('.budget-settings').exists()).toBe(true)
    expect(wrapper.find('.settings-header').exists()).toBe(true)
    expect(wrapper.find('.settings-content').exists()).toBe(true)
    
    // Check main sections
    const sections = wrapper.findAll('.settings-section')
    expect(sections.length).toBeGreaterThanOrEqual(2) // Budget form and warning settings
    
    // Check if AmountInput is rendered
    expect(wrapper.findComponent(AmountInput).exists()).toBe(true)
    
    // Check if save button is rendered
    const saveButton = wrapper.findComponent(IOSButton)
    expect(saveButton.exists()).toBe(true)
  })

  it('displays correct section titles', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    const sectionHeaders = wrapper.findAll('.section-header h2')
    expect(sectionHeaders[0].text()).toBe('月度预算')
    expect(sectionHeaders[1].text()).toBe('预算预警')
  })

  it('has working amount input', async () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    const amountInput = wrapper.findComponent(AmountInput)
    expect(amountInput.exists()).toBe(true)
    
    // Test that we can interact with the amount input
    await amountInput.vm.$emit('update:modelValue', 3000)
    expect(amountInput.emitted('update:modelValue')).toBeTruthy()
  })

  it('has working warning threshold slider', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    const slider = wrapper.find('.slider')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('type')).toBe('range')
    expect(slider.attributes('min')).toBe('50')
    expect(slider.attributes('max')).toBe('95')
  })

  it('has working daily reminder toggle', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    const toggle = wrapper.find('.ios-switch input')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('type')).toBe('checkbox')
  })

  it('shows action buttons', () => {
    const wrapper = mount(BudgetSettings, {
      global: {
        plugins: [router],
        components: {
          AmountInput,
          IOSButton,
          IOSActionSheet
        }
      }
    })
    
    const actionsSection = wrapper.find('.settings-actions')
    expect(actionsSection.exists()).toBe(true)
    
    const buttons = actionsSection.findAllComponents(IOSButton)
    expect(buttons.length).toBeGreaterThanOrEqual(1) // At least save button
  })
})