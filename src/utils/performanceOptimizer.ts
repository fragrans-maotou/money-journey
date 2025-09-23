/**
 * Performance Optimization Utility
 * 
 * Provides runtime performance optimizations and monitoring
 */

export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  bundleSize: number
  cacheHitRate: number
}

export interface OptimizationResult {
  applied: string[]
  skipped: string[]
  metrics: PerformanceMetrics
}

class PerformanceOptimizer {
  private metrics: Partial<PerformanceMetrics> = {}
  private optimizations: Map<string, boolean> = new Map()

  /**
   * Initialize performance monitoring and optimizations
   */
  initialize(): void {
    this.setupPerformanceObserver()
    this.applyOptimizations()
    this.scheduleMetricsCollection()
  }

  /**
   * Apply various performance optimizations
   */
  private applyOptimizations(): OptimizationResult {
    const applied: string[] = []
    const skipped: string[] = []

    // Image lazy loading optimization
    if (this.applyImageLazyLoading()) {
      applied.push('Image lazy loading')
    } else {
      skipped.push('Image lazy loading')
    }

    // Prefetch critical resources
    if (this.prefetchCriticalResources()) {
      applied.push('Resource prefetching')
    } else {
      skipped.push('Resource prefetching')
    }

    // Enable passive event listeners
    if (this.enablePassiveEventListeners()) {
      applied.push('Passive event listeners')
    } else {
      skipped.push('Passive event listeners')
    }

    // Optimize scroll performance
    if (this.optimizeScrollPerformance()) {
      applied.push('Scroll optimization')
    } else {
      skipped.push('Scroll optimization')
    }

    // Memory cleanup optimization
    if (this.enableMemoryCleanup()) {
      applied.push('Memory cleanup')
    } else {
      skipped.push('Memory cleanup')
    }

    return {
      applied,
      skipped,
      metrics: this.getCurrentMetrics()
    }
  }

