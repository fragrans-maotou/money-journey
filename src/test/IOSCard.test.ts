import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IOSCard from '../components/ui/IOSCard.vue'

describe('IOSCard', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(IOSCard, {
      slots: {
        default: 'Card content'
      }
    })
    
    expect(wrapper.text()).toBe('Card content')
    expect(wrapper.classes()).toContain('ios-card')
    expect(wrapper.classes()).toContain('ios-card--default')
    expect(wrapper.classes()).toContain('ios-card--padding-medium')
  })
  
  it('applies correct variant classes', () => {
    const variants = ['default', 'elevated', 'outlined', 'filled'] as const
    
    variants.forEach(variant => {
      const wrapper = mount(IOSCard, {
        props: { variant },
        slots: { default: 'Content' }
      })
      
      expect(wrapper.classes()).toContain(`ios-card--${variant}`)
    })
  })
  
  it('applies correct padding classes', () => {
    const paddings = ['none', 'small', 'medium', 'large'] as const
    
    paddings.forEach(padding => {
      const wrapper = mount(IOSCard, {
        props: { padding },
        slots: { default: 'Content' }
      })
      
      expect(wrapper.classes()).toContain(`ios-card--padding-${padding}`)
    })
  })
  
  it('applies clickable class when clickable is true', () => {
    const wrapper = mount(IOSCard, {
      props: { clickable: true },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('ios-card--clickable')
  })
  
  it('applies disabled class when disabled is true', () => {
    const wrapper = mount(IOSCard, {
      props: { disabled: true },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('ios-card--disabled')
  })
  
  it('does not apply clickable class when disabled', () => {
    const wrapper = mount(IOSCard, {
      props: { clickable: true, disabled: true },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).not.toContain('ios-card--clickable')
    expect(wrapper.classes()).toContain('ios-card--disabled')
  })
  
  it('emits click event when clickable and clicked', async () => {
    const wrapper = mount(IOSCard, {
      props: { clickable: true },
      slots: { default: 'Content' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('does not emit click event when not clickable', async () => {
    const wrapper = mount(IOSCard, {
      slots: { default: 'Content' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  
  it('does not emit click event when disabled', async () => {
    const wrapper = mount(IOSCard, {
      props: { clickable: true, disabled: true },
      slots: { default: 'Content' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  
  it('renders header slot correctly', () => {
    const wrapper = mount(IOSCard, {
      slots: {
        header: '<h2>Card Header</h2>',
        default: 'Card content'
      }
    })
    
    const header = wrapper.find('.ios-card__header')
    expect(header.exists()).toBe(true)
    expect(header.html()).toContain('<h2>Card Header</h2>')
  })
  
  it('renders footer slot correctly', () => {
    const wrapper = mount(IOSCard, {
      slots: {
        default: 'Card content',
        footer: '<button>Action</button>'
      }
    })
    
    const footer = wrapper.find('.ios-card__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.html()).toContain('<button>Action</button>')
  })
  
  it('renders all slots together correctly', () => {
    const wrapper = mount(IOSCard, {
      slots: {
        header: '<h2>Header</h2>',
        default: 'Content',
        footer: '<button>Footer</button>'
      }
    })
    
    expect(wrapper.find('.ios-card__header').exists()).toBe(true)
    expect(wrapper.find('.ios-card__content').exists()).toBe(true)
    expect(wrapper.find('.ios-card__footer').exists()).toBe(true)
    
    expect(wrapper.text()).toContain('Header')
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.text()).toContain('Footer')
  })
  
  it('does not render header/footer when slots are empty', () => {
    const wrapper = mount(IOSCard, {
      slots: {
        default: 'Content only'
      }
    })
    
    expect(wrapper.find('.ios-card__header').exists()).toBe(false)
    expect(wrapper.find('.ios-card__footer').exists()).toBe(false)
    expect(wrapper.find('.ios-card__content').exists()).toBe(true)
  })
})