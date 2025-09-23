<template>
  <div 
    ref="containerRef"
    class="responsive-container"
    :class="containerClasses"
    :style="containerStyles"
  >
    <slot 
      :device-info="deviceInfo"
      :breakpoint="currentBreakpoint"
      :is-mobile="isMobile"
      :is-tablet="isTablet"
      :is-desktop="isDesktop"
      :container-width="containerWidth"
      :container-height="containerHeight"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDeviceAdaptation } from '../composables/useDeviceAdaptation'

interface Props {
  maxWidth?: string
  padding?: string | Record<string, string>
  margin?: string | Record<string, string>
  breakpoints?: Record<string, number>
  fluid?: boolean
  centerContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '428px',
  padding: '16px',
  breakpoints: () => ({
    xs: 0,
    sm: 375,
    md: 414,
    lg: 768,
    xl: 1024
  }),
  fluid: false,
  centerContent: true
})

const { deviceInfo } = useDeviceAdaptation()

// Refs
const containerRef = ref<HTMLElement>()
const containerWidth = ref(0)
const containerHeight = ref(0)

// Current breakpoint
const currentBreakpoint = computed(() => {
  const width = deviceInfo.value.screenWidth
  const breakpoints = Object.entries(props.breakpoints)
    .sort(([, a], [, b]) => b - a) // Sort descending
  
  for (const [name, minWidth] of breakpoints) {
    if (width >= minWidth) {
      return name
    }
  }
  
  return 'xs'
})

// Device type helpers
const isMobile = computed(() => ['xs', 'sm'].includes(currentBreakpoint.value))
const isTablet = computed(() => ['md', 'lg'].includes(currentBreakpoint.value))
const isDesktop = computed(() => currentBreakpoint.value === 'xl')

// Container classes
const containerClasses = computed(() => ({
  'responsive-container--fluid': props.fluid,
  'responsive-container--centered': props.centerContent,
  'responsive-container--mobile': isMobile.value,
  'responsive-container--tablet': isTablet.value,
  'responsive-container--desktop': isDesktop.value,
  [`responsive-container--${currentBreakpoint.value}`]: true,
  'responsive-container--landscape': deviceInfo.value.isLandscape,
  'responsive-container--small-screen': deviceInfo.value.isSmallScreen,
  'responsive-container--large-screen': deviceInfo.value.isLargeScreen,
  'responsive-container--high-dpi': deviceInfo.value.isHighDPI,
  'responsive-container--has-notch': deviceInfo.value.hasNotch
}))

// Container styles
const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // Max width
  if (!props.fluid) {
    styles.maxWidth = props.maxWidth
  }
  
  // Responsive padding
  if (typeof props.padding === 'string') {
    styles.padding = props.padding
  } else if (typeof props.padding === 'object') {
    const breakpointPadding = props.padding[currentBreakpoint.value]
    if (breakpointPadding) {
      styles.padding = breakpointPadding
    }
  }
  
  // Responsive margin
  if (typeof props.margin === 'string') {
    styles.margin = props.margin
  } else if (typeof props.margin === 'object') {
    const breakpointMargin = props.margin[currentBreakpoint.value]
    if (breakpointMargin) {
      styles.margin = breakpointMargin
    }
  }
  
  // Adjust for keyboard
  if (deviceInfo.value.isKeyboardOpen) {
    styles.paddingBottom = `${deviceInfo.value.keyboardHeight}px`
  }
  
  return styles
})

// Update container dimensions
const updateDimensions = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = rect.height
  }
}

// Resize observer
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateDimensions()
  
  // Set up resize observer
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })
    
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
    }
  }
  
  // Fallback for browsers without ResizeObserver
  window.addEventListener('resize', updateDimensions, { passive: true })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  window.removeEventListener('resize', updateDimensions)
})
</script>

<style lang="scss" scoped>
.responsive-container {
  width: 100%;
  position: relative;
  
  &--centered {
    margin-left: auto;
    margin-right: auto;
  }
  
  &--fluid {
    max-width: none !important;
  }
  
  // Mobile-specific styles
  &--mobile {
    padding: var(--ios-spacing-md, 12px);
    
    &.responsive-container--landscape {
      padding: var(--ios-spacing-sm, 8px) var(--ios-spacing-lg, 16px);
    }
  }
  
  // Tablet-specific styles
  &--tablet {
    padding: var(--ios-spacing-lg, 16px) var(--ios-spacing-xl, 20px);
  }
  
  // Desktop-specific styles
  &--desktop {
    padding: var(--ios-spacing-xl, 20px) var(--ios-spacing-2xl, 24px);
  }
  
  // Small screen adaptations
  &--small-screen {
    padding: var(--ios-spacing-sm, 8px);
    font-size: 14px;
  }
  
  // Large screen adaptations
  &--large-screen {
    max-width: 428px;
    
    &.responsive-container--fluid {
      max-width: none;
    }
  }
  
  // High DPI optimizations
  &--high-dpi {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  // Notch/safe area adaptations
  &--has-notch {
    padding-top: max(var(--ios-spacing-lg, 16px), env(safe-area-inset-top));
    padding-left: max(var(--ios-spacing-md, 12px), env(safe-area-inset-left));
    padding-right: max(var(--ios-spacing-md, 12px), env(safe-area-inset-right));
  }
  
  // Landscape mode adaptations
  &--landscape {
    &.responsive-container--mobile {
      padding-left: var(--ios-spacing-xl, 20px);
      padding-right: var(--ios-spacing-xl, 20px);
    }
  }
}

// Breakpoint-specific styles
.responsive-container--xs {
  font-size: 14px;
}

.responsive-container--sm {
  font-size: 15px;
}

.responsive-container--md {
  font-size: 16px;
}

.responsive-container--lg {
  font-size: 17px;
}

.responsive-container--xl {
  font-size: 18px;
}

// Responsive utilities
@media screen and (max-width: 374px) {
  .responsive-container {
    padding: var(--ios-spacing-sm, 8px);
  }
}

@media screen and (min-width: 415px) {
  .responsive-container {
    padding: var(--ios-spacing-lg, 16px) var(--ios-spacing-xl, 20px);
  }
}

@media screen and (orientation: landscape) and (max-height: 500px) {
  .responsive-container {
    padding-top: var(--ios-spacing-sm, 8px);
    padding-bottom: var(--ios-spacing-sm, 8px);
  }
}
</style>