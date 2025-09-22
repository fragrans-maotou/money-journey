import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import global styles
import './assets/styles/main.scss'
import './styles/design-system.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')