import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IOSActionSheet from '../components/ui/IOSActionSheet.vue'

// Mock Teleport for testing
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    Teleport: {
      name: 'Teleport',
      props: ['to'],
      setup(props: any, { slots }: any) {
        return () => slots.default?.()
      }
    }
  }
})

describe('IOSActionSheet', () => {
  const mockActions = [
    { text: 'Action 1', handler: vi.fn() },
    { text: 'Action 2', type: 'destructive' as const, handler: vi.fn() },
    { text: 'Disabled Action', type: 'disabled' as const }
  ]
  
  it('renders correctly when visible', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions
      }
    })
    
    expect(wrapper.find('.ios-action-sheet-overlay').exists()).toBe(true)
    expect(wrapper.find('.ios-action-sheet').exists()).toBe(true)
  })
  
  it('does not render when not visible', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: false,
        actions: mockActions
      }
    })
    
    expect(wrapper.find('.ios-action-sheet-overlay').exists()).toBe(false)
  })
  
  it('renders title and message when provided', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        title: 'Test Title',
        message: 'Test Message',
        actions: mockActions
      }
    })
    
    expect(wrapper.find('.ios-action-sheet__title').text()).toBe('Test Title')
    expect(wrapper.find('.ios-action-sheet__message').text()).toBe('Test Message')
  })
  
  it('renders all actions correctly', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions
      }
    })
    
    const actionButtons = wrapper.findAll('.ios-action-sheet__action')
    expect(actionButtons).toHaveLength(3)
    
    expect(actionButtons[0].text()).toBe('Action 1')
    expect(actionButtons[1].text()).toBe('Action 2')
    expect(actionButtons[1].classes()).toContain('ios-action-sheet__action--destructive')
    expect(actionButtons[2].text()).toBe('Disabled Action')
    expect(actionButtons[2].classes()).toContain('ios-action-sheet__action--disabled')
  })
  
  it('renders cancel button when showCancel is true', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions,
        showCancel: true,
        cancelText: 'Cancel'
      }
    })
    
    const cancelButton = wrapper.find('.ios-action-sheet__cancel-button')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.text()).toBe('Cancel')
  })
  
  it('does not render cancel button when showCancel is false', () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions,
        showCancel: false
      }
    })
    
    expect(wrapper.find('.ios-action-sheet__cancel').exists()).toBe(false)
  })
  
  it('emits action event when action is clicked', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions
      }
    })
    
    const firstAction = wrapper.find('.ios-action-sheet__action')
    await firstAction.trigger('click')
    
    expect(wrapper.emitted('action')).toHaveLength(1)
    expect(wrapper.emitted('action')?.[0]).toEqual([mockActions[0], 0])
    expect(wrapper.emitted('update:visible')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })
  
  it('calls action handler when action is clicked', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions
      }
    })
    
    const firstAction = wrapper.find('.ios-action-sheet__action')
    await firstAction.trigger('click')
    
    expect(mockActions[0].handler).toHaveBeenCalled()
  })
  
  it('does not emit action event for disabled actions', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions
      }
    })
    
    const disabledAction = wrapper.findAll('.ios-action-sheet__action')[2]
    await disabledAction.trigger('click')
    
    expect(wrapper.emitted('action')).toBeUndefined()
    expect(wrapper.emitted('update:visible')).toBeUndefined()
  })
  
  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions,
        showCancel: true
      }
    })
    
    const cancelButton = wrapper.find('.ios-action-sheet__cancel-button')
    await cancelButton.trigger('click')
    
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })
  
  it('emits update:visible when overlay is clicked and closeOnOverlay is true', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions,
        closeOnOverlay: true
      }
    })
    
    const overlay = wrapper.find('.ios-action-sheet-overlay')
    await overlay.trigger('click')
    
    expect(wrapper.emitted('update:visible')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })
  
  it('does not emit update:visible when overlay is clicked and closeOnOverlay is false', async () => {
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: mockActions,
        closeOnOverlay: false
      }
    })
    
    const overlay = wrapper.find('.ios-action-sheet-overlay')
    await overlay.trigger('click')
    
    expect(wrapper.emitted('update:visible')).toBeUndefined()
  })
  
  it('renders action icons when provided', () => {
    const actionsWithIcons = [
      { text: 'Camera', icon: '📷' },
      { text: 'Gallery', icon: '🖼️' }
    ]
    
    const wrapper = mount(IOSActionSheet, {
      props: {
        visible: true,
        actions: actionsWithIcons
      }
    })
    
    const icons = wrapper.findAll('.ios-action-sheet__action-icon')
    expect(icons).toHaveLength(2)
    expect(icons[0].text()).toBe('📷')
    expect(icons[1].text()).toBe('🖼️')
  })
})