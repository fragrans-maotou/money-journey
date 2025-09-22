import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ExpenseRecord from '@/views/ExpenseRecord.vue'
import { useExpense } from '@/composables/useExpense'
import type { Category, Expense } from '@/types'

// Mock useExpense composable
vi.mock('@/composables/useExpense')

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/statistics', component: { template: '<div>Statistics</div>' } }
  ]
})

const mockCategories: Category[] = [
  { id: '1', name: '餐饮', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { id: '2', name: '交通', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { id: '3', name: '购物', icon: '🛍️', color: '#45B7D1', isDefault: true }
]

const mockTodayExpenses: Expense[] = [
  {
    id: '1',
    amount: 25.50,
    categoryId: '1',
    description: '午餐',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    amount: 12.00,
    categoryId: '2',
    description: '地铁',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockUseExpense = {
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  todayExpenses: { value: mockTodayExpenses },
  todayTotal: { value: 37.50 },
  categories: { value: mockCategories },
  getCategoryById: vi.fn((id: string) => mockCategories.find(cat => cat.id === id)),
  isLoading: { value: false },
  error: { value: null },
  clearError: vi.fn()
}

describe('ExpenseRecord Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useExpense).mockReturnValue(mockUseExpense as any)
  })

  it('renders expense record form correctly', () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    expect(wrapper.find('h1').text()).toBe('记录消费')
    expect(wrapper.find('.record-form').exists()).toBe(true)
    expect(wrapper.find('.today-summary').exists()).toBe(true)
  })

  it('displays today summary correctly', () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    const summaryItems = wrapper.findAll('.summary-item')
    expect(summaryItems[0].find('.value').text()).toBe('¥37.50')
    expect(summaryItems[1].find('.value').text()).toBe('2笔')
  })

  it('displays today expenses list', () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    const expenseItems = wrapper.findAll('.expense-item')
    expect(expenseItems).toHaveLength(2)
    
    // 检查第一个消费记录
    expect(expenseItems[0].find('.category-name').text()).toBe('餐饮')
    expect(expenseItems[0].find('.description').text()).toBe('午餐')
    expect(expenseItems[0].find('.expense-amount').text()).toBe('¥25.50')
  })

  it('submits new expense correctly', async () => {
    const mockAddExpense = vi.fn().mockResolvedValue({
      id: '3',
      amount: 50,
      categoryId: '1',
      description: '晚餐',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockUseExpense.addExpense = mockAddExpense
    
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 填写表单
    const amountInput = wrapper.findComponent({ name: 'AmountInput' })
    await amountInput.vm.$emit('update:modelValue', 50)
    
    const categoryPicker = wrapper.findComponent({ name: 'CategoryPicker' })
    await categoryPicker.vm.$emit('update:modelValue', '1')
    
    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    await datePicker.vm.$emit('update:modelValue', new Date())
    
    const descriptionInput = wrapper.find('.description-input')
    await descriptionInput.setValue('晚餐')
    
    // 提交表单
    await wrapper.find('form').trigger('submit')
    
    expect(mockAddExpense).toHaveBeenCalledWith({
      amount: 50,
      categoryId: '1',
      description: '晚餐',
      date: expect.any(Date)
    })
  })

  it('validates form before submission', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 尝试提交空表单
    await wrapper.find('form').trigger('submit')
    
    // 应该不会调用 addExpense
    expect(mockUseExpense.addExpense).not.toHaveBeenCalled()
    
    // 检查提交按钮是否被禁用
    const submitBtn = wrapper.find('.submit-btn')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('enters edit mode when expense is clicked', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 点击第一个消费记录
    const firstExpense = wrapper.find('.expense-item')
    await firstExpense.trigger('click')
    
    // 检查是否进入编辑模式
    expect(wrapper.find('h1').text()).toBe('编辑消费')
    expect(wrapper.find('.cancel-edit-btn').exists()).toBe(true)
    
    // 检查表单是否填充了数据
    const component = wrapper.vm as any
    expect(component.formData.amount).toBe(25.50)
    expect(component.formData.categoryId).toBe('1')
    expect(component.formData.description).toBe('午餐')
  })

  it('updates expense in edit mode', async () => {
    const mockUpdateExpense = vi.fn().mockResolvedValue({
      id: '1',
      amount: 30,
      categoryId: '1',
      description: '午餐（更新）',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockUseExpense.updateExpense = mockUpdateExpense
    
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 进入编辑模式
    await wrapper.find('.expense-item').trigger('click')
    
    // 修改金额
    const component = wrapper.vm as any
    component.formData.amount = 30
    component.formData.description = '午餐（更新）'
    
    // 提交表单
    await wrapper.find('form').trigger('submit')
    
    expect(mockUpdateExpense).toHaveBeenCalledWith('1', {
      amount: 30,
      categoryId: '1',
      description: '午餐（更新）',
      date: expect.any(Date)
    })
  })

  it('cancels edit mode correctly', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 进入编辑模式
    await wrapper.find('.expense-item').trigger('click')
    expect(wrapper.find('h1').text()).toBe('编辑消费')
    
    // 取消编辑
    await wrapper.find('.cancel-edit-btn').trigger('click')
    
    // 检查是否退出编辑模式
    expect(wrapper.find('h1').text()).toBe('记录消费')
    expect(wrapper.find('.cancel-edit-btn').exists()).toBe(false)
    
    // 检查表单是否重置
    const component = wrapper.vm as any
    expect(component.formData.amount).toBe(0)
    expect(component.formData.categoryId).toBe('')
    expect(component.formData.description).toBe('')
  })

  it('shows success message after adding expense', async () => {
    const mockAddExpense = vi.fn().mockResolvedValue({
      id: '3',
      amount: 50,
      categoryId: '1',
      description: '晚餐',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockUseExpense.addExpense = mockAddExpense
    
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 填写并提交表单
    const component = wrapper.vm as any
    component.formData = {
      amount: 50,
      categoryId: '1',
      description: '晚餐',
      date: new Date()
    }
    
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    
    // 检查成功消息
    expect(wrapper.find('.success-toast').exists()).toBe(true)
    expect(wrapper.find('.toast-message').text()).toBe('消费记录已添加')
  })

  it('shows error message when submission fails', async () => {
    const mockAddExpense = vi.fn().mockRejectedValue(new Error('网络错误'))
    mockUseExpense.addExpense = mockAddExpense
    mockUseExpense.error = { value: '网络错误' }
    
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    // 填写并提交表单
    const component = wrapper.vm as any
    component.formData = {
      amount: 50,
      categoryId: '1',
      description: '晚餐',
      date: new Date()
    }
    
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    
    // 检查错误消息
    expect(wrapper.find('.error-toast').exists()).toBe(true)
    expect(wrapper.find('.toast-message').text()).toBe('网络错误')
  })

  it('validates amount input correctly', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    const component = wrapper.vm as any
    
    // 测试无效金额
    component.formData.amount = 0
    component.validateAmount()
    expect(component.errors.amount).toBe('请输入有效的消费金额')
    
    // 测试过大金额
    component.formData.amount = 1000000
    component.validateAmount()
    expect(component.errors.amount).toBe('消费金额不能超过999,999元')
    
    // 测试有效金额
    component.formData.amount = 50
    component.validateAmount()
    expect(component.errors.amount).toBeUndefined()
  })

  it('validates category selection', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    const component = wrapper.vm as any
    
    // 测试未选择分类
    component.formData.categoryId = ''
    component.validateCategory()
    expect(component.errors.categoryId).toBe('请选择消费分类')
    
    // 测试选择分类
    component.formData.categoryId = '1'
    component.validateCategory()
    expect(component.errors.categoryId).toBeUndefined()
  })

  it('validates date selection', async () => {
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    const component = wrapper.vm as any
    
    // 测试未来日期
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    component.formData.date = futureDate
    component.validateDate()
    expect(component.errors.date).toBe('消费日期不能是未来日期')
    
    // 测试有效日期
    component.formData.date = new Date()
    component.validateDate()
    expect(component.errors.date).toBeUndefined()
  })

  it('shows view more button when there are more than 3 expenses', () => {
    // 创建更多消费记录
    const moreExpenses = [...mockTodayExpenses]
    for (let i = 3; i <= 5; i++) {
      moreExpenses.push({
        id: i.toString(),
        amount: 10,
        categoryId: '1',
        description: `消费${i}`,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    mockUseExpense.todayExpenses = { value: moreExpenses }
    
    const wrapper = mount(ExpenseRecord, {
      global: {
        plugins: [mockRouter]
      }
    })
    
    expect(wrapper.find('.view-more-btn').exists()).toBe(true)
    expect(wrapper.find('.view-more-btn').text()).toBe('查看更多记录')
  })
})