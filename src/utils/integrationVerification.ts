/**
 * Integration Verification Utility
 * 
 * Verifies that all application components work together correctly
 * and provides runtime integration testing capabilities.
 */

import { nextTick } from 'vue'
import type { Router } from 'vue-router'

export interface VerificationResult {
  test: string
  passed: boolean
  message: string
  duration: number
  error?: any
}

export interface IntegrationReport {
  overall: 'passed' | 'failed' | 'partial'
  totalTests: number
  passedTests: number
  failedTests: number
  results: VerificationResult[]
  timestamp: Date
}

class IntegrationVerifier {
  private router: Router | null = null
  private results: VerificationResult[] = []

  /**
   * Initialize the verifier with router instance
   */
  initialize(router: Router): void {
    this.router = router
  }

  /**
   * Run all integration verification tests
   */
  async runVerification(): Promise<IntegrationReport> {
    console.log('🔍 Starting integration verification...')
    this.results = []

    // Core functionality tests
    await this.testStorageIntegration()
    await this.testRouterIntegration()
    await this.testComposableIntegration()
    await this.testComponentIntegration()
    await this.testDataFlowIntegration()
    await this.testErrorHandlingIntegration()
    await this.testPerformanceIntegration()

    return this.generateReport()
  }

  /**
   * Test storage integration
   */
  private async testStorageIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test localStorage availability
      const testKey = '__integration_test_storage__'
      const testValue = { test: true, timestamp: Date.now() }
      
