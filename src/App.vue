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
    
    <!-- Global Components -->
    <Toast />
    <LoadingSpinner 
      :visible="isLoading"
      :global="true"
      :message="loadingMessage"
      :progress="loadingProgress"
      :show-progress="loadingProgress !== undefined"
      :cancelable="canCancel"
      @cancel="cancelAllLoading"
    />
    <PerformanceMonitor />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGesture } from './composables/useGesture'
import { useDeviceAdaptation } from './composables/useDeviceAdaptation'
import { usePerformanceOptimization } from './composables/usePerformanceOptimization'
import { useTouchOptimization } from './composables/useTouchOptimization'
import { getGlobalLoadingState } from './composables/useLoadingState'
import { getGlobalDataRecovery } from './composables/useDataRecovery'
import SafeArea from './components/layout/SafeArea.vue'
import TabBar from './components/layout/TabBar.vue'
import Toast from './components/Toast.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'

const route = useRoute()
const router = useRouter()

// Initialize global services
const { 
  isLoading, 
  loadingMessage, 
  loadingProgress, 
  canCancel, 
  cancelAllLoading 
} = getGlobalLoadingState()

const { createAutoBackup, getCurrentData } = getGlobalDataRecovery()

// Initialize mobile optimizations
const { deviceInfo, isSmallScreen, isLandscape } = useDeviceAdaptation()
const { startPerformanceMonitoring, performanceMetrics } = usePerformanceOptimization()
const { validateTouchTargets } = useTouchOptimization()

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

// ============================================================================
// Lifecycle and Auto-backup
// ============================================================================

onMounted(async () => {
  // Start performance monitoring
  const stopMonitoring = startPerformanceMonitoring()
  
  // Create auto backup on app start
  try {
    const currentData = getCurrentData()
    if (currentData.budgets.length > 0 || currentData.expenses.length > 0) {
      await createAutoBackup(currentData)
    }
  } catch (error) {
    console.warn('Failed to create auto backup on startup:', error)
  }
  
  // Validate touch targets in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const issues = validateTouchTargets()
      if (issues.length > 0) {
        console.warn('Touch target accessibility issues:', issues)
      }
    }, 1000)
  }
  
  // Cleanup on unmount
  return () => {
    stopMonitoring()
  }
})

// Create auto backup when data changes (debounced)
let autoBackupTimeout: NodeJS.Timeout | null = null
const scheduleAutoBackup = () => {
  if (autoBackupTimeout) {
    clearTimeout(autoBackupTimeout)
  }
  
  autoBackupTimeout = setTimeout(async () => {
    try {
      const currentData = getCurrentData()
      await createAutoBackup(currentData)
    } catch (error) {
      console.warn('Auto backup failed:', error)
    }
  }, 5000) // 5 second delay
}

// Watch for route changes to trigger auto backup
watch(route, () => {
  scheduleAutoBackup()
})
</script>

<style lang="scss">
// Design system is automatically imported via Vite config

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