  /**
   * Setup performance observer for monitoring
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart
              this.metrics.renderTime = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            }
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          this.analyzeResourceTiming(entries)
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          console.log('LCP:', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      } catch (error) {
        console.warn('Performance observer setup failed:', error)
      }
    }
  }

  /**
   * Apply image lazy loading optimization
   */
  private applyImageLazyLoading(): boolean {
    try {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.removeAttribute('data-src')
                imageObserver.unobserve(img)
              }
            }
          })
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        })

        // Observe all images with data-src attribute
        const lazyImages = document.querySelectorAll('img[data-src]')
        lazyImages.forEach((img) => imageObserver.observe(img))

        this.optimizations.set('imageLazyLoading', true)
        return true
      }
      return false
    } catch (error) {
      console.warn('Image lazy loading setup failed:', error)
      return false
    }
  }

  /**
   * Prefetch critical resources
   */
  private prefetchCriticalResources(): boolean {
    try {
      const criticalResources = [
        '/api/budget',
        '/api/expenses',
        '/api/categories'
      ]

      criticalResources.forEach((resource) => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = resource
        document.head.appendChild(link)
      })

      this.optimizations.set('resourcePrefetching', true)
      return true
    } catch (error) {
      console.warn('Resource prefetching failed:', error)
      return false
    }
  }

  /**
   * Enable passive event listeners for better scroll performance
   */
  private enablePassiveEventListeners(): boolean {
    try {
      // Override addEventListener to use passive listeners for scroll/touch events
      const originalAddEventListener = EventTarget.prototype.addEventListener
      
      EventTarget.prototype.addEventListener = function(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel']
        
        if (passiveEvents.includes(type) && typeof options !== 'object') {
          options = { passive: true }
        } else if (typeof options === 'object' && options.passive === undefined) {
          options.passive = passiveEvents.includes(type)
        }
        
        return originalAddEventListener.call(this, type, listener, options)
      }

      this.optimizations.set('passiveEventListeners', true)
      return true
    } catch (error) {
      console.warn('Passive event listeners setup failed:', error)
      return false
    }
  }

  /**
   * Optimize scroll performance
   */
  private optimizeScrollPerformance(): boolean {
    try {
      // Throttle scroll events
      let scrollTimeout: number | null = null
      const originalScrollHandler = window.onscroll

      window.onscroll = (event) => {
        if (scrollTimeout) {
          cancelAnimationFrame(scrollTimeout)
        }
        
        scrollTimeout = requestAnimationFrame(() => {
          if (originalScrollHandler) {
            originalScrollHandler.call(window, event)
          }
        })
      }

      // Enable CSS containment for better rendering performance
      const style = document.createElement('style')
      style.textContent = `
        .page-container {
          contain: layout style paint;
        }
        .list-item {
          contain: layout;
        }
      `
      document.head.appendChild(style)

      this.optimizations.set('scrollOptimization', true)
      return true
    } catch (error) {
      console.warn('Scroll optimization failed:', error)
      return false
    }
  }

  /**
   * Enable automatic memory cleanup
   */
  private enableMemoryCleanup(): boolean {
    try {
      // Clean up unused objects periodically
      setInterval(() => {
        this.performMemoryCleanup()
      }, 60000) // Every minute

      // Clean up on page visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.performMemoryCleanup()
        }
      })

      this.optimizations.set('memoryCleanup', true)
      return true
    } catch (error) {
      console.warn('Memory cleanup setup failed:', error)
      return false
    }
  }

  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup(): void {
    try {
      // Clear performance entries to free memory
      if (performance.clearResourceTimings) {
        performance.clearResourceTimings()
      }

      // Trigger garbage collection if available (Chrome DevTools)
      if ('gc' in window) {
        (window as any).gc()
      }

      // Clear unused image caches
      this.clearUnusedImageCaches()

    } catch (error) {
      console.warn('Memory cleanup failed:', error)
    }
  }

  /**
   * Clear unused image caches
   */
  private clearUnusedImageCaches(): void {
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.offsetParent && !img.style.display) {
        // Image is not visible, clear its cache
        const src = img.src
        img.src = ''
        img.src = src
      }
    })
  }

  /**
   * Analyze resource timing for optimization opportunities
   */
  private analyzeResourceTiming(entries: PerformanceEntry[]): void {
    const resourceMetrics = {
      totalResources: entries.length,
      slowResources: 0,
      cachedResources: 0,
      totalTransferSize: 0
    }

    entries.forEach((entry) => {
      const resourceEntry = entry as PerformanceResourceTiming
      
      // Check for slow resources (>1s)
      if (entry.duration > 1000) {
        resourceMetrics.slowResources++
        console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`)
      }

      // Check for cached resources
      if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize > 0) {
        resourceMetrics.cachedResources++
      }

      resourceMetrics.totalTransferSize += resourceEntry.transferSize || 0
    })

    // Calculate cache hit rate
    this.metrics.cacheHitRate = resourceMetrics.cachedResources / resourceMetrics.totalResources
  }

  /**
   * Schedule periodic metrics collection
   */
  private scheduleMetricsCollection(): void {
    setInterval(() => {
      this.collectCurrentMetrics()
    }, 30000) // Every 30 seconds
  }

  /**
   * Collect current performance metrics
   */
  private collectCurrentMetrics(): void {
    try {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // MB
      }

      // Bundle size estimation
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const jsResources = resources.filter(r => r.name.includes('.js'))
        this.metrics.bundleSize = jsResources.reduce((total, resource) => {
          return total + (resource.transferSize || 0)
        }, 0) / 1024 // KB
      }

    } catch (error) {
      console.warn('Metrics collection failed:', error)
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return {
      loadTime: this.metrics.loadTime || 0,
      renderTime: this.metrics.renderTime || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      bundleSize: this.metrics.bundleSize || 0,
      cacheHitRate: this.metrics.cacheHitRate || 0
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(): Record<string, boolean> {
    return Object.fromEntries(this.optimizations)
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    metrics: PerformanceMetrics
    optimizations: Record<string, boolean>
    recommendations: string[]
  } {
    const metrics = this.getCurrentMetrics()
    const optimizations = this.getOptimizationStatus()
    const recommendations: string[] = []

    // Generate recommendations based on metrics
    if (metrics.loadTime > 3000) {
      recommendations.push('Consider code splitting to reduce initial bundle size')
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Memory usage is high, consider implementing virtual scrolling')
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Improve caching strategy for better performance')
    }

    if (metrics.bundleSize > 500) {
      recommendations.push('Bundle size is large, consider lazy loading non-critical components')
    }

    return {
      metrics,
      optimizations,
      recommendations
    }
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// Auto-initialize on import
if (typeof window !== 'undefined') {
  performanceOptimizer.initialize()
}