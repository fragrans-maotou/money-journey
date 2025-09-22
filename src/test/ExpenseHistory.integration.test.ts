import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ExpenseHistory from '@/views/ExpenseHistory.vue'
import { useExpense } from '@/composables/useExpense'
import type { Expense, Category } from '@/types'

// Mock the useExpense composable
vi.mock('@/composables/useExpense')

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/expense-record', component: { template: '<div>Expense Record</div>' } }
  ]
})

// Mock data
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: '餐饮',
    icon: '🍽️',
    color: '#FF6B6B',
    isDefault: true
  },
  {
    id: 'cat-2',
    name: '交通',
    icon: '🚗',
    color: '#4ECDC4',
    isDefault: true
  }
]

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    amount: 25.50,
    categoryId: 'cat-1',
    description: '午餐',
    date: new Date('2024-01-15T12:30:00'),
    createdAt: new Date('2024-01-15T12:30:00'),
    updatedAt: new Date('2024-01-15T12:30:00')
  },
  {
    id: 'exp-2',
    amount: 15.00,
    categoryId: 'cat-2',
    description: '地铁',
    date: new Date('2024-01-15T08:00:00'),
    createdAt: new Date('2024-01-15T08:00:00'),
    updatedAt: new Date('2024-01-15T08:00:00')
  },
  {
    id: 'exp-3',
    amount: 30.00,
    categoryId: 'cat-1',
    description: '晚餐',
    date: new Date('2024-01-14T19:00:00'),
    createdAt: new Date('2024-01-14T19:00:00'),
    updatedAt: new Date('2024-01-14T19:00:00')
  }
]

