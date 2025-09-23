import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDeviceAdaptation } from './useDeviceAdaptation'

export interface TouchFeedbackOptions {
  haptic?: boolean
  visual?: boolean
  audio?: boolean
  duration?: number
  intensity?: 'light' | 'medium' | 'heavy'
}

export interface TouchTarget {
  element: HTMLElement
  minSize: number
  padding: number
  margin: number
}

export function useTouchOptimization() {
  const { touchAreaConfig, supportsFeature } = useDeviceAdaptation()
  
  // Touch state tracking
  const activeTouches = ref<Map<number, Touch>>(new Map())
  const touchTargets = ref<Set<HTMLElement>>(new Set())

  // Touch feedback capabilities
  const supportsHaptic = computed(() => 'vibrate' in navigator)
  const supportsTouch = computed(() => supportsFeature('touch'))
  const supportsHover = computed(() => supportsFeature('hover'))

  // Provide haptic feedback
  const hapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!supportsHaptic.value) return

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }

    navigator.vibrate(patterns[intensity])
  }

  // Provide visual feedback
  const visualFeedback = (element: HTMLElement, options: TouchFeedbackOptions = {}) => {
    const { duration = 150 } = options
    
    element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`
    element.style.transform = 'scale(0.95)'
    element.style.opacity = '0.8'

    setTimeout(() => {
      element.style.transform = ''
      element.style.opacity = ''
    }, duration)
  }

  // Optimize touch target size
  const optimizeTouchTarget = (element: HTMLElement): TouchTarget => {
    const config = touchAreaConfig.value
    const rect = element.getBoundingClientRect()
    
    // Ensure minimum touch target size (44px recommended by Apple)
    if (rect.width < config.minSize || rect.height < config.minSize) {
      element.style.minWidth = `${config.minSize}px`
      element.style.minHeight = `${config.minSize}px`
    }

    // Add appropriate padding for better touch experience
    const currentPadding = parseInt(getComputedStyle(element).padding) || 0
    if (currentPadding < config.padding) {
      element.style.padding = `${config.padding}px`
    }

    // Ensure adequate spacing between touch targets
    element.style.margin = `${config.margin}px`

    // Add touch-friendly cursor
    element.style.cursor = 'pointer'

    // Prevent text selection
    element.style.userSelect = 'none'
    element.style.webkitUserSelect = 'none'

    // Prevent tap highlight
    element.style.webkitTapHighlightColor = 'transparent'

    touchTargets.value.add(element)

    return {
      element,
      minSize: config.minSize,
      padding: config.padding,
      margin: config.margin
    }
  }

  // Enhanced touch event handling
  const addTouchHandlers = (
    element: HTMLElement,
    handlers: {
      onTouchStart?: (event: TouchEvent) => void
      onTouchMove?: (event: TouchEvent) => void
      onTouchEnd?: (event: TouchEvent) => void
      onTouchCancel?: (event: TouchEvent) => void
    },
    options: TouchFeedbackOptions = {}
  ) => {
    const { haptic = true, visual = true, duration = 150 } = options

    const handleTouchStart = (event: TouchEvent) => {
      // Provide immediate feedback
      if (haptic) hapticFeedback('light')
      if (visual) visualFeedback(element, { duration })

      // Track active touches
      Array.from(event.touches).forEach(touch => {
        activeTouches.value.set(touch.identifier, touch)
      })

      handlers.onTouchStart?.(event)
    }

    const handleTouchMove = (event: TouchEvent) => {
      // Update touch tracking
      Array.from(event.touches).forEach(touch => {
        activeTouches.value.set(touch.identifier, touch)
      })

      handlers.onTouchMove?.(event)
    }

    const handleTouchEnd = (event: TouchEvent) => {
      // Remove ended touches
      Array.from(event.changedTouches).forEach(touch => {
        activeTouches.value.delete(touch.identifier)
      })

      handlers.onTouchEnd?.(event)
    }

    const handleTouchCancel = (event: TouchEvent) => {
      // Remove cancelled touches
      Array.from(event.changedTouches).forEach(touch => {
        activeTouches.value.delete(touch.identifier)
      })

      handlers.onTouchCancel?.(event)
    }

    // Add event listeners with passive option for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      touchTargets.value.delete(element)
    }
  }

  // Prevent zoom on double tap
  const preventZoom = (element: HTMLElement) => {
    let lastTouchEnd = 0
    
    const handleTouchEnd = (event: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // Improve scroll performance
  const optimizeScrolling = (element: HTMLElement) => {
    // Enable momentum scrolling on iOS
    element.style.webkitOverflowScrolling = 'touch'
    element.style.overflowScrolling = 'touch'

    // Improve scroll performance
    element.style.willChange = 'scroll-position'
    element.style.transform = 'translateZ(0)' // Force hardware acceleration

    return () => {
      element.style.webkitOverflowScrolling = ''
      element.style.overflowScrolling = ''
      element.style.willChange = ''
      element.style.transform = ''
    }
  }

  // Create touch-friendly button
  const createTouchButton = (
    element: HTMLElement,
    onClick: (event: Event) => void,
    options: TouchFeedbackOptions = {}
  ) => {
    // Optimize touch target
    optimizeTouchTarget(element)

    // Add touch handlers
    const removeTouchHandlers = addTouchHandlers(element, {
      onTouchEnd: (event) => {
        // Prevent click event from firing
        event.preventDefault()
        onClick(event)
      }
    }, options)

    // Add click handler for mouse/keyboard users
    const handleClick = (event: Event) => {
      if (!supportsTouch.value) {
        onClick(event)
      }
    }

    element.addEventListener('click', handleClick)

    // Add keyboard support
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick(event)
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    // Make focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0')
    }

    // Add ARIA role if not present
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'button')
    }

    return () => {
      removeTouchHandlers()
      element.removeEventListener('click', handleClick)
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Validate touch targets accessibility
  const validateTouchTargets = () => {
    const issues: string[] = []

    touchTargets.value.forEach(element => {
      const rect = element.getBoundingClientRect()
      const config = touchAreaConfig.value

      if (rect.width < config.minSize || rect.height < config.minSize) {
        issues.push(`Touch target too small: ${rect.width}x${rect.height}px (minimum: ${config.minSize}px)`)
      }

      // Check spacing between targets
      const siblings = Array.from(element.parentElement?.children || [])
        .filter(child => child !== element && touchTargets.value.has(child as HTMLElement))

      siblings.forEach(sibling => {
        const siblingRect = (sibling as HTMLElement).getBoundingClientRect()
        const distance = Math.min(
          Math.abs(rect.right - siblingRect.left),
          Math.abs(rect.left - siblingRect.right),
          Math.abs(rect.bottom - siblingRect.top),
          Math.abs(rect.top - siblingRect.bottom)
        )

        if (distance < config.margin) {
          issues.push(`Touch targets too close: ${distance}px spacing (minimum: ${config.margin}px)`)
        }
      })
    })

    return issues
  }

  // Cleanup on unmount
  onUnmounted(() => {
    activeTouches.value.clear()
    touchTargets.value.clear()
  })

  return {
    // State
    activeTouches,
    touchTargets,
    
    // Capabilities
    supportsHaptic,
    supportsTouch,
    supportsHover,
    
    // Feedback
    hapticFeedback,
    visualFeedback,
    
    // Touch optimization
    optimizeTouchTarget,
    addTouchHandlers,
    preventZoom,
    optimizeScrolling,
    createTouchButton,
    
    // Validation
    validateTouchTargets
  }
}