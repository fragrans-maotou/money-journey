<template>
  <div 
    class="safe-area" 
    :class="{ 
      'with-tab-bar': showTabBar,
      'is-landscape': isLandscape,
      'is-small-screen': isSmallScreen,
      'is-large-screen': isLargeScreen
    }"
    :style="dynamicStyles"
  >
    <div class="safe-area-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  showTabBar?: boolean
  adaptToKeyboard?: boolean
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  showTabBar: true,
  adaptToKeyboard: true,
  minHeight: '100vh'
})

// Responsive state
const screenWidth = ref(window.innerWidth)
const screenHeight = ref(window.innerHeight)
const isLandscape = ref(window.innerWidth > window.innerHeight)
const keyboardHeight = ref(0)

// Screen size breakpoints
const isSmallScreen = computed(() => screenWidth.value < 375)
const isLargeScreen = computed(() => screenWidth.value > 414)

// Dynamic styles based on screen size and keyboard
const dynamicStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // Adjust for keyboard
  if (props.adaptToKeyboard && keyboardHeight.value > 0) {
    styles.paddingBottom = `${keyboardHeight.value}px`
  }
  
  // Adjust for landscape mode
  if (isLandscape.value) {
    styles.paddingTop = 'max(env(safe-area-inset-top), 8px)'
    styles.paddingBottom = 'max(env(safe-area-inset-bottom), 8px)'
  }
  
  return styles
})

// Handle window resize
const handleResize = () => {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
  isLandscape.value = window.innerWidth > window.innerHeight
}

// Handle virtual keyboard on mobile
const handleVisualViewportChange = () => {
  if (window.visualViewport) {
    const viewport = window.visualViewport
    const keyboardOpen = viewport.height < window.innerHeight * 0.75
    keyboardHeight.value = keyboardOpen ? (window.innerHeight - viewport.height) : 0
  }
}

onMounted(() => {
  // Listen for resize events
  window.addEventListener('resize', handleResize, { passive: true })
  window.addEventListener('orientationchange', handleResize, { passive: true })
  
  // Listen for virtual keyboard changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true })
  }
  
  // Initial setup
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
  
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
  }
})
</script>

<style lang="scss" scoped>
.safe-area {
  min-height: v-bind('props.minHeight');
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  position: relative;
  
  // Default bottom padding
  &.with-tab-bar {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
  
  &:not(.with-tab-bar) {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  // Landscape adaptations
  &.is-landscape {
    padding-left: max(env(safe-area-inset-left), 16px);
    padding-right: max(env(safe-area-inset-right), 16px);
    
    &.with-tab-bar {
      padding-bottom: calc(60px + env(safe-area-inset-bottom));
    }
  }
  
  // Small screen adaptations
  &.is-small-screen {
    .safe-area-content {
      padding: 0 12px;
    }
  }
  
  // Large screen adaptations
  &.is-large-screen {
    .safe-area-content {
      max-width: 428px;
      margin: 0 auto;
      padding: 0 20px;
    }
  }
  
  .safe-area-content {
    min-height: 100%;
    position: relative;
    transition: padding-bottom 0.3s ease;
  }
}

// Responsive font scaling
@media screen and (max-width: 320px) {
  .safe-area {
    font-size: 14px;
  }
}

@media screen and (min-width: 414px) {
  .safe-area {
    font-size: 18px;
  }
}

// High DPI displays
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .safe-area {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>