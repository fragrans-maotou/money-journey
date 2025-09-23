#!/usr/bin/env node

/**
 * Application Validation Script
 * 
 * Performs comprehensive validation of the application to ensure
 * all components are properly integrated and functioning.
 */

const fs = require('fs')
const path = require('path')

class ApplicationValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passed = []
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('🔍 Starting application validation...\n')

    // File structure validation
    this.validateFileStructure()
    
    // Configuration validation
    this.validateConfiguration()
    
    // Dependencies validation
    this.validateDependencies()
    
    // Component integration validation
    this.validateComponentIntegration()
    
    // Route configuration validation
    this.validateRouteConfiguration()
    
    // Build configuration validation
    this.validateBuildConfiguration()
    
    // Test coverage validation
    this.validateTestCoverage()

    // Print results
    this.printResults()
    
    return this.errors.length === 0
  }

  /**
   * Validate file structure
   */
  validateFileStructure() {
    console.log('📁 Validating file structure...')
    
    const requiredFiles = [
      'src/main.ts',
      'src/App.vue',
      'src/router/index.ts',
      'package.json',
      'vite.config.js',
      'tsconfig.json',
      'index.html'
    ]

    const requiredDirectories = [
      'src/views',
      'src/components',
      'src/composables',
      'src/types',
      'src/utils',
      'src/services',
      'src/test'
    ]

    // Check required files
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.passed.push(`✅ Required file exists: ${file}`)
      } else {
        this.errors.push(`❌ Missing required file: ${file}`)
      }
    })

    // Check required directories
    requiredDirectories.forEach(dir => {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.passed.push(`✅ Required directory exists: ${dir}`)
      } else {
        this.errors.push(`❌ Missing required directory: ${dir}`)
      }
    })

    // Check for critical components
    const criticalComponents = [
      'src/views/Dashboard.vue',
      'src/views/BudgetSettings.vue',
      'src/views/ExpenseRecord.vue',
      'src/views/Statistics.vue',
      'src/components/layout/TabBar.vue',
      'src/components/BudgetCard.vue',
      'src/composables/useBudget.ts',
      'src/composables/useExpense.ts',
      'src/composables/useStorage.ts'
    ]

    criticalComponents.forEach(component => {
      if (fs.existsSync(component)) {
        this.passed.push(`✅ Critical component exists: ${component}`)
      } else {
        this.errors.push(`❌ Missing critical component: ${component}`)
      }
    })
  }

  /**
   * Validate configuration files
   */
  validateConfiguration() {
    console.log('⚙️ Validating configuration...')

    // Validate package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      
      if (packageJson.name === 'monthly-budget-tracker') {
        this.passed.push('✅ Package name is correct')
      } else {
        this.warnings.push('⚠️ Package name might be incorrect')
      }

      const requiredScripts = ['dev', 'build', 'test:unit', 'type-check']
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.passed.push(`✅ Script exists: ${script}`)
        } else {
          this.errors.push(`❌ Missing script: ${script}`)
        }
      })

      const requiredDependencies = ['vue', 'vue-router', 'pinia']
      requiredDependencies.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.passed.push(`✅ Dependency exists: ${dep}`)
        } else {
          this.errors.push(`❌ Missing dependency: ${dep}`)
        }
      })

    } catch (error) {
      this.errors.push('❌ Invalid package.json file')
    }

    // Validate tsconfig.json
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
      
      if (tsconfig.compilerOptions && tsconfig.compilerOptions.strict) {
        this.passed.push('✅ TypeScript strict mode enabled')
      } else {
        this.warnings.push('⚠️ TypeScript strict mode not enabled')
      }

    } catch (error) {
      this.errors.push('❌ Invalid tsconfig.json file')
    }

    // Validate vite.config.js
    try {
      const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
      
      if (viteConfig.includes('@vitejs/plugin-vue')) {
        this.passed.push('✅ Vue plugin configured in Vite')
      } else {
        this.errors.push('❌ Vue plugin not configured in Vite')
      }

      if (viteConfig.includes('alias')) {
        this.passed.push('✅ Path aliases configured')
      } else {
        this.warnings.push('⚠️ Path aliases not configured')
      }

    } catch (error) {
      this.errors.push('❌ Invalid vite.config.js file')
    }
  }

  /**
   * Validate dependencies
   */
  validateDependencies() {
    console.log('📦 Validating dependencies...')

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const lockFile = 'package-lock.json'

      if (fs.existsSync(lockFile)) {
        this.passed.push('✅ Lock file exists')
      } else {
        this.warnings.push('⚠️ No lock file found')
      }

      // Check for security vulnerabilities (basic check)
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      const potentiallyVulnerable = ['lodash', 'moment', 'request']
      
      potentiallyVulnerable.forEach(dep => {
        if (dependencies[dep]) {
          this.warnings.push(`⚠️ Potentially vulnerable dependency: ${dep}`)
        }
      })

    } catch (error) {
      this.errors.push('❌ Could not validate dependencies')
    }
  }

  /**
   * Validate component integration
   */
  validateComponentIntegration() {
    console.log('🧩 Validating component integration...')

    // Check if main components are properly imported
    const mainFiles = [
      'src/main.ts',
      'src/App.vue',
      'src/router/index.ts'
    ]

    mainFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8')
        
        if (file === 'src/main.ts') {
          if (content.includes('createApp') && content.includes('mount')) {
            this.passed.push('✅ App properly initialized in main.ts')
          } else {
            this.errors.push('❌ App not properly initialized in main.ts')
          }
        }

        if (file === 'src/App.vue') {
          if (content.includes('<router-view') && content.includes('TabBar')) {
            this.passed.push('✅ Router and TabBar integrated in App.vue')
          } else {
            this.warnings.push('⚠️ Router or TabBar might not be properly integrated')
          }
        }

        if (file === 'src/router/index.ts') {
          if (content.includes('createRouter') && content.includes('routes')) {
            this.passed.push('✅ Router properly configured')
          } else {
            this.errors.push('❌ Router not properly configured')
          }
        }
      }
    })

    // Check composables integration
    const composables = [
      'src/composables/useBudget.ts',
      'src/composables/useExpense.ts',
      'src/composables/useStorage.ts'
    ]

    composables.forEach(composable => {
      if (fs.existsSync(composable)) {
        const content = fs.readFileSync(composable, 'utf8')
        if (content.includes('export') && (content.includes('ref') || content.includes('reactive'))) {
          this.passed.push(`✅ Composable properly structured: ${path.basename(composable)}`)
        } else {
          this.warnings.push(`⚠️ Composable might not be properly structured: ${path.basename(composable)}`)
        }
      }
    })
  }

  /**
   * Validate route configuration
   */
  validateRouteConfiguration() {
    console.log('🛣️ Validating route configuration...')

    if (fs.existsSync('src/router/index.ts')) {
      const routerContent = fs.readFileSync('src/router/index.ts', 'utf8')
      
      const requiredRoutes = ['Dashboard', 'BudgetSettings', 'ExpenseRecord', 'Statistics']
      requiredRoutes.forEach(route => {
        if (routerContent.includes(route)) {
          this.passed.push(`✅ Route configured: ${route}`)
        } else {
          this.errors.push(`❌ Missing route: ${route}`)
        }
      })

      if (routerContent.includes('lazy') || routerContent.includes('import(')) {
        this.passed.push('✅ Lazy loading configured for routes')
      } else {
        this.warnings.push('⚠️ Lazy loading not configured for routes')
      }
    }
  }

  /**
   * Validate build configuration
   */
  validateBuildConfiguration() {
    console.log('🏗️ Validating build configuration...')

    if (fs.existsSync('vite.config.js')) {
      const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
      
      if (viteConfig.includes('build')) {
        this.passed.push('✅ Build configuration exists')
      } else {
        this.warnings.push('⚠️ Build configuration might be missing')
      }

      if (viteConfig.includes('rollupOptions')) {
        this.passed.push('✅ Rollup options configured')
      } else {
        this.warnings.push('⚠️ Rollup options not configured')
      }

      if (viteConfig.includes('manualChunks')) {
        this.passed.push('✅ Code splitting configured')
      } else {
        this.warnings.push('⚠️ Code splitting not configured')
      }
    }
  }

  /**
   * Validate test coverage
   */
  validateTestCoverage() {
    console.log('🧪 Validating test coverage...')

    const testDir = 'src/test'
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'))
      
      if (testFiles.length > 0) {
        this.passed.push(`✅ Found ${testFiles.length} test files`)
      } else {
        this.warnings.push('⚠️ No test files found')
      }

      // Check for critical test files
      const criticalTests = [
        'useBudget.test.ts',
        'useExpense.test.ts',
        'useStorage.test.ts',
        'integration.e2e.test.ts'
      ]

      criticalTests.forEach(test => {
        if (testFiles.includes(test)) {
          this.passed.push(`✅ Critical test exists: ${test}`)
        } else {
          this.warnings.push(`⚠️ Missing critical test: ${test}`)
        }
      })
    } else {
      this.warnings.push('⚠️ Test directory not found')
    }

    // Check for vitest configuration
    if (fs.existsSync('vitest.config.js')) {
      this.passed.push('✅ Vitest configuration exists')
    } else {
      this.warnings.push('⚠️ Vitest configuration not found')
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 VALIDATION RESULTS')
    console.log('='.repeat(60))

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:')
      this.passed.forEach(check => console.log(`  ${check}`))
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:')
      this.warnings.forEach(warning => console.log(`  ${warning}`))
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      this.errors.forEach(error => console.log(`  ${error}`))
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📈 SUMMARY: ${this.passed.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`)
    
    if (this.errors.length === 0) {
      console.log('🎉 Application validation PASSED!')
    } else {
      console.log('💥 Application validation FAILED!')
    }
    console.log('='.repeat(60))
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ApplicationValidator()
  validator.validate().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = ApplicationValidator