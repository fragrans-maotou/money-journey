import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIOSGestures, useIOSTouchFeedback, useIOSAnimations } from '../composables/useIOSGestures'

// Mock router
const mockRouter = {
  back: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

// Mock DOM methods
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn((cb) => setTimeout(cb, 16))
})

describe('useIOSGestures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSwipeBack', () => {
    it('should trigger router.back() on valid swipe gesture', () => {
      const { useSwipeBack } = useIOSGestures()
      useSwipeBack({ enabled: true })

      // Simulate touch start from left edge
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 10, clientY: 100 } as Touch]
      })
      document.dispatchEvent(touchStartEvent)

      // Simulate touch end with right swipe
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 80, clientY: 105 } as Touch]
      })
      document.dispatchEvent(touchEndEvent)

      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('should not trigger router.back() when disabled', () => {
      const { useSwipeBack } = useIOSGestures()
      useSwipeBack({ enabled: false })

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 10, clientY: 100 } as Touch]
      })
      document.dispatchEvent(touchStartEvent)

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 80, clientY: 105 } as Touch]
      })
      document.dispatchEvent(touchEndEvent)

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('should not trigger router.back() for insufficient swipe distance', () => {
      const { useSwipeBack } = useIOSGestures()
      useSwipeBack({ threshold: 100 })

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 10, clientY: 100 } as Touch]
      })
      document.dispatchEvent(touchStartEvent)

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 40, clientY: 105 } as Touch]
      })
      document.dispatchEvent(touchEndEvent)

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('should not trigger router.back() when not starting from edge', () => {
      const { useSwipeBack } = useIOSGestures()
      useSwipeBack({ edgeThreshold: 20 })

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 50, clientY: 100 } as Touch]
      })
      document.dispatchEvent(touchStartEvent)

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 120, clientY: 105 } as Touch]
      })
      document.dispatchEvent(touchEndEvent)

      expect(mockRouter.back).not.toHaveBeenCalled()
    })
  })
})

describe('useIOSTouchFeedback', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockElement.style.transform = ''
    mockElement.style.transition = ''
    vi.clearAllMocks()
  })

  it('should apply pressed style on touch start', () => {
    const { createTouchFeedback } = useIOSTouchFeedback()
    const cleanup = createTouchFeedback(mockElement, { scale: 0.9 })

    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 50, clientY: 50 } as Touch]
    })

    // Simulate delayed press effect
    mockElement.dispatchEvent(touchStartEvent)
    
    // Wait for timeout
    setTimeout(() => {
      expect(mockElement.style.transform).toBe('scale(0.9)')
    }, 60)

    cleanup()
  })

  it('should remove pressed style on touch end', () => {
    const { createTouchFeedback } = useIOSTouchFeedback()
    const cleanup = createTouchFeedback(mockElement)

    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 50, clientY: 50 } as Touch]
    })

    mockElement.dispatchEvent(touchEndEvent)
    expect(mockElement.style.transform).toBe('')

    cleanup()
  })

  it('should remove pressed style on touch cancel', () => {
    const { createTouchFeedback } = useIOSTouchFeedback()
    const cleanup = createTouchFeedback(mockElement)

    const touchCancelEvent = new TouchEvent('touchcancel')
    mockElement.dispatchEvent(touchCancelEvent)
    expect(mockElement.style.transform).toBe('')

    cleanup()
  })
})

describe('useIOSAnimations', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockElement.style.opacity = '1'
    mockElement.style.transform = ''
    vi.clearAllMocks()
  })

  it('should perform spring animation', async () => {
    const { springAnimation } = useIOSAnimations()
    
    const promise = springAnimation(
      mockElement,
      { opacity: '0' },
      { opacity: '1' },
      100
    )

    expect(mockElement.style.opacity).toBe('0')
    
    await promise
    expect(mockElement.style.opacity).toBe('1')
  })

  it('should perform fade in animation', async () => {
    const { fadeIn } = useIOSAnimations()
    
    await fadeIn(mockElement, 100)
    expect(mockElement.style.opacity).toBe('1')
  })

  it('should perform fade out animation', async () => {
    const { fadeOut } = useIOSAnimations()
    
    await fadeOut(mockElement, 100)
    expect(mockElement.style.opacity).toBe('0')
  })

  it('should perform slide in animation', async () => {
    const { slideIn } = useIOSAnimations()
    
    await slideIn(mockElement, 'up', 100)
    expect(mockElement.style.transform).toBe('translate(0)')
    expect(mockElement.style.opacity).toBe('1')
  })

  it('should perform slide out animation', async () => {
    const { slideOut } = useIOSAnimations()
    
    await slideOut(mockElement, 'down', 100)
    expect(mockElement.style.transform).toBe('translateY(100%)')
    expect(mockElement.style.opacity).toBe('0')
  })

  it('should perform scale in animation', async () => {
    const { scaleIn } = useIOSAnimations()
    
    await scaleIn(mockElement, 100)
    expect(mockElement.style.transform).toBe('scale(1)')
    expect(mockElement.style.opacity).toBe('1')
  })

  it('should perform scale out animation', async () => {
    const { scaleOut } = useIOSAnimations()
    
    await scaleOut(mockElement, 100)
    expect(mockElement.style.transform).toBe('scale(0.8)')
    expect(mockElement.style.opacity).toBe('0')
  })
})