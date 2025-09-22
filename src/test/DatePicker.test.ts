import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '@/components/DatePicker.vue'

describe('DatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const wrapper = mount(DatePicker)
    
    expect(wrapper.find('.date-label').text()).toBe('选择日期')
    expect(wrapper.find('.date-value').text()).toBe('请选择日期')
  })

  it('displays formatted date correctly', () => {
    const today = new Date()
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: today
      }
    })
    
    expect(wrapper.find('.date-value').text()).toBe('今天')
  })

  it('displays yesterday correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: yesterday
      }
    })
    
    expect(wrapper.find('.date-value').text()).toBe('昨天')
  })

  it('displays custom date correctly', () => {
    const customDate = new Date(2024, 0, 15) // 2024年1月15日
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: customDate
      }
    })
    
    expect(wrapper.find('.date-value').text()).toBe('1月15日')
  })

  it('opens picker when date display is clicked', async () => {
    const wrapper = mount(DatePicker)
    
    await wrapper.find('.date-display').trigger('click')
    
    expect(wrapper.find('.picker-modal').exists()).toBe(true)
  })

  it('closes picker when close button is clicked', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(true)
    
    // 关闭选择器
    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(false)
  })

  it('closes picker when overlay is clicked', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(true)
    
    // 点击遮罩层
    await wrapper.find('.picker-overlay').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(false)
  })

  it('does not close picker when modal content is clicked', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(true)
    
    // 点击模态框内容
    await wrapper.find('.picker-modal').trigger('click')
    expect(wrapper.find('.picker-modal').exists()).toBe(true)
  })

  it('navigates to previous month', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: new Date(2024, 1, 15) // 2024年2月15日
      }
    })
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 检查当前月份
    expect(wrapper.find('.month').text()).toBe('2月')
    
    // 点击上一月按钮
    const navBtns = wrapper.findAll('.nav-btn')
    await navBtns[0].trigger('click')
    
    // 检查是否切换到上一月
    expect(wrapper.find('.month').text()).toBe('1月')
  })

  it('navigates to next month', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: new Date(2024, 1, 15) // 2024年2月15日
      }
    })
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 检查当前月份
    expect(wrapper.find('.month').text()).toBe('2月')
    
    // 点击下一月按钮
    const navBtns = wrapper.findAll('.nav-btn')
    await navBtns[1].trigger('click')
    
    // 检查是否切换到下一月
    expect(wrapper.find('.month').text()).toBe('3月')
  })

  it('selects quick option correctly', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 点击"今天"快捷选项
    const quickOptions = wrapper.findAll('.quick-option')
    const todayOption = quickOptions.find(option => option.text() === '今天')
    
    if (todayOption) {
      await todayOption.trigger('click')
      expect(todayOption.classes()).toContain('active')
    }
  })

  it('selects date from calendar', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 选择一个日期
    const dateCells = wrapper.findAll('.date-cell')
    const availableDate = dateCells.find(cell => 
      !cell.classes().includes('disabled') && 
      !cell.classes().includes('other-month')
    )
    
    if (availableDate) {
      await availableDate.trigger('click')
      expect(availableDate.classes()).toContain('selected')
    }
  })

  it('emits update:modelValue when date is confirmed', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 选择今天
    const quickOptions = wrapper.findAll('.quick-option')
    const todayOption = quickOptions.find(option => option.text() === '今天')
    if (todayOption) {
      await todayOption.trigger('click')
    }
    
    // 确认选择
    await wrapper.find('.confirm-btn').trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('respects minDate constraint', () => {
    const minDate = new Date(2024, 1, 10)
    const testDate = new Date(2024, 1, 5) // 早于 minDate
    
    const wrapper = mount(DatePicker, {
      props: {
        minDate,
        modelValue: new Date(2024, 1, 15)
      }
    })
    
    // 打开选择器
    wrapper.find('.date-display').trigger('click')
    
    // 检查早于 minDate 的日期是否被禁用
    // 这里我们通过检查组件的内部逻辑来验证
    const component = wrapper.vm as any
    expect(component.isDateDisabled(testDate)).toBe(true)
  })

  it('respects maxDate constraint', () => {
    const maxDate = new Date(2024, 1, 20)
    const testDate = new Date(2024, 1, 25) // 晚于 maxDate
    
    const wrapper = mount(DatePicker, {
      props: {
        maxDate,
        modelValue: new Date(2024, 1, 15)
      }
    })
    
    // 打开选择器
    wrapper.find('.date-display').trigger('click')
    
    // 检查晚于 maxDate 的日期是否被禁用
    const component = wrapper.vm as any
    expect(component.isDateDisabled(testDate)).toBe(true)
  })

  it('updates when modelValue prop changes', async () => {
    const initialDate = new Date(2024, 1, 15)
    const newDate = new Date(2024, 2, 20)
    
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: initialDate
      }
    })
    
    // 更新 prop
    await wrapper.setProps({ modelValue: newDate })
    
    // 检查显示是否更新
    expect(wrapper.find('.date-value').text()).toBe('3月20日')
  })

  it('shows today indicator correctly', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: new Date()
      }
    })
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 检查是否有今天的标记
    const todayCells = wrapper.findAll('.date-cell.today')
    expect(todayCells.length).toBeGreaterThan(0)
  })

  it('displays weekday headers correctly', async () => {
    const wrapper = mount(DatePicker)
    
    // 打开选择器
    await wrapper.find('.date-display').trigger('click')
    
    // 检查星期标题
    const weekdays = wrapper.findAll('.weekday')
    expect(weekdays).toHaveLength(7)
    expect(weekdays[0].text()).toBe('日')
    expect(weekdays[1].text()).toBe('一')
    expect(weekdays[6].text()).toBe('六')
  })
})