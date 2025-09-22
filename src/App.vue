<template>
  <div id="app">
    <SafeArea :show-tab-bar="showTabBar">
      <router-view v-slot="{ Component, route }">
        <transition 
          :name="transitionName" 
          mode="out-in"
          @enter="onTransitionEnter"
          @leave="onTransitionLeave"
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </SafeArea>
    
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGesture } from './composables/useGesture'
import SafeArea from './components/layout/SafeArea.vue'
import TabBar from './components/layout/TabBar.vue'

const route = useRoute()
const router = useRouter()

// Initialize gesture handling
const { onSwipe } = useGesture({
  enableSwipeBack: true,
  swipeThreshold: 50,
  edgeThreshold: 20
})

// Track route transitions for animation direction
const isNavigatingBack = ref(false)
const transitionName = ref('slide-right')

// Determine if tab bar should be shown
const showTabBar = computed(() => {
  return route.meta?.showTabBar !== false
})

// Handle route transitions
watch(route, (to, from) => {
  // Determine transition direction based on route hierarchy
  const routeOrder = ['Dashboard', 'ExpenseRecord', 'Statistics', 'BudgetSettings']
  const fromIndex = routeOrder.indexOf(from.name as string)
  const toIndex = routeOrder.indexOf(to.name as string)
  
  if (fromIndex !== -1 && toIndex !== -1) {
    if (toIndex > fromIndex) {
      transitionName.value = 'slide-left'
    } else {
      transitionName.value = 'slide-right'
    }
  } else {
    // Default transition
    transitionName.value = 'slide-right'
  }
})

// Listen for back navigation
router.beforeEach((to, from) => {
  // Check if this is a back navigation
  const historyState = router.options.history.state as any
  if (historyState && historyState.position < historyState.forward) {
    isNavigatingBack.value = true
    transitionName.value = 'slide-right'
  } else {
    isNavigatingBack.value = false
  }
})

// Handle custom swipe gestures
onSwipe((swipeEvent) => {
  // Additional swipe handling can be added here
  console.log('Swipe detected:', swipeEvent)
})

// Transition event handlers
const onTransitionEnter = (el: Element) => {
  // Add any enter transition logic here
}

const onTransitionLeave = (el: Element) => {
  // Add any leave transition logic here
}
</script>

<style lang="scss">
// Import design system
@import './styles/design-system.scss';

#app {
  font-family: var(--ios-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--ios-gray-dark, #1c1c1e);
  min-height: 100vh;
  background: var(--ios-gray-light, #f2f2f7);
}

// Page transition animations
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// Ensure smooth transitions
.slide-left-enter-active,
.slide-right-enter-active {
  z-index: 2;
}

.slide-left-leave-active,
.slide-right-leave-active {
  z-index: 1;
}

// iOS-style page container
.page-container {
  position: relative;
  min-height: 100vh;
  background: var(--ios-gray-light, #f2f2f7);
}

// Global styles for iOS feel
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--ios-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  background: var(--ios-gray-light, #f2f2f7);
  
  // Prevent text selection on touch devices
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  // Prevent tap highlight
  -webkit-tap-highlight-color: transparent;
}

// Allow text selection in content areas
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}
</style>