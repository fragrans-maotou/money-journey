import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryPicker from '@/components/CategoryPicker.vue'
import { useExpense } from '@/composables/useExpense'
import type { Category } from '@/types'

// Mock useExpense composable
vi.mock('@/composables/useExpense')

const mockCategories: Category[] = [
  { id: '1', name: '餐饮', icon: '🍽️', color: '#FF6B6B', isDefault: true },
  { id: '2', name: '交通', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { id: '3', name: '购物', icon: '🛍️', color: '#45B7D1', isDefault: true }
]

const mockUseExpense = {
  categories: { value: mockCategories },
  addCategory: vi.fn(),
  isLoading: { value: false },
  error: { value: null }
}

describe('CategoryPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useExpense).mockReturnValue(mockUseExpense as any)
  })

  it('renders categories correctly', () => {
    const wrapper = mount(CategoryPicker)
    
    // 检查是否渲染了所有分类
    const categoryItems = wrapper.findAll('.category-item')
    expect(categoryItems).toHaveLength(3)
    
    // 检查第一个分类的内容
    const firstCategory = categoryItems[0]
    expect(firstCategory.find('.category-name').text()).toBe('餐饮')
    expect(firstCategory.find('.category-icon').text()).toBe('🍽️')
  })

  it('emits update:modelValue when category is selected', async () => {
    const wrapper = mount(CategoryPicker)
    
    const firstCategory = wrapper.find('.category-item')
    await firstCategory.trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0]).toEqual(['1'])
  })

  it('shows active state for selected category', async () => {
    const wrapper = mount(CategoryPicker, {
      props: {
        modelValue: '2'
      }
    })
    
    const categoryItems = wrapper.findAll('.category-item')
    expect(categoryItems[1].classes()).toContain('active')
    expect(categoryItems[0].classes()).not.toContain('active')
  })

  it('opens add category modal when add button is clicked', async () => {
    const wrapper = mount(CategoryPicker)
    
    const addButton = wrapper.find('.add-category-btn')
    await addButton.trigger('click')
    
    expect(wrapper.find('.add-category-modal').exists()).toBe(true)
  })

  it('closes add category modal when close button is clicked', async () => {
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(true)
    
    // 关闭模态框
    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(false)
  })

  it('validates new category form correctly', async () => {
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    
    // 确认按钮应该是禁用的（因为名称为空）
    const confirmBtn = wrapper.find('.confirm-btn')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
    
    // 输入分类名称
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('新分类')
    
    // 现在确认按钮应该是启用的
    expect(confirmBtn.attributes('disabled')).toBeUndefined()
  })

  it('calls addCategory when form is submitted', async () => {
    const mockAddCategory = vi.fn().mockResolvedValue({ id: '4', name: '新分类', icon: '📝', color: '#95A5A6', isDefault: false })
    mockUseExpense.addCategory = mockAddCategory
    
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    
    // 填写表单
    await wrapper.find('input[type="text"]').setValue('新分类')
    
    // 提交表单
    await wrapper.find('.add-category-form').trigger('submit')
    
    expect(mockAddCategory).toHaveBeenCalledWith({
      name: '新分类',
      icon: '📝',
      color: '#95A5A6'
    })
  })

  it('selects icon and color correctly', async () => {
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    
    // 选择图标
    const iconOptions = wrapper.findAll('.icon-option')
    await iconOptions[1].trigger('click')
    expect(iconOptions[1].classes()).toContain('active')
    
    // 选择颜色
    const colorOptions = wrapper.findAll('.color-option')
    await colorOptions[1].trigger('click')
    expect(colorOptions[1].classes()).toContain('active')
  })

  it('updates selected category when modelValue prop changes', async () => {
    const wrapper = mount(CategoryPicker, {
      props: {
        modelValue: '1'
      }
    })
    
    // 初始状态
    expect(wrapper.findAll('.category-item')[0].classes()).toContain('active')
    
    // 更新 prop
    await wrapper.setProps({ modelValue: '2' })
    
    // 检查新的选中状态
    expect(wrapper.findAll('.category-item')[0].classes()).not.toContain('active')
    expect(wrapper.findAll('.category-item')[1].classes()).toContain('active')
  })

  it('closes modal when overlay is clicked', async () => {
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(true)
    
    // 点击遮罩层
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(false)
  })

  it('does not close modal when modal content is clicked', async () => {
    const wrapper = mount(CategoryPicker)
    
    // 打开模态框
    await wrapper.find('.add-category-btn').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(true)
    
    // 点击模态框内容
    await wrapper.find('.add-category-modal').trigger('click')
    expect(wrapper.find('.add-category-modal').exists()).toBe(true)
  })
})