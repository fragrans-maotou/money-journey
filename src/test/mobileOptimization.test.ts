import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useDeviceAdaptation } from '../composables/useDeviceAdaptation'
import { usePerformanceOptimization } from '../composables/usePerformanceOptimization'
import { useTouchOptimization } from '../composables/useTouchOptimization'
import SafeArea from '../components/layout/SafeArea.vue'
import VirtualScroller from '../components/VirtualScroller.vue'
import LazyImage from '../components/LazyImage.vue'
import ResponsiveContainer from '../components/ResponsiveContainer.vue'

// Mock window properties
const mockWindow = {
  innerWidth: 375,
  innerHeight: 667,
  devicePixelRatio: 2,
  visualViewport: {
    height: 667,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('Mobile Optimization', () => {
  beforeEach(() => {
    // Setup window mocks
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: mockWindow.innerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: mockWindow.innerHeight
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: mockWindow.devicePixelRatio
    })
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockWindow.visualViewport
    })

    // Setup global mocks
    global.IntersectionObserver = mockIntersectionObserver
    global.ResizeObserver = mockResizeObserver
    
    // Mock navigator
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useDeviceAdaptation', () => {
    it('should detect device characteristics correctly', () => {
      const { deviceInfo } = useDeviceAdaptation()
      
      expect(deviceInfo.value.screenWidth).toBe(375)
      expect(deviceInfo.value.screenHeight).toBe(667)
      expect(deviceInfo.value.isHighDPI).toBe(true)
      expect(deviceInfo.value.isLandscape).toBe(false)
      expect(deviceInfo.value.isSmallScreen).toBe(true)
    })

    it('should provide correct touch area configuration', () => {
      const { touchAreaConfig } = useDeviceAdaptation()
      
      expect(touchAreaConfig.value.minSize).toBe(40) // Small screen
      expect(touchAreaConfig.value.padding).toBe(8)
      expect(touchAreaConfig.value.margin).toBe(4)
    })

    it('should detect landscape orientation', () => {
      // Mock landscape orientation
      Object.defineProperty(window, 'innerWidth', { value: 667 })
      Object.defineProperty(window, 'innerHeight', { value: 375 })
      
      const { isLandscape } = useDeviceAdaptation()
      expect(isLandscape.value).toBe(true)
    })
  })

  describe('usePerformanceOptimization', () => {
    it('should provide debounce utility', () => {
      const { debounce } = usePerformanceOptimization()
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(mockFn).not.toHaveBeenCalled()
      
      // Fast forward time
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should provide throttle utility', () => {
      const { throttle } = usePerformanceOptimization()
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should create lazy loader', () => {
      const { createLazyLoader } = usePerformanceOptimization()
      const loader = createLazyLoader()
      
      expect(loader).toHaveProperty('observe')
      expect(loader).toHaveProperty('unobserve')
      expect(loader).toHaveProperty('disconnect')
    })

    it('should create virtual scroller', () => {
      const { createVirtualScroller } = usePerformanceOptimization()
      const scroller = createVirtualScroller({
        itemHeight: 50,
        containerHeight: 300
      })
      
      expect(scroller).toHaveProperty('visibleRange')
      expect(scroller).toHaveProperty('visibleItems')
      expect(scroller).toHaveProperty('totalHeight')
    })
  })

  describe('useTouchOptimization', () => {
    it('should detect touch capabilities', () => {
      const { supportsTouch, supportsHaptic } = useTouchOptimization()
      
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', { value: {} })
      expect(supportsTouch.value).toBe(true)
      
      expect(supportsHaptic.value).toBe(true) // navigator.vibrate is mocked
    })

    it('should optimize touch targets', () => {
      const { optimizeTouchTarget } = useTouchOptimization()
      const element = document.createElement('button')
      
      const target = optimizeTouchTarget(element)
      
      expect(target.minSize).toBe(40) // Small screen
      expect(element.style.minWidth).toBe('40px')
      expect(element.style.minHeight).toBe('40px')
      expect(element.style.cursor).toBe('pointer')
    })

    it('should provide haptic feedback', () => {
      const { hapticFeedback } = useTouchOptimization()
      
      hapticFeedback('medium')
      expect(navigator.vibrate).toHaveBeenCalledWith([20])
    })
  })

  describe('SafeArea Component', () => {
    it('should render with correct classes', () => {
      const wrapper = mount(SafeArea, {
        props: { showTabBar: true }
      })
      
      expect(wrapper.classes()).toContain('safe-area')
      expect(wrapper.classes()).toContain('with-tab-bar')
      expect(wrapper.classes()).toContain('is-small-screen')
    })

    it('should adapt to landscape mode', async () => {
      // Mock landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 })
      Object.defineProperty(window, 'innerHeight', { value: 375 })
      
      const wrapper = mount(SafeArea)
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.classes()).toContain('is-landscape')
    })
  })

  describe('VirtualScroller Component', () => {
    const mockItems = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))

    it('should render virtual scroller', () => {
      const wrapper = mount(VirtualScroller, {
        props: {
          items: mockItems,
          itemHeight: 50,
          containerHeight: 300
        }
      })
      
      expect(wrapper.find('.virtual-scroller').exists()).toBe(true)
      expect(wrapper.find('.virtual-scroller-content').exists()).toBe(true)
    })

    it('should calculate visible range correctly', () => {
      const wrapper = mount(VirtualScroller, {
        props: {
          items: mockItems,
          itemHeight: 50,
          containerHeight: 300
        }
      })
      
      const visibleRange = wrapper.vm.getVisibleRange()
      expect(visibleRange.start).toBe(0)
      expect(visibleRange.end).toBeGreaterThan(0)
    })
  })

  describe('LazyImage Component', () => {
    it('should render lazy image with placeholder', () => {
      const wrapper = mount(LazyImage, {
        props: {
          src: 'test-image.jpg',
          alt: 'Test image'
        }
      })
      
      expect(wrapper.find('.lazy-image').exists()).toBe(true)
      expect(wrapper.find('.lazy-image-placeholder').exists()).toBe(true)
    })

    it('should handle loading states', async () => {
      const wrapper = mount(LazyImage, {
        props: {
          src: 'test-image.jpg',
          nativeLoading: true
        }
      })
      
      expect(wrapper.classes()).toContain('is-loading')
      
      // Simulate image load
      const img = wrapper.find('img')
      await img.trigger('load')
      
      expect(wrapper.classes()).toContain('is-loaded')
    })
  })

  describe('ResponsiveContainer Component', () => {
    it('should render with responsive classes', () => {
      const wrapper = mount(ResponsiveContainer, {
        props: {
          maxWidth: '428px',
          centerContent: true
        }
      })
      
      expect(wrapper.find('.responsive-container').exists()).toBe(true)
      expect(wrapper.classes()).toContain('responsive-container--centered')
      expect(wrapper.classes()).toContain('responsive-container--mobile')
      expect(wrapper.classes()).toContain('responsive-container--sm')
    })

    it('should provide device info to slot', () => {
      const wrapper = mount(ResponsiveContainer, {
        slots: {
          default: `
            <template #default="{ deviceInfo, isMobile }">
              <div class="test-content" :class="{ mobile: isMobile }">
                Screen: {{ deviceInfo.screenWidth }}x{{ deviceInfo.screenHeight }}
              </div>
            </template>
          `
        }
      })
      
      const content = wrapper.find('.test-content')
      expect(content.exists()).toBe(true)
      expect(content.classes()).toContain('mobile')
    })
  })
})

describe('Mobile Performance', () => {
  it('should handle large lists efficiently with virtual scrolling', () => {
    const largeItems = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    
    const wrapper = mount(VirtualScroller, {
      props: {
        items: largeItems,
        itemHeight: 50,
        containerHeight: 300
      }
    })
    
    // Should only render visible items, not all 10000
    const renderedItems = wrapper.findAll('.virtual-scroller-item')
    expect(renderedItems.length).toBeLessThan(20) // Much less than total items
  })

  it('should optimize touch targets for accessibility', () => {
    const { optimizeTouchTarget, validateTouchTargets } = useTouchOptimization()
    
    // Create small touch target
    const smallButton = document.createElement('button')
    smallButton.style.width = '20px'
    smallButton.style.height = '20px'
    document.body.appendChild(smallButton)
    
    // Optimize it
    optimizeTouchTarget(smallButton)
    
    // Validate
    const issues = validateTouchTargets()
    expect(issues.length).toBe(0) // Should have no issues after optimization
    
    document.body.removeChild(smallButton)
  })
})