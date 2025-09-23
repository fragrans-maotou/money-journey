/**
 * Application Integration Service
 * 
 * Coordinates all application modules and ensures proper integration
 */

import { performanceOptimizer } from '@/utils/performanceOptimizer'
import { healthChecker } from '@/utils/healthCheck'
import type { App } from 'vue'
import type { Router } from 'vue-router'

export interface IntegrationConfig {
  enablePerformanceMonitoring: boolean
  enableHealthChecks: boolean
  enableErrorReporting: boolean
  enableAnalytics: boolean
  debugMode: boolean
}

export interface IntegrationStatus {
  initialized: boolean
  modules: {
    router: boolean
    storage: boolean
    performance: boolean
    errorHandling: boolean
    analytics: boolean
  }
  health: 'healthy' | 'warning' | 'error'
  lastCheck: Date
}

class IntegrationService {
  private app: App | null = null
  private router: Router | null = null
  private config: IntegrationConfig
  private status: IntegrationStatus
  private healthCheckInterval: number | null = null

  constructor() {
    this.config = {
      enablePerformanceMonitoring: true,
      enableHealthChecks: true,
      enableErrorReporting: true,
      enableAnalytics: false, // Disabled for privacy
      debugMode: process.env.NODE_ENV === 'development'
    }

    this.status = {
      initialized: false,
      modules: {
        router: false,
        storage: false,
        performance: false,
        errorHandling: false,
        analytics: false
      },
      health: 'healthy',
      lastCheck: new Date()
    }
  }

  /**
   * Initialize the integration service
   */
  async initialize(app: App, router: Router, config?: Partial<IntegrationConfig>): Promise<void> {
    this.app = app
    this.router = router
    
    if (config) {
      this.config = { ...this.config, ...config }
    }

    try {
      // Initialize core modules
      await this.initializeRouter()
      await this.initializeStorage()
      await this.initializePerformanceMonitoring()
      await this.initializeErrorHandling()
      await this.initializeHealthChecks()

      // Optional modules
      if (this.config.enableAnalytics) {
        await this.initializeAnalytics()
      }

      this.status.initialized = true
      this.log('Integration service initialized successfully')

      // Start periodic health checks
      this.startHealthChecks()

    } catch (error) {
      this.logError('Failed to initialize integration service', error)
      throw error
    }
  }

  /**
   * Initialize router integration
   */
  private async initializeRouter(): Promise<void> {
    if (!this.router) {
      throw new Error('Router not provided')
    }

    try {
      // Add global navigation guards
      this.router.beforeEach((to, from, next) => {
        this.log(`Navigating from ${from.name} to ${to.name}`)
        
        // Performance tracking
        if (this.config.enablePerformanceMonitoring) {
          performance.mark(`navigation-start-${to.name}`)
        }

        next()
      })

      this.router.afterEach((to, from) => {
        // Performance tracking
        if (this.config.enablePerformanceMonitoring) {
          performance.mark(`navigation-end-${to.name}`)
          performance.measure(
            `navigation-${to.name}`,
            `navigation-start-${to.name}`,
            `navigation-end-${to.name}`
          )
        }

        // Update page title
        if (to.meta?.title) {
          document.title = `${to.meta.title} - 月度预算跟踪器`
        }
      })

      // Handle router errors
      this.router.onError((error) => {
        this.logError('Router error', error)
      })

      this.status.modules.router = true
      this.log('Router integration initialized')

    } catch (error) {
      this.logError('Router initialization failed', error)
      throw error
    }
  }

  /**
   * Initialize storage integration
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Test localStorage availability
      const testKey = '__integration_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)

      // Setup storage event listeners
      window.addEventListener('storage', (event) => {
        this.log('Storage changed', { key: event.key, newValue: event.newValue })
      })

      // Setup quota monitoring
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usagePercent = ((estimate.usage || 0) / (estimate.quota || 1)) * 100
        
        if (usagePercent > 80) {
          console.warn('Storage quota usage is high:', usagePercent + '%')
        }
      }

      this.status.modules.storage = true
      this.log('Storage integration initialized')

    } catch (error) {
      this.logError('Storage initialization failed', error)
      throw error
    }
  }

  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) {
      return
    }

    try {
      // Performance optimizer is auto-initialized
      
      // Setup custom performance tracking
      this.setupCustomPerformanceTracking()

      this.status.modules.performance = true
      this.log('Performance monitoring initialized')

    } catch (error) {
      this.logError('Performance monitoring initialization failed', error)
      // Don't throw - performance monitoring is not critical
    }
  }

  /**
   * Setup custom performance tracking
   */
  private setupCustomPerformanceTracking(): void {
    // Track Vue component render times
    if (this.app && this.config.debugMode) {
      this.app.config.performance = true
    }

    // Track user interactions
    const trackInteraction = (eventType: string) => {
      performance.mark(`interaction-${eventType}-${Date.now()}`)
    }

    document.addEventListener('click', () => trackInteraction('click'), { passive: true })
    document.addEventListener('scroll', () => trackInteraction('scroll'), { passive: true })
  }

