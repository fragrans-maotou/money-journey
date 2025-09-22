import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IOSInput from '../components/ui/IOSInput.vue'

describe('IOSInput', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(IOSInput)
    
    expect(wrapper.find('.ios-input').exists()).toBe(true)
    expect(wrapper.find('.ios-input__container').exists()).toBe(true)
    expect(wrapper.find('.ios-input').classes()).toContain('ios-input--medium')
  })
  
  it('displays label when provided', () => {
    const wrapper = mount(IOSInput, {
      props: { label: 'Test Label' }
    })
    
    const label = wrapper.find('.ios-input__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Test Label')
  })
  
  it('shows required indicator when required is true', () => {
    const wrapper = mount(IOSInput, {
      props: { label: 'Test Label', required: true }
    })
    
    expect(wrapper.find('.ios-input__required').exists()).toBe(true)
    expect(wrapper.find('.ios-input__required').text()).toBe('*')
  })
  
  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(IOSInput, {
        props: { size }
      })
      
      expect(wrapper.find('.ios-input__container').classes()).toContain(`ios-input__container--${size}`)
      expect(wrapper.find('.ios-input').classes()).toContain(`ios-input--${size}`)
    })
  })
  
  it('handles v-model correctly', async () => {
    const wrapper = mount(IOSInput, {
      props: {
        modelValue: 'initial value',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value })
      }
    })
    
    const input = wrapper.find('input')
    expect(input.element.value).toBe('initial value')
    
    await input.setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toEqual([['new value']])
  })
  
  it('handles number type correctly', async () => {
    const wrapper = mount(IOSInput, {
      props: {
        type: 'number',
        modelValue: 42,
        'onUpdate:modelValue': (value: number) => wrapper.setProps({ modelValue: value })
      }
    })
    
    const input = wrapper.find('input')
    expect(input.element.value).toBe('42')
    
    await input.setValue('100')
    expect(wrapper.emitted('update:modelValue')).toEqual([[100]])
  })
  
  it('shows error state correctly', () => {
    const wrapper = mount(IOSInput, {
      props: { error: 'This is an error' }
    })
    
    expect(wrapper.find('.ios-input__container').classes()).toContain('ios-input__container--error')
    expect(wrapper.find('.ios-input__error').exists()).toBe(true)
    expect(wrapper.find('.ios-input__error').text()).toBe('This is an error')
  })
  
  it('shows hint when provided and no error', () => {
    const wrapper = mount(IOSInput, {
      props: { hint: 'This is a hint' }
    })
    
    expect(wrapper.find('.ios-input__hint').exists()).toBe(true)
    expect(wrapper.find('.ios-input__hint').text()).toBe('This is a hint')
  })
  
  it('prioritizes error over hint', () => {
    const wrapper = mount(IOSInput, {
      props: { 
        error: 'This is an error',
        hint: 'This is a hint'
      }
    })
    
    expect(wrapper.find('.ios-input__error').exists()).toBe(true)
    expect(wrapper.find('.ios-input__hint').exists()).toBe(false)
  })
  
  it('handles disabled state correctly', () => {
    const wrapper = mount(IOSInput, {
      props: { disabled: true }
    })
    
    expect(wrapper.find('.ios-input__container').classes()).toContain('ios-input__container--disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
  
  it('handles readonly state correctly', () => {
    const wrapper = mount(IOSInput, {
      props: { readonly: true }
    })
    
    expect(wrapper.find('.ios-input__container').classes()).toContain('ios-input__container--readonly')
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
  })
  
  it('shows clear button when clearable and has value', async () => {
    const wrapper = mount(IOSInput, {
      props: { 
        clearable: true,
        modelValue: 'test value',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value })
      }
    })
    
    expect(wrapper.find('.ios-input__clear').exists()).toBe(true)
    
    await wrapper.find('.ios-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
  
  it('does not show clear button when no value', () => {
    const wrapper = mount(IOSInput, {
      props: { clearable: true, modelValue: '' }
    })
    
    expect(wrapper.find('.ios-input__clear').exists()).toBe(false)
  })
  
  it('handles focus and blur events correctly', async () => {
    const wrapper = mount(IOSInput)
    const input = wrapper.find('input')
    
    await input.trigger('focus')
    expect(wrapper.find('.ios-input__container').classes()).toContain('ios-input__container--focused')
    expect(wrapper.emitted('focus')).toHaveLength(1)
    
    await input.trigger('blur')
    expect(wrapper.find('.ios-input__container').classes()).not.toContain('ios-input__container--focused')
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })
  
  it('renders prefix and suffix slots correctly', () => {
    const wrapper = mount(IOSInput, {
      slots: {
        prefix: '<span class="prefix">$</span>',
        suffix: '<span class="suffix">USD</span>'
      }
    })
    
    expect(wrapper.find('.ios-input__prefix').exists()).toBe(true)
    expect(wrapper.find('.ios-input__suffix').exists()).toBe(true)
    expect(wrapper.find('.prefix').text()).toBe('$')
    expect(wrapper.find('.suffix').text()).toBe('USD')
  })
})