import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IOSButton from '../components/ui/IOSButton.vue'
import IOSSpinner from '../components/ui/IOSSpinner.vue'

describe('IOSButton', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(IOSButton, {
      slots: {
        default: 'Test Button'
      }
    })
    
    expect(wrapper.text()).toBe('Test Button')
    expect(wrapper.classes()).toContain('ios-button')
    expect(wrapper.classes()).toContain('ios-button--primary')
    expect(wrapper.classes()).toContain('ios-button--medium')
  })
  
  it('applies correct variant classes', () => {
    const variants = ['primary', 'secondary', 'destructive', 'plain'] as const
    
    variants.forEach(variant => {
      const wrapper = mount(IOSButton, {
        props: { variant },
        slots: { default: 'Button' }
      })
      
      expect(wrapper.classes()).toContain(`ios-button--${variant}`)
    })
  })
  
  it('applies correct size classes', () => {
    const sizes = ['small', 'medium', 'large'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(IOSButton, {
        props: { size },
        slots: { default: 'Button' }
      })
      
      expect(wrapper.classes()).toContain(`ios-button--${size}`)
    })
  })
  
  it('shows loading state correctly', () => {
    const wrapper = mount(IOSButton, {
      props: { loading: true },
      slots: { default: 'Button' },
      global: {
        components: { IOSSpinner }
      }
    })
    
    expect(wrapper.classes()).toContain('ios-button--loading')
    expect(wrapper.findComponent(IOSSpinner).exists()).toBe(true)
    expect(wrapper.find('.ios-button__content').exists()).toBe(false)
  })
  
  it('handles disabled state correctly', () => {
    const wrapper = mount(IOSButton, {
      props: { disabled: true },
      slots: { default: 'Button' }
    })
    
    expect(wrapper.classes()).toContain('ios-button--disabled')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
  
  it('applies full width class when fullWidth is true', () => {
    const wrapper = mount(IOSButton, {
      props: { fullWidth: true },
      slots: { default: 'Button' }
    })
    
    expect(wrapper.classes()).toContain('ios-button--full-width')
  })
  
  it('emits click event when clicked and not disabled', async () => {
    const wrapper = mount(IOSButton, {
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('does not emit click event when disabled', async () => {
    const wrapper = mount(IOSButton, {
      props: { disabled: true },
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  
  it('does not emit click event when loading', async () => {
    const wrapper = mount(IOSButton, {
      props: { loading: true },
      slots: { default: 'Button' },
      global: {
        components: { IOSSpinner }
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  
  it('handles touch events correctly', async () => {
    const wrapper = mount(IOSButton, {
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('touchstart')
    expect(wrapper.classes()).toContain('ios-button--pressed')
    
    await wrapper.trigger('touchend')
    expect(wrapper.classes()).not.toContain('ios-button--pressed')
  })
  
  it('does not apply pressed state when disabled', async () => {
    const wrapper = mount(IOSButton, {
      props: { disabled: true },
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('touchstart')
    expect(wrapper.classes()).not.toContain('ios-button--pressed')
  })
})