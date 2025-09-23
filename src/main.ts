import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGlobalErrorHandler } from './composables/useErrorHandler'
import { initializeIntegration } from './services/integrationService'

// Import global styles
import './assets/styles/main.scss'
// Design system is automatically imported via Vite config

const app = createApp(App)

// Setup global error handling
setupGlobalErrorHandler(app)

app.use(createPinia())
app.use(router)

// Initialize integration service
initializeIntegration(app, router, {
  enablePerformanceMonitoring: true,
  enableHealthChecks: true,
  enableErrorReporting: true,
  enableAnalytics: false,
  debugMode: import.meta.env.DEV
}).then(() => {
  console.log('✅ Application integration initialized successfully')
}).catch((error) => {
  console.error('❌ Application integration failed:', error)
})

app.mount('#app')