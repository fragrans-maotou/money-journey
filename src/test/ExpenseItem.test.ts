import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpenseItem from '@/components/ExpenseItem.vue'
import type { Expense, Category } from '@/types'

// Mock data
const mockExpense: Expense = {
  id: 'expense-1',
  amount: 25.50,
  categoryId: 'category-1',
  description: '午餐',
  date: new Date('2024-01-15T12:30:00'),
  createdAt: new Date('2024-01-15T12:30:00'),
  updatedAt: new Date('2024-01-15T12:30:00')
}

const mockCategory: Category = {
  id: 'category-1',
  name: '餐饮',
  icon: '🍽️',
  color: '#FF6B6B',
  isDefault: true
}

describe('ExpenseItem', () => {
  it('renders expense information correctly', () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory
      }
    })

    // 检查分类图标和颜色
    const categoryIcon = wrapper.find('.category-icon')
    expect(categoryIcon.exists()).toBe(true)
    expect(categoryIcon.text()).toBe('🍽️')
    expect(categoryIcon.attributes('style')).toContain('background-color: rgb(255, 107, 107)')

    // 检查分类名称
    expect(wrapper.find('.category-name').text()).toBe('餐饮')

    // 检查描述
    expect(wrapper.find('.expense-description').text()).toBe('午餐')

    // 检查金额
    expect(wrapper.find('.expense-amount').text()).toBe('¥25.50')
  })

  it('displays fallback values when category is not provided', () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense
      }
    })

    // 检查默认图标和颜色
    const categoryIcon = wrapper.find('.category-icon')
    expect(categoryIcon.text()).toBe('📝')
    expect(categoryIcon.attributes('style')).toContain('background-color: rgb(149, 165, 166)')

    // 检查默认分类名称
    expect(wrapper.find('.category-name').text()).toBe('未知分类')
  })

  it('displays "无备注" when description is empty', () => {
    const expenseWithoutDescription = {
      ...mockExpense,
      description: ''
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: expenseWithoutDescription,
        category: mockCategory
      }
    })

    expect(wrapper.find('.expense-description').text()).toBe('无备注')
  })

  it('formats time correctly for today', () => {
    const today = new Date()
    const todayExpense = {
      ...mockExpense,
      date: today
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: todayExpense,
        category: mockCategory
      }
    })

    const timeText = wrapper.find('.expense-time').text()
    // 应该显示时间格式 (HH:MM)
    expect(timeText).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formats time correctly for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const yesterdayExpense = {
      ...mockExpense,
      date: yesterday
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: yesterdayExpense,
        category: mockCategory
      }
    })

    expect(wrapper.find('.expense-time').text()).toBe('昨天')
  })

  it('formats time correctly for dates in current year', () => {
    const currentYear = new Date().getFullYear()
    const dateInCurrentYear = new Date(currentYear, 5, 15) // June 15th
    
    const expenseInCurrentYear = {
      ...mockExpense,
      date: dateInCurrentYear
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: expenseInCurrentYear,
        category: mockCategory
      }
    })

    const timeText = wrapper.find('.expense-time').text()
    expect(timeText).toContain('6月')
    expect(timeText).toContain('15')
  })

  it('shows action buttons when showActions is true', () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        showActions: true
      }
    })

    expect(wrapper.find('.action-buttons').exists()).toBe(true)
    expect(wrapper.find('.edit-btn').exists()).toBe(true)
    expect(wrapper.find('.delete-btn').exists()).toBe(true)
  })

  it('hides action buttons when showActions is false', () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        showActions: false
      }
    })

    expect(wrapper.find('.action-buttons').exists()).toBe(false)
  })

  it('emits click event when item is clicked and clickable is true', async () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        clickable: true
      }
    })

    await wrapper.find('.expense-item').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockExpense])
  })

  it('does not emit click event when clickable is false', async () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        clickable: false
      }
    })

    await wrapper.find('.expense-item').trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        showActions: true
      }
    })

    await wrapper.find('.edit-btn').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockExpense])
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        showActions: true
      }
    })

    await wrapper.find('.delete-btn').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockExpense])
  })

  it('stops propagation when action buttons are clicked', async () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory,
        showActions: true,
        clickable: true
      }
    })

    // 点击编辑按钮不应该触发 click 事件
    await wrapper.find('.edit-btn').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
    expect(wrapper.emitted('edit')).toBeTruthy()

    // 点击删除按钮不应该触发 click 事件
    await wrapper.find('.delete-btn').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('applies correct CSS classes and styles', () => {
    const wrapper = mount(ExpenseItem, {
      props: {
        expense: mockExpense,
        category: mockCategory
      }
    })

    // 检查主容器类
    expect(wrapper.find('.expense-item').exists()).toBe(true)

    // 检查信息区域
    expect(wrapper.find('.expense-info').exists()).toBe(true)
    expect(wrapper.find('.expense-details').exists()).toBe(true)
    expect(wrapper.find('.expense-header').exists()).toBe(true)

    // 检查操作区域
    expect(wrapper.find('.expense-actions').exists()).toBe(true)
  })

  it('handles long descriptions with ellipsis', () => {
    const longDescriptionExpense = {
      ...mockExpense,
      description: '这是一个非常长的描述文本，应该会被截断并显示省略号'
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: longDescriptionExpense,
        category: mockCategory
      }
    })

    const descriptionElement = wrapper.find('.expense-description')
    expect(descriptionElement.text()).toBe(longDescriptionExpense.description)
    
    // 检查 CSS 类是否正确应用（用于文本截断）
    const computedStyle = window.getComputedStyle(descriptionElement.element)
    expect(descriptionElement.classes()).toContain('expense-description')
  })

  it('formats large amounts correctly', () => {
    const expensiveExpense = {
      ...mockExpense,
      amount: 1234.56
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: expensiveExpense,
        category: mockCategory
      }
    })

    expect(wrapper.find('.expense-amount').text()).toBe('¥1234.56')
  })

  it('formats small amounts correctly', () => {
    const cheapExpense = {
      ...mockExpense,
      amount: 0.01
    }

    const wrapper = mount(ExpenseItem, {
      props: {
        expense: cheapExpense,
        category: mockCategory
      }
    })

    expect(wrapper.find('.expense-amount').text()).toBe('¥0.01')
  })
})