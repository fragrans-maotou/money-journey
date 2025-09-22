import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * iOS 风格手势处理 Composable
 * 提供滑动返回、触摸反馈等功能
 */
export function useIOSGestures() {
  const router = useRouter()
  
  // 滑动返回功能
  const useSwipeBack = (options: {
    enabled?: boolean
    threshold?: number
    edgeThreshold?: number
  } = {}) => {
    const {
      enabled = true,
      threshold = 50,
      edgeThreshold = 20
    } = options
    
    let startX = 0
    let startY = 0
    let startTime = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      if (!enabled) return
      
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!enabled) return
      
      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const endTime = Date.now()
      
      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = endTime - startTime
      
      // 检查是否从左边缘开始滑动
      const isFromEdge = startX <= edgeThreshold
      // 检查是否向右滑动且距离足够
      const isRightSwipe = deltaX > threshold
      // 检查是否主要是水平滑动
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
      // 检查滑动速度（防止过慢的滑动）
      const isFastEnough = deltaTime < 500
      
      if (isFromEdge && isRightSwipe && isHorizontal && isFastEnough) {
        router.back()
      }
    }
    
    onMounted(() => {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    })
    
    onUnmounted(() => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    })
  }
  
  return {
    useSwipeBack
  }
}

/**
 * 触摸反馈 Composable
 * 提供 iOS 风格的触摸反馈效果
 */
export function useIOSTouchFeedback() {
  const createTouchFeedback = (element: HTMLElement, options: {
    scale?: number
    duration?: number
    haptic?: boolean
  } = {}) => {
    const {
      scale = 0.95,
      duration = 150,
      haptic = false
    } = options
    
    let isPressed = false
    let pressTimer: number | null = null
    
    const applyPressedStyle = () => {
      element.style.transform = `scale(${scale})`
      element.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    }
    
    const removePressedStyle = () => {
      element.style.transform = ''
      element.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    }
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      isPressed = true
      
      // 延迟应用按压效果，避免快速滑动时的误触
      pressTimer = window.setTimeout(() => {
        if (isPressed) {
          applyPressedStyle()
        }
      }, 50)
    }
    
    const handleTouchEnd = () => {
      isPressed = false
      
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
      
      removePressedStyle()
    }
    
    const handleTouchCancel = () => {
      isPressed = false
      
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
      
      removePressedStyle()
    }
    
    // 添加事件监听器
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    
    // 返回清理函数
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      
      if (pressTimer) {
        clearTimeout(pressTimer)
      }
    }
  }
  
  return {
    createTouchFeedback
  }
}

/**
 * iOS 风格动画 Composable
 * 提供常用的 iOS 动画效果
 */
export function useIOSAnimations() {
  // 弹性动画
  const springAnimation = (
    element: HTMLElement,
    from: Partial<CSSStyleDeclaration>,
    to: Partial<CSSStyleDeclaration>,
    duration = 300
  ) => {
    return new Promise<void>((resolve) => {
      // 设置初始状态
      Object.assign(element.style, from)
      
      // 设置动画
      element.style.transition = `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`
      
      // 应用最终状态
      requestAnimationFrame(() => {
        Object.assign(element.style, to)
        
        setTimeout(() => {
          element.style.transition = ''
          resolve()
        }, duration)
      })
    })
  }
  
  // 淡入动画
  const fadeIn = (element: HTMLElement, duration = 250) => {
    return springAnimation(
      element,
      { opacity: '0' },
      { opacity: '1' },
      duration
    )
  }
  
  // 淡出动画
  const fadeOut = (element: HTMLElement, duration = 250) => {
    return springAnimation(
      element,
      { opacity: '1' },
      { opacity: '0' },
      duration
    )
  }
  
  // 滑入动画
  const slideIn = (
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration = 300
  ) => {
    const transforms = {
      up: 'translateY(100%)',
      down: 'translateY(-100%)',
      left: 'translateX(100%)',
      right: 'translateX(-100%)'
    }
    
    return springAnimation(
      element,
      { transform: transforms[direction], opacity: '0' },
      { transform: 'translate(0)', opacity: '1' },
      duration
    )
  }
  
  // 滑出动画
  const slideOut = (
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right' = 'down',
    duration = 300
  ) => {
    const transforms = {
      up: 'translateY(-100%)',
      down: 'translateY(100%)',
      left: 'translateX(-100%)',
      right: 'translateX(100%)'
    }
    
    return springAnimation(
      element,
      { transform: 'translate(0)', opacity: '1' },
      { transform: transforms[direction], opacity: '0' },
      duration
    )
  }
  
  // 缩放动画
  const scaleIn = (element: HTMLElement, duration = 250) => {
    return springAnimation(
      element,
      { transform: 'scale(0.8)', opacity: '0' },
      { transform: 'scale(1)', opacity: '1' },
      duration
    )
  }
  
  const scaleOut = (element: HTMLElement, duration = 250) => {
    return springAnimation(
      element,
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(0.8)', opacity: '0' },
      duration
    )
  }
  
  return {
    springAnimation,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scaleIn,
    scaleOut
  }
}

/**
 * 安全区域适配 Composable
 */
export function useIOSSafeArea() {
  const safeAreaInsets = ref({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })
  
  const updateSafeAreaInsets = () => {
    if (typeof window !== 'undefined' && CSS.supports('padding-top: env(safe-area-inset-top)')) {
      const computedStyle = getComputedStyle(document.documentElement)
      
      safeAreaInsets.value = {
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      }
    }
  }
  
  onMounted(() => {
    updateSafeAreaInsets()
    window.addEventListener('resize', updateSafeAreaInsets)
    window.addEventListener('orientationchange', updateSafeAreaInsets)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateSafeAreaInsets)
    window.removeEventListener('orientationchange', updateSafeAreaInsets)
  })
  
  return {
    safeAreaInsets
  }
}