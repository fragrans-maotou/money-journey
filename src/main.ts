import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGlobalErrorHandler } from './composables/useErrorHandler'

// Import global styles
import './assets/styles/main.scss'
// Design system is automatically imported via Vite config

const app = createApp(App)

// Setup global error handling
setupGlobalErrorHandler(app)

app.use(createPinia())
app.use(router)

app.mount('#app')