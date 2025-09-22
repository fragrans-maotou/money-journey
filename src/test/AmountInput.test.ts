import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AmountInput from '@/components/AmountInput.vue'

describe('AmountInput', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(AmountInput)
    
    expect(wrapper.find('.amount-input').exists()).toBe(true)
    expect(wrapper.find('.amount-input__currency').text()).toBe('¥')
    expect(wrapper.find('.amount-input__input').exists()).toBe(true)
  })

  it('displays placeholder correctly', () => {
    const wrapper = mount(AmountInput, {
      props: {
        placeholder: '请输入金额'
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    expect(input.attributes('placeholder')).toBe('请输入金额')
  })

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(AmountInput)
    const input = wrapper.find('.amount-input__input')
    
    await input.setValue('100.50')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([100.5])
  })

  it('formats amount correctly', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        modelValue: 1234.56
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    expect(input.element.value).toBe('1234.56')
  })

  it('handles zero value correctly', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        modelValue: 0
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    expect(input.element.value).toBe('')
  })

  it('shows clear button when value exists and showClear is true', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        modelValue: 100,
        showClear: true
      }
    })
    
    expect(wrapper.find('.amount-input__clear').exists()).toBe(true)
  })

  it('hides clear button when showClear is false', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        modelValue: 100,
        showClear: false
      }
    })
    
    expect(wrapper.find('.amount-input__clear').exists()).toBe(false)
  })

  it('clears input when clear button is clicked', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        modelValue: 100,
        showClear: true
      }
    })
    
    const clearButton = wrapper.find('.amount-input__clear-btn')
    await clearButton.trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('applies min and max constraints', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        min: 10,
        max: 1000
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    
    // Test value below minimum
    await input.setValue('5')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10])
    
    // Test value above maximum
    await input.setValue('2000')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([1000])
  })

  it('handles precision correctly', async () => {
    const wrapper = mount(AmountInput, {
      props: {
        precision: 2
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    await input.setValue('123.456')
    
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([123.46])
  })

  it('prevents invalid characters', async () => {
    const wrapper = mount(AmountInput)
    const input = wrapper.find('.amount-input__input')
    
    const keydownEvent = new KeyboardEvent('keydown', { key: 'a' })
    const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault')
    
    input.element.dispatchEvent(keydownEvent)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('allows valid characters', async () => {
    const wrapper = mount(AmountInput)
    const input = wrapper.find('.amount-input__input')
    
    const keydownEvent = new KeyboardEvent('keydown', { key: '1' })
    const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault')
    
    input.element.dispatchEvent(keydownEvent)
    
    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(AmountInput, {
      props: {
        error: '金额不能为空'
      }
    })
    
    expect(wrapper.find('.amount-input__error').text()).toBe('金额不能为空')
  })

  it('shows hint message when hint prop is provided', () => {
    const wrapper = mount(AmountInput, {
      props: {
        hint: '请输入有效金额'
      }
    })
    
    expect(wrapper.find('.amount-input__hint').text()).toBe('请输入有效金额')
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(AmountInput, {
      props: {
        disabled: true
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('makes input readonly when readonly prop is true', () => {
    const wrapper = mount(AmountInput, {
      props: {
        readonly: true
      }
    })
    
    const input = wrapper.find('.amount-input__input')
    expect(input.attributes('readonly')).toBeDefined()
  })

  it('emits focus and blur events', async () => {
    const wrapper = mount(AmountInput)
    const input = wrapper.find('.amount-input__input')
    
    await input.trigger('focus')
    expect(wrapper.emitted('focus')).toBeTruthy()
    
    await input.trigger('blur')
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('exposes focus, blur, and clear methods', () => {
    const wrapper = mount(AmountInput)
    const vm = wrapper.vm as any
    
    expect(typeof vm.focus).toBe('function')
    expect(typeof vm.blur).toBe('function')
    expect(typeof vm.clear).toBe('function')
  })
})