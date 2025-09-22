import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BudgetCard from '@/components/BudgetCard.vue'
import type { BudgetSummary } from '@/types'

// Mock ProgressRing component
vi.mock('@/components/ProgressRing.vue', () => ({
  default: {
    name: 'ProgressRing',
    template: '<div data-testid="progress-ring">Progress Ring</div>',
    props: ['progress', 'size', 'strokeWidth', 'color']
  }
}))

describe('BudgetCard', () => {
  const mockBudgetSummary: BudgetSummary = {
    totalBudget: 3000,
    totalSpent: 1200,
    remainingBudget: 1800,
    dailyAverage: 100,
    daysRemaining: 18,
    isOverBudget: false
  }

  it('renders budget information correctly', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: 150
      }
    })

    expect(wrapper.find('.budget-title').text()).toBe('本月预算')
    expect(wrapper.find('.amount').text()).toBe('3,000')
    expect(wrapper.find('.spent-amount .value').text()).toBe('¥1,200')
    expect(wrapper.find('.remaining-amount .value').text()).toBe('¥1,800')
  })

  it('calculates progress percentage correctly', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: 150
      }
    })

    const vm = wrapper.vm as any
    expect(vm.progressPercentage).toBe(40) // 1200/3000 * 100
  })

  it('shows correct status for normal budget', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: 150
      }
    })

    const vm = wrapper.vm as any
    expect(vm.statusText).toBe('正常')
    expect(vm.statusClass).toBe('status-normal')
  })

  it('shows correct status for warning budget', () => {
    const warningBudget: BudgetSummary = {
      ...mockBudgetSummary,
      totalSpent: 2500 // 83% of budget
    }

    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: warningBudget,
        availableBudget: 50
      }
    })

    const vm = wrapper.vm as any
    expect(vm.statusText).toBe('接近预算')
    expect(vm.statusClass).toBe('status-warning')
  })

  it('shows correct status for exceeded budget', () => {
    const exceededBudget: BudgetSummary = {
      ...mockBudgetSummary,
      totalSpent: 3500,
      remainingBudget: -500,
      isOverBudget: true
    }

    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: exceededBudget,
        availableBudget: -100
      }
    })

    const vm = wrapper.vm as any
    expect(vm.statusText).toBe('已超支')
    expect(vm.statusClass).toBe('status-exceeded')
  })

  it('calculates correct progress color', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: 150
      }
    })

    const vm = wrapper.vm as any
    expect(vm.progressColor).toBe('#34C759') // Green for normal usage
  })

  it('shows over-budget styling for negative available budget', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: -50
      }
    })

    const todayAvailable = wrapper.find('.detail-value.over-budget')
    expect(todayAvailable.exists()).toBe(true)
    expect(todayAvailable.text()).toBe('¥50') // Shows absolute value
  })

  it('formats amounts correctly', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: {
          ...mockBudgetSummary,
          totalBudget: 12345.67
        },
        availableBudget: 150
      }
    })

    const vm = wrapper.vm as any
    expect(vm.formatAmount(12345.67)).toBe('12,345.67')
    expect(vm.formatAmount(1000)).toBe('1,000')
  })

  it('displays budget details correctly', () => {
    const wrapper = mount(BudgetCard, {
      props: {
        budgetSummary: mockBudgetSummary,
        availableBudget: 150
      }
    })

    const detailItems = wrapper.findAll('.detail-item')
    expect(detailItems).toHaveLength(3)
    
    // Daily average
    expect(detailItems[0].find('.detail-label').text()).toBe('日均预算')
    expect(detailItems[0].find('.detail-value').text()).toBe('¥100')
    
    // Days remaining
    expect(detailItems[1].find('.detail-label').text()).toBe('剩余天数')
    expect(detailItems[1].find('.detail-value').text()).toBe('18天')
    
    // Today available
    expect(detailItems[2].find('.detail-label').text()).toBe('今日可用')
    expect(detailItems[2].find('.detail-value').text()).toBe('¥150')
  })
})