describe('ExpenseHistory Integration', () => {
  let mockUseExpense: any

  beforeEach(() => {
    mockUseExpense = {
      filteredExpenses: { value: mockExpenses },
      categories: { value: mockCategories },
      currentFilter: { value: {} },
      isLoading: { value: false },
      error: { value: null },
      deleteExpense: vi.fn(),
      setFilter: vi.fn(),
      clearFilter: vi.fn(),
      getCategoryById: vi.fn((id: string) => mockCategories.find(cat => cat.id === id)),
      clearError: vi.fn()
    }

    vi.mocked(useExpense).mockReturnValue(mockUseExpense)
  })

  it('renders expense history page correctly', () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 检查页面标题
    expect(wrapper.find('h1').text()).toBe('消费历史')

    // 检查搜索栏
    expect(wrapper.find('.search-input').exists()).toBe(true)

    // 检查统计概览
    expect(wrapper.find('.statistics-overview').exists()).toBe(true)

    // 检查消费记录列表
    expect(wrapper.find('.expense-list').exists()).toBe(true)
  })

  it('displays statistics overview correctly', () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const statItems = wrapper.findAll('.stat-item')
    expect(statItems).toHaveLength(3)

    // 检查总记录数
    expect(statItems[0].find('.stat-label').text()).toBe('总记录')
    expect(statItems[0].find('.stat-value').text()).toBe('3笔')

    // 检查总金额
    expect(statItems[1].find('.stat-label').text()).toBe('总金额')
    expect(statItems[1].find('.stat-value').text()).toBe('¥70.50')

    // 检查平均金额
    expect(statItems[2].find('.stat-label').text()).toBe('平均金额')
    expect(statItems[2].find('.stat-value').text()).toBe('¥23.50')
  })

  it('groups expenses by date correctly', () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const expenseGroups = wrapper.findAll('.expense-group')
    expect(expenseGroups).toHaveLength(2) // 两个不同的日期

    // 检查第一组（最新日期）
    const firstGroup = expenseGroups[0]
    expect(firstGroup.find('.group-total').text()).toBe('¥40.50') // 25.50 + 15.00

    // 检查第二组
    const secondGroup = expenseGroups[1]
    expect(secondGroup.find('.group-total').text()).toBe('¥30.00')
  })

  it('handles search functionality', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('午餐')
    await searchInput.trigger('input')

    expect(mockUseExpense.setFilter).toHaveBeenCalledWith({
      description: '午餐'
    })
  })

  it('clears search when clear button is clicked', async () => {
    // 设置有搜索查询的状态
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 模拟有搜索查询
    await wrapper.setData({ searchQuery: '午餐' })
    await wrapper.vm.$nextTick()

    const clearButton = wrapper.find('.clear-search-btn')
    expect(clearButton.exists()).toBe(true)

    await clearButton.trigger('click')

    expect(mockUseExpense.setFilter).toHaveBeenCalled()
  })

  it('opens filter modal when filter button is clicked', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const filterButton = wrapper.find('.filter-btn')
    await filterButton.trigger('click')

    expect(wrapper.find('.filter-modal').exists()).toBe(true)
  })

  it('applies filters correctly', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 打开筛选模态框
    await wrapper.find('.filter-btn').trigger('click')

    // 设置筛选条件
    const categorySelect = wrapper.find('.filter-select')
    await categorySelect.setValue('cat-1')

    const startDateInput = wrapper.findAll('.filter-input')[0]
    await startDateInput.setValue('2024-01-01')

    const endDateInput = wrapper.findAll('.filter-input')[1]
    await endDateInput.setValue('2024-01-31')

    // 应用筛选
    const applyButton = wrapper.find('.apply-btn')
    await applyButton.trigger('click')

    expect(mockUseExpense.setFilter).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    })
  })

  it('resets filters correctly', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 打开筛选模态框
    await wrapper.find('.filter-btn').trigger('click')

    // 重置筛选
    const resetButton = wrapper.find('.reset-btn')
    await resetButton.trigger('click')

    // 检查表单是否被重置
    expect(wrapper.vm.filterForm.categoryId).toBe('')
    expect(wrapper.vm.filterForm.startDate).toBe('')
    expect(wrapper.vm.filterForm.endDate).toBe('')
  })

  it('handles expense editing', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const pushSpy = vi.spyOn(mockRouter, 'push')

    // 模拟编辑事件
    const expenseItems = wrapper.findAllComponents({ name: 'ExpenseItem' })
    await expenseItems[0].vm.$emit('edit', mockExpenses[0])

    expect(pushSpy).toHaveBeenCalledWith({
      path: '/expense-record',
      query: { edit: 'exp-1' }
    })
  })

  it('handles expense deletion', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 模拟删除事件
    const expenseItems = wrapper.findAllComponents({ name: 'ExpenseItem' })
    await expenseItems[0].vm.$emit('delete', mockExpenses[0])

    // 检查删除模态框是否显示
    expect(wrapper.find('.delete-modal').exists()).toBe(true)
    expect(wrapper.vm.expenseToDelete).toEqual(mockExpenses[0])
  })

  it('confirms expense deletion', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 设置要删除的消费记录
    await wrapper.setData({ 
      showDeleteModal: true, 
      expenseToDelete: mockExpenses[0] 
    })

    const confirmButton = wrapper.find('.confirm-delete-btn')
    await confirmButton.trigger('click')

    expect(mockUseExpense.deleteExpense).toHaveBeenCalledWith('exp-1')
  })

  it('cancels expense deletion', async () => {
    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    // 设置要删除的消费记录
    await wrapper.setData({ 
      showDeleteModal: true, 
      expenseToDelete: mockExpenses[0] 
    })

    const cancelButton = wrapper.find('.cancel-btn')
    await cancelButton.trigger('click')

    expect(wrapper.vm.showDeleteModal).toBe(false)
    expect(wrapper.vm.expenseToDelete).toBe(null)
  })

  it('displays empty state when no expenses', () => {
    mockUseExpense.filteredExpenses.value = []

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state h3').text()).toBe('暂无消费记录')
  })

  it('displays loading state', () => {
    mockUseExpense.isLoading.value = true

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('displays error toast when error occurs', () => {
    mockUseExpense.error.value = '删除失败'

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    expect(wrapper.find('.error-toast').exists()).toBe(true)
    expect(wrapper.find('.toast-message').text()).toBe('删除失败')
  })

  it('clears all filters when clear all button is clicked', async () => {
    // 设置有活跃筛选条件的状态
    mockUseExpense.currentFilter.value = {
      categoryId: 'cat-1',
      startDate: new Date('2024-01-01')
    }

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const clearAllButton = wrapper.find('.clear-all-filters')
    await clearAllButton.trigger('click')

    expect(mockUseExpense.clearFilter).toHaveBeenCalled()
  })

  it('displays filter tags when filters are active', () => {
    mockUseExpense.currentFilter.value = {
      categoryId: 'cat-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    }

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    expect(wrapper.find('.filter-tags').exists()).toBe(true)
    const filterTags = wrapper.findAll('.filter-tag')
    expect(filterTags.length).toBeGreaterThan(0)
  })

  it('navigates to expense record when add expense button is clicked', async () => {
    mockUseExpense.filteredExpenses.value = []

    const wrapper = mount(ExpenseHistory, {
      global: {
        plugins: [mockRouter]
      }
    })

    const pushSpy = vi.spyOn(mockRouter, 'push')

    const addButton = wrapper.find('.add-expense-btn')
    await addButton.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/expense-record')
  })
})