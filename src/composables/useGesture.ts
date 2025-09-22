import { onMounted, onUnmounted, ref, readonly } from 'vue'
import { useRouter } from 'vue-router'

export interface GestureOptions {
  enableSwipeBack?: boolean
  swipeThreshold?: number
  edgeThreshold?: number
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  startX: number
  startY: number
  endX: number
  endY: number
}

export function useGesture(options: GestureOptions = {}) {
  const router = useRouter()
  
  const {
    enableSwipeBack = true,
    swipeThreshold = 50,
    edgeThreshold = 20
  } = options

  // Touch tracking state
  const isTracking = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const startTime = ref(0)
  const currentX = ref(0)
  const currentY = ref(0)

  // Swipe callbacks
  const swipeCallbacks = ref<((event: SwipeEvent) => void)[]>([])

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    startX.value = touch.clientX
    startY.value = touch.clientY
    currentX.value = touch.clientX
    currentY.value = touch.clientY
    startTime.value = Date.now()
    isTracking.value = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isTracking.value) return
    
    const touch = e.touches[0]
    currentX.value = touch.clientX
    currentY.value = touch.clientY
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isTracking.value) return
    
    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()
    
    const deltaX = endX - startX.value
    const deltaY = endY - startY.value
    const deltaTime = endTime - startTime.value
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / deltaTime

    // Determine swipe direction
    let direction: SwipeEvent['direction']
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    // Create swipe event
    const swipeEvent: SwipeEvent = {
      direction,
      distance,
      velocity,
      startX: startX.value,
      startY: startY.value,
      endX,
      endY
    }

    // Handle swipe back gesture
    if (enableSwipeBack && 
        direction === 'right' && 
        startX.value < edgeThreshold && 
        Math.abs(deltaX) > swipeThreshold &&
        Math.abs(deltaX) > Math.abs(deltaY)) {
      
      // Check if we can go back
      if (router.options.history.state.position > 0) {
        router.back()
      }
    }

    // Trigger swipe callbacks
    swipeCallbacks.value.forEach(callback => callback(swipeEvent))

    // Reset tracking state
    isTracking.value = false
  }

  const handleTouchCancel = () => {
    isTracking.value = false
  }

  // Register swipe callback
  const onSwipe = (callback: (event: SwipeEvent) => void) => {
    swipeCallbacks.value.push(callback)
    
    // Return unregister function
    return () => {
      const index = swipeCallbacks.value.indexOf(callback)
      if (index > -1) {
        swipeCallbacks.value.splice(index, 1)
      }
    }
  }

  // Setup event listeners
  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchCancel)
  })

  return {
    isTracking: readonly(isTracking),
    onSwipe
  }
}