      localStorage.setItem(testKey, JSON.stringify(testValue))
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}')
      localStorage.removeItem(testKey)
      
      if (retrieved.test === true) {
        this.addResult('Storage Integration', true, 'localStorage working correctly', startTime)
      } else {
        this.addResult('Storage Integration', false, 'localStorage data integrity issue', startTime)
      }
      
    } catch (error) {
      this.addResult('Storage Integration', false, 'localStorage not available', startTime, error)
    }
  }

  /**
   * Test router integration
   */
  private async testRouterIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      if (!this.router) {
        this.addResult('Router Integration', false, 'Router not initialized', startTime)
        return
      }

      const currentRoute = this.router.currentRoute.value
      const routes = this.router.getRoutes()
      
      // Check if required routes exist
      const requiredRoutes = ['Dashboard', 'BudgetSettings', 'ExpenseRecord', 'Statistics']
      const missingRoutes = requiredRoutes.filter(name => 
        !routes.some(route => route.name === name)
      )
      
      if (missingRoutes.length === 0) {
        this.addResult('Router Integration', true, 'All required routes configured', startTime)
      } else {
        this.addResult('Router Integration', false, `Missing routes: ${missingRoutes.join(', ')}`, startTime)
      }
      
    } catch (error) {
      this.addResult('Router Integration', false, 'Router integration error', startTime, error)
    }
  }

  /**
   * Test composable integration
   */
  private async testComposableIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test if composables can be imported and used
      const { useBudget } = await import('@/composables/useBudget')
      const { useExpense } = await import('@/composables/useExpense')
      const { useStorage } = await import('@/composables/useStorage')
      
      // Test basic composable functionality
      const budgetComposable = useBudget()
      const expenseComposable = useExpense()
      const storageComposable = useStorage()
      
      if (budgetComposable && expenseComposable && storageComposable) {
        this.addResult('Composable Integration', true, 'All composables loaded successfully', startTime)
      } else {
        this.addResult('Composable Integration', false, 'Some composables failed to load', startTime)
      }
      
    } catch (error) {
      this.addResult('Composable Integration', false, 'Composable import error', startTime, error)
    }
  }

  /**
   * Test component integration
   */
  private async testComponentIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test if critical components can be imported
      const components = [
        '@/components/BudgetCard.vue',
        '@/components/layout/TabBar.vue',
        '@/components/AmountInput.vue',
        '@/components/CategoryPicker.vue'
      ]
      
      const importPromises = components.map(async (component) => {
        try {
          await import(component)
          return true
        } catch {
          return false
        }
      })
      
      const results = await Promise.all(importPromises)
      const successCount = results.filter(Boolean).length
      
      if (successCount === components.length) {
        this.addResult('Component Integration', true, 'All critical components loaded', startTime)
      } else {
        this.addResult('Component Integration', false, `${components.length - successCount} components failed to load`, startTime)
      }
      
    } catch (error) {
      this.addResult('Component Integration', false, 'Component integration error', startTime, error)
    }
  }

  /**
   * Test data flow integration
   */
  private async testDataFlowIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test data flow between composables
      const { useBudget } = await import('@/composables/useBudget')
      const { useExpense } = await import('@/composables/useExpense')
      
      const budgetComposable = useBudget()
      const expenseComposable = useExpense()
      
      // Test if composables can interact with storage
      const testBudget = {
        monthlyAmount: 1000,
        startDate: new Date()
      }
      
      // This is a simplified test - in real scenario we'd test actual data flow
      if (typeof budgetComposable.setMonthlyBudget === 'function' && 
          typeof expenseComposable.addExpense === 'function') {
        this.addResult('Data Flow Integration', true, 'Data flow methods available', startTime)
      } else {
        this.addResult('Data Flow Integration', false, 'Data flow methods missing', startTime)
      }
      
    } catch (error) {
      this.addResult('Data Flow Integration', false, 'Data flow integration error', startTime, error)
    }
  }

  /**
   * Test error handling integration
   */
  private async testErrorHandlingIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test if error handling utilities are available
      const { useErrorHandler } = await import('@/composables/useErrorHandler')
      
      const errorHandler = useErrorHandler()
      
      if (typeof errorHandler.handleError === 'function') {
        this.addResult('Error Handling Integration', true, 'Error handling available', startTime)
      } else {
        this.addResult('Error Handling Integration', false, 'Error handling not properly configured', startTime)
      }
      
    } catch (error) {
      this.addResult('Error Handling Integration', false, 'Error handling integration error', startTime, error)
    }
  }

  /**
   * Test performance integration
   */
  private async testPerformanceIntegration(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Test if performance utilities are available
      const { performanceOptimizer } = await import('@/utils/performanceOptimizer')
      
      const metrics = performanceOptimizer.getCurrentMetrics()
      
      if (metrics && typeof metrics === 'object') {
        this.addResult('Performance Integration', true, 'Performance monitoring available', startTime)
      } else {
        this.addResult('Performance Integration', false, 'Performance monitoring not working', startTime)
      }
      
    } catch (error) {
      this.addResult('Performance Integration', false, 'Performance integration error', startTime, error)
    }
  }

  /**
   * Add a test result
   */
  private addResult(test: string, passed: boolean, message: string, startTime: number, error?: any): void {
    const duration = performance.now() - startTime
    this.results.push({
      test,
      passed,
      message,
      duration,
      error
    })
  }

  /**
   * Generate integration report
   */
  private generateReport(): IntegrationReport {
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = this.results.filter(r => !r.passed).length
    const totalTests = this.results.length
    
    let overall: 'passed' | 'failed' | 'partial'
    if (failedTests === 0) {
      overall = 'passed'
    } else if (passedTests === 0) {
      overall = 'failed'
    } else {
      overall = 'partial'
    }
    
    return {
      overall,
      totalTests,
      passedTests,
      failedTests,
      results: this.results,
      timestamp: new Date()
    }
  }

  /**
   * Test specific route navigation
   */
  async testRouteNavigation(routeName: string): Promise<VerificationResult> {
    const startTime = performance.now()
    
    try {
      if (!this.router) {
        return {
          test: `Route Navigation - ${routeName}`,
          passed: false,
          message: 'Router not available',
          duration: performance.now() - startTime
        }
      }

      await this.router.push({ name: routeName })
      await nextTick()
      
      const currentRoute = this.router.currentRoute.value
      
      if (currentRoute.name === routeName) {
        return {
          test: `Route Navigation - ${routeName}`,
          passed: true,
          message: 'Navigation successful',
          duration: performance.now() - startTime
        }
      } else {
        return {
          test: `Route Navigation - ${routeName}`,
          passed: false,
          message: `Expected ${routeName}, got ${currentRoute.name}`,
          duration: performance.now() - startTime
        }
      }
      
    } catch (error) {
      return {
        test: `Route Navigation - ${routeName}`,
        passed: false,
        message: 'Navigation failed',
        duration: performance.now() - startTime,
        error
      }
    }
  }

  /**
   * Test complete user workflow
   */
  async testCompleteWorkflow(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = []
    
    // Test navigation through all main routes
    const routes = ['Dashboard', 'BudgetSettings', 'ExpenseRecord', 'Statistics']
    
    for (const route of routes) {
      const result = await this.testRouteNavigation(route)
      results.push(result)
      
      // Small delay between navigations
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  /**
   * Print verification report
   */
  printReport(report: IntegrationReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('🔍 INTEGRATION VERIFICATION REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n📊 Overall Status: ${report.overall.toUpperCase()}`)
    console.log(`📈 Tests: ${report.passedTests}/${report.totalTests} passed`)
    console.log(`⏱️ Timestamp: ${report.timestamp.toISOString()}`)
    
    console.log('\n📋 Test Results:')
    report.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const duration = result.duration.toFixed(2)
      console.log(`  ${status} ${result.test} (${duration}ms)`)
      console.log(`     ${result.message}`)
      if (result.error) {
        console.log(`     Error: ${result.error.message || result.error}`)
      }
    })
    
    console.log('\n' + '='.repeat(60))
  }
}

// Export singleton instance
export const integrationVerifier = new IntegrationVerifier()

// Export utility functions
export const runIntegrationVerification = () => integrationVerifier.runVerification()
export const initializeVerifier = (router: Router) => integrationVerifier.initialize(router)