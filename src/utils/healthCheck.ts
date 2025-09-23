/**
 * Application Health Check Utility
 * 
 * Provides comprehensive health monitoring and diagnostics for the application
 */

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
  timestamp: Date
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error'
  checks: {
    storage: HealthCheckResult
    performance: HealthCheckResult
    memory: HealthCheckResult
    connectivity: HealthCheckResult
    features: HealthCheckResult
  }
  recommendations: string[]
}

class HealthChecker {
  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const checks = {
      storage: await this.checkStorage(),
      performance: await this.checkPerformance(),
      memory: await this.checkMemory(),
      connectivity: await this.checkConnectivity(),
      features: await this.checkFeatures()
    }

    const overall = this.determineOverallHealth(checks)
    const recommendations = this.generateRecommendations(checks)

    return {
      overall,
      checks,
      recommendations
    }
  }

  /**
   * Check localStorage availability and quota
   */
  private async checkStorage(): Promise<HealthCheckResult> {
    try {
      // Test localStorage availability
      const testKey = '__health_check_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)

      // Check storage quota if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usedMB = (estimate.usage || 0) / (1024 * 1024)
        const quotaMB = (estimate.quota || 0) / (1024 * 1024)
        const usagePercent = (usedMB / quotaMB) * 100

        if (usagePercent > 90) {
          return {
            status: 'error',
            message: 'Storage quota nearly exceeded',
            details: { usedMB, quotaMB, usagePercent },
            timestamp: new Date()
          }
        } else if (usagePercent > 70) {
          return {
            status: 'warning',
            message: 'Storage usage is high',
            details: { usedMB, quotaMB, usagePercent },
            timestamp: new Date()
          }
        }

        return {
          status: 'healthy',
          message: 'Storage is available and healthy',
          details: { usedMB, quotaMB, usagePercent },
          timestamp: new Date()
        }
      }

      return {
        status: 'healthy',
        message: 'localStorage is available',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Storage is not available',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Check application performance metrics
   */
  private async checkPerformance(): Promise<HealthCheckResult> {
    try {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
          
          if (loadTime > 5000) {
            return {
              status: 'error',
              message: 'Application load time is too slow',
              details: { loadTime, domContentLoaded },
              timestamp: new Date()
            }
          } else if (loadTime > 3000) {
            return {
              status: 'warning',
              message: 'Application load time is slow',
              details: { loadTime, domContentLoaded },
              timestamp: new Date()
            }
          }

          return {
            status: 'healthy',
            message: 'Application performance is good',
            details: { loadTime, domContentLoaded },
            timestamp: new Date()
          }
        }
      }

      return {
        status: 'healthy',
        message: 'Performance monitoring not available',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'Unable to check performance',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / (1024 * 1024)
        const totalMB = memory.totalJSHeapSize / (1024 * 1024)
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024)
        
        const usagePercent = (usedMB / limitMB) * 100

        if (usagePercent > 90) {
          return {
            status: 'error',
            message: 'Memory usage is critically high',
            details: { usedMB, totalMB, limitMB, usagePercent },
            timestamp: new Date()
          }
        } else if (usagePercent > 70) {
          return {
            status: 'warning',
            message: 'Memory usage is high',
            details: { usedMB, totalMB, limitMB, usagePercent },
            timestamp: new Date()
          }
        }

        return {
          status: 'healthy',
          message: 'Memory usage is normal',
          details: { usedMB, totalMB, limitMB, usagePercent },
          timestamp: new Date()
        }
      }

      return {
        status: 'healthy',
        message: 'Memory monitoring not available',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'Unable to check memory usage',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Check network connectivity
   */
  private async checkConnectivity(): Promise<HealthCheckResult> {
    try {
      if ('navigator' in window && 'onLine' in navigator) {
        if (!navigator.onLine) {
          return {
            status: 'warning',
            message: 'Application is offline',
            details: { online: false },
            timestamp: new Date()
          }
        }

        // Check connection quality if available
        if ('connection' in navigator) {
          const connection = (navigator as any).connection
          const effectiveType = connection.effectiveType
          
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            return {
              status: 'warning',
              message: 'Slow network connection detected',
              details: { effectiveType, downlink: connection.downlink },
              timestamp: new Date()
            }
          }

          return {
            status: 'healthy',
            message: 'Network connection is good',
            details: { effectiveType, downlink: connection.downlink },
            timestamp: new Date()
          }
        }

        return {
          status: 'healthy',
          message: 'Application is online',
          details: { online: true },
          timestamp: new Date()
        }
      }

      return {
        status: 'healthy',
        message: 'Connectivity monitoring not available',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'Unable to check connectivity',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Check critical application features
   */
  private async checkFeatures(): Promise<HealthCheckResult> {
    const issues: string[] = []
    const features: Record<string, boolean> = {}

    try {
      // Check localStorage
      features.localStorage = 'localStorage' in window
      if (!features.localStorage) {
        issues.push('localStorage not available')
      }

      // Check modern JavaScript features
      features.es6 = typeof Symbol !== 'undefined'
      if (!features.es6) {
        issues.push('ES6 features not supported')
      }

      // Check CSS features
      features.cssGrid = CSS.supports('display', 'grid')
      features.cssFlexbox = CSS.supports('display', 'flex')
      if (!features.cssGrid || !features.cssFlexbox) {
        issues.push('Modern CSS features not supported')
      }

      // Check touch support
      features.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Check viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]')
      features.viewport = !!viewportMeta
      if (!features.viewport) {
        issues.push('Viewport meta tag missing')
      }

      // Check service worker support
      features.serviceWorker = 'serviceWorker' in navigator
      
      if (issues.length > 3) {
        return {
          status: 'error',
          message: 'Multiple critical features are missing',
          details: { features, issues },
          timestamp: new Date()
        }
      } else if (issues.length > 0) {
        return {
          status: 'warning',
          message: 'Some features are not available',
          details: { features, issues },
          timestamp: new Date()
        }
      }

      return {
        status: 'healthy',
        message: 'All critical features are available',
        details: { features },
        timestamp: new Date()
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Unable to check application features',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(checks: SystemHealth['checks']): 'healthy' | 'warning' | 'error' {
    const statuses = Object.values(checks).map(check => check.status)
    
    if (statuses.includes('error')) {
      return 'error'
    } else if (statuses.includes('warning')) {
      return 'warning'
    }
    
    return 'healthy'
  }

  /**
   * Generate recommendations based on health check results
   */
  private generateRecommendations(checks: SystemHealth['checks']): string[] {
    const recommendations: string[] = []

    if (checks.storage.status === 'error') {
      recommendations.push('Clear browser data or use a different browser')
    } else if (checks.storage.status === 'warning') {
      recommendations.push('Consider clearing old data to free up storage space')
    }

    if (checks.performance.status === 'error') {
      recommendations.push('Close other browser tabs and applications to improve performance')
    } else if (checks.performance.status === 'warning') {
      recommendations.push('Consider refreshing the page or restarting the browser')
    }

    if (checks.memory.status === 'error') {
      recommendations.push('Restart the browser to free up memory')
    } else if (checks.memory.status === 'warning') {
      recommendations.push('Close unnecessary browser tabs')
    }

    if (checks.connectivity.status === 'warning') {
      recommendations.push('Check your internet connection for better experience')
    }

    if (checks.features.status === 'error') {
      recommendations.push('Update your browser to the latest version')
    } else if (checks.features.status === 'warning') {
      recommendations.push('Some features may not work optimally in this browser')
    }

    if (recommendations.length === 0) {
      recommendations.push('System is running optimally')
    }

    return recommendations
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker()

// Export utility functions
export const performHealthCheck = () => healthChecker.performHealthCheck()
export const getSystemInfo = () => healthChecker.getSystemInfo()