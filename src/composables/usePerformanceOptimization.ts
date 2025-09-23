import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  loadTime: number
  renderTime: number
  isLowPerformance: boolean
}

export interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
  once?: boolean
}

export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  buffer?: number
  overscan?: number
}

export function usePerformanceOptimization() {
  // Performance metrics
  const fps = ref(60)
  const memoryUsage = ref(0)
  const loadTime = ref(0)
  const renderTime = ref(0)
  const isLowPerformance = computed(() => fps.value < 30 || memoryUsage.value > 50)

  // Performance monitoring
  let frameCount = 0
  let lastTime = performance.now()
  let animationFrameId: number | null = null

  const measureFPS = () => {
    const currentTime = performance.now()
    frameCount++

    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }

    animationFrameId = requestAnimationFrame(measureFPS)
  }

  const measureMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    }
  }

  // Debounce utility
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Throttle utility
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Lazy loading implementation
  const createLazyLoader = (options: LazyLoadOptions = {}) => {
    const {
      rootMargin = '50px',
      threshold = 0.1,
      once = true
    } = options

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const src = element.dataset.src
          const srcset = element.dataset.srcset

          if (src && element instanceof HTMLImageElement) {
            element.src = src
            element.removeAttribute('data-src')
          }

          if (srcset && element instanceof HTMLImageElement) {
            element.srcset = srcset
            element.removeAttribute('data-srcset')
          }

          // Trigger custom load event
          element.dispatchEvent(new CustomEvent('lazy-loaded'))

          if (once) {
            observer.unobserve(element)
          }
        }
      })
    }, {
      rootMargin,
      threshold
    })

    const observe = (element: HTMLElement) => {
      observer.observe(element)
    }

    const unobserve = (element: HTMLElement) => {
      observer.unobserve(element)
    }

    const disconnect = () => {
      observer.disconnect()
    }

    return { observe, unobserve, disconnect }
  }

  // Virtual scrolling implementation
  const createVirtualScroller = (options: VirtualScrollOptions) => {
    const {
      itemHeight,
      containerHeight,
      buffer = 5,
      overscan = 3
    } = options

    const scrollTop = ref(0)
    const totalItems = ref(0)

    const visibleRange = computed(() => {
      const start = Math.floor(scrollTop.value / itemHeight)
      const end = Math.min(
        start + Math.ceil(containerHeight / itemHeight),
        totalItems.value
      )

      return {
        start: Math.max(0, start - buffer),
        end: Math.min(totalItems.value, end + buffer + overscan)
      }
    })

    const visibleItems = computed(() => {
      const items = []
      for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
        items.push({
          index: i,
          top: i * itemHeight,
          height: itemHeight
        })
      }
      return items
    })

    const totalHeight = computed(() => totalItems.value * itemHeight)

    const handleScroll = throttle((event: Event) => {
      const target = event.target as HTMLElement
      scrollTop.value = target.scrollTop
    }, 16) // ~60fps

    const setTotalItems = (count: number) => {
      totalItems.value = count
    }

    return {
      visibleRange,
      visibleItems,
      totalHeight,
      handleScroll,
      setTotalItems,
      scrollTop
    }
  }

  // Image optimization
  const optimizeImage = (
    src: string,
    width: number,
    height: number,
    quality = 80
  ) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    return new Promise<string>((resolve, reject) => {
      img.onload = () => {
        canvas.width = width
        canvas.height = height

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const optimizedSrc = canvas.toDataURL('image/jpeg', quality / 100)
          resolve(optimizedSrc)
        } else {
          reject(new Error('Canvas context not available'))
        }
      }

      img.onerror = reject
      img.src = src
    })
  }

  // Preload critical resources
  const preloadResource = (href: string, as: string = 'fetch') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }

  // Bundle splitting helper
  const loadChunk = async (chunkName: string) => {
    try {
      const startTime = performance.now()
      // Use @vite-ignore to suppress the warning for dynamic imports
      const module = await import(/* @vite-ignore */ `../chunks/${chunkName}.js`)
      const endTime = performance.now()
      console.log(`Chunk ${chunkName} loaded in ${endTime - startTime}ms`)
      
      return module
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error)
      throw error
    }
  }

  // Performance monitoring
  const startPerformanceMonitoring = () => {
    measureFPS()
    
    // Measure memory usage every 5 seconds
    const memoryInterval = setInterval(measureMemoryUsage, 5000)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      clearInterval(memoryInterval)
    }
  }

  // Measure render time
  const measureRenderTime = async (renderFn: () => Promise<void> | void) => {
    const startTime = performance.now()
    await renderFn()
    await nextTick()
    const endTime = performance.now()
    renderTime.value = endTime - startTime
    return renderTime.value
  }

  // Performance metrics
  const performanceMetrics = computed<PerformanceMetrics>(() => ({
    fps: fps.value,
    memoryUsage: memoryUsage.value,
    loadTime: loadTime.value,
    renderTime: renderTime.value,
    isLowPerformance: isLowPerformance.value
  }))

  // Cleanup
  onMounted(() => {
    loadTime.value = performance.now()
  })

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  })

  return {
    // Performance metrics
    performanceMetrics,
    fps,
    memoryUsage,
    isLowPerformance,
    
    // Utilities
    debounce,
    throttle,
    
    // Lazy loading
    createLazyLoader,
    
    // Virtual scrolling
    createVirtualScroller,
    
    // Image optimization
    optimizeImage,
    
    // Resource management
    preloadResource,
    loadChunk,
    
    // Performance monitoring
    startPerformanceMonitoring,
    measureRenderTime
  }
}