  /**
   * Initialize error handling
   */
  private async initializeErrorHandling(): Promise<void> {
    if (!this.config.enableErrorReporting) {
      return
    }

    try {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.logError('Global error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        })
      })

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.logError('Unhandled promise rejection', event.reason)
      })

      // Vue error handler
      if (this.app) {
        this.app.config.errorHandler = (error, instance, info) => {
          this.logError('Vue error', { error, info })
        }
      }

      this.status.modules.errorHandling = true
      this.log('Error handling initialized')

    } catch (error) {
      this.logError('Error handling initialization failed', error)
      // Don't throw - error handling should be resilient
    }
  }

  /**
   * Initialize health checks
   */
  private async initializeHealthChecks(): Promise<void> {
    if (!this.config.enableHealthChecks) {
      return
    }

    try {
      // Perform initial health check
      const healthResult = await healthChecker.performHealthCheck()
      this.status.health = healthResult.overall
      this.status.lastCheck = new Date()

      this.log('Health checks initialized', { health: healthResult.overall })

    } catch (error) {
      this.logError('Health checks initialization failed', error)
      // Don't throw - health checks are not critical for app function
    }
  }

  /**
   * Initialize analytics (optional)
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      // Analytics implementation would go here
      // For privacy reasons, this is kept minimal
      
      this.status.modules.analytics = true
      this.log('Analytics initialized')

    } catch (error) {
      this.logError('Analytics initialization failed', error)
      // Don't throw - analytics is optional
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (!this.config.enableHealthChecks) {
      return
    }

    this.healthCheckInterval = window.setInterval(async () => {
      try {
        const healthResult = await healthChecker.performHealthCheck()
        this.status.health = healthResult.overall
        this.status.lastCheck = new Date()

        if (healthResult.overall === 'error') {
          this.logError('Health check failed', healthResult)
        } else if (healthResult.overall === 'warning') {
          console.warn('Health check warning', healthResult)
        }

      } catch (error) {
        this.logError('Health check error', error)
      }
    }, 300000) // Every 5 minutes
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Get integration status
   */
  getStatus(): IntegrationStatus {
    return { ...this.status }
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<any> {
    if (!this.config.enablePerformanceMonitoring) {
      return null
    }

    return performanceOptimizer.generatePerformanceReport()
  }

  /**
   * Get health report
   */
  async getHealthReport(): Promise<any> {
    if (!this.config.enableHealthChecks) {
      return null
    }

    return await healthChecker.performHealthCheck()
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHealthChecks()
    this.log('Integration service cleaned up')
  }

  /**
   * Log message (with debug mode check)
   */
  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[IntegrationService] ${message}`, data || '')
    }
  }

  /**
   * Log error
   */
  private logError(message: string, error: any): void {
    console.error(`[IntegrationService] ${message}`, error)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...config }
    this.log('Configuration updated', this.config)
  }

  /**
   * Restart health checks with new interval
   */
  restartHealthChecks(intervalMs: number = 300000): void {
    this.stopHealthChecks()
    
    if (this.config.enableHealthChecks) {
      this.healthCheckInterval = window.setInterval(async () => {
        try {
          const healthResult = await healthChecker.performHealthCheck()
          this.status.health = healthResult.overall
          this.status.lastCheck = new Date()
        } catch (error) {
          this.logError('Health check error', error)
        }
      }, intervalMs)
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService()

// Export initialization function for main.ts
export const initializeIntegration = (app: App, router: Router, config?: Partial<IntegrationConfig>) => {
  return integrationService.initialize(app, router, config)
}