import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App.vue', () => {
  it('renders properly', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' }
        }
      ]
    })

    const pinia = createPinia()

    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia]
      }
    })

    expect(wrapper.find('#app').exists()).toBe(true)
  })
})