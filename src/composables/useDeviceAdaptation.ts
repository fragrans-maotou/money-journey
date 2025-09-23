import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface DeviceInfo {
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isLandscape: boolean
  isSmallScreen: boolean
  isMediumScreen: boolean
  isLargeScreen: boolean
  isHighDPI: boolean
  hasNotch: boolean
  keyboardHeight: number
  isKeyboardOpen: boolean
}

export interface TouchAreaConfig {
  minSize: number
  padding: number
  margin: number
}

export function useDeviceAdaptation() {
  // Reactive device state
  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)
  const pixelRatio = ref(window.devicePixelRatio || 1)
  const keyboardHeight = ref(0)

  // Computed device characteristics
  const isLandscape = computed(() => screenWidth.value > screenHeight.value)
  const isSmallScreen = computed(() => screenWidth.value < 375)
  const isMediumScreen = computed(() => screenWidth.value >= 375 && screenWidth.value <= 414)
  const isLargeScreen = computed(() => screenWidth.value > 414)
  const isHighDPI = computed(() => pixelRatio.value >= 2)
  const isKeyboardOpen = computed(() => keyboardHeight.value > 0)

  // Detect devices with notch/safe area
  const hasNotch = computed(() => {
    // Check if safe area insets are available
    const testEl = document.createElement('div')
    testEl.style.paddingTop = 'env(safe-area-inset-top)'
    document.body.appendChild(testEl)
    const hasInsets = getComputedStyle(testEl).paddingTop !== '0px'
    document.body.removeChild(testEl)
    return hasInsets
  })

  // Device info object
  const deviceInfo = computed<DeviceInfo>(() => ({
    screenWidth: screenWidth.value,
    screenHeight: screenHeight.value,
    pixelRatio: pixelRatio.value,
    isLandscape: isLandscape.value,
    isSmallScreen: isSmallScreen.value,
    isMediumScreen: isMediumScreen.value,
    isLargeScreen: isLargeScreen.value,
    isHighDPI: isHighDPI.value,
    hasNotch: hasNotch.value,
    keyboardHeight: keyboardHeight.value,
    isKeyboardOpen: isKeyboardOpen.value
  }))

  // Touch area configuration based on device
  const touchAreaConfig = computed<TouchAreaConfig>(() => {
    const baseSize = isSmallScreen.value ? 40 : 44
    return {
      minSize: baseSize,
      padding: isSmallScreen.value ? 8 : 12,
      margin: isSmallScreen.value ? 4 : 8
    }
  })

  // Responsive font size
  const responsiveFontSize = computed(() => {
    if (isSmallScreen.value) return '14px'
    if (isLargeScreen.value) return '18px'
    return '16px'
  })

  // Responsive spacing
  const responsiveSpacing = computed(() => ({
    xs: isSmallScreen.value ? '2px' : '4px',
    sm: isSmallScreen.value ? '4px' : '8px',
    md: isSmallScreen.value ? '8px' : '12px',
    lg: isSmallScreen.value ? '12px' : '16px',
    xl: isSmallScreen.value ? '16px' : '20px',
    '2xl': isSmallScreen.value ? '20px' : '24px',
    '3xl': isSmallScreen.value ? '24px' : '32px'
  }))

  // Handle window resize
  const handleResize = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
    pixelRatio.value = window.devicePixelRatio || 1
  }

  // Handle virtual keyboard
  const handleVisualViewportChange = () => {
    if (window.visualViewport) {
      const viewport = window.visualViewport
      const keyboardOpen = viewport.height < window.innerHeight * 0.75
      keyboardHeight.value = keyboardOpen ? (window.innerHeight - viewport.height) : 0
    }
  }

  // Optimize touch targets for accessibility
  const optimizeTouchTarget = (element: HTMLElement) => {
    const config = touchAreaConfig.value
    const rect = element.getBoundingClientRect()
    
    if (rect.width < config.minSize || rect.height < config.minSize) {
      element.style.minWidth = `${config.minSize}px`
      element.style.minHeight = `${config.minSize}px`
      element.style.padding = `${config.padding}px`
    }
  }

  // Get optimal image size for current device
  const getOptimalImageSize = (baseWidth: number, baseHeight: number) => {
    const scale = isHighDPI.value ? 2 : 1
    return {
      width: Math.round(baseWidth * scale),
      height: Math.round(baseHeight * scale),
      scale
    }
  }

  // Check if device supports specific features
  const supportsFeature = (feature: string) => {
    switch (feature) {
      case 'touch':
        return 'ontouchstart' in window
      case 'hover':
        return window.matchMedia('(hover: hover)').matches
      case 'pointer-fine':
        return window.matchMedia('(pointer: fine)').matches
      case 'reduced-motion':
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      case 'dark-mode':
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      case 'high-contrast':
        return window.matchMedia('(prefers-contrast: high)').matches
      default:
        return false
    }
  }

  // Setup event listeners
  onMounted(() => {
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })
    
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

  return {
    deviceInfo,
    touchAreaConfig,
    responsiveFontSize,
    responsiveSpacing,
    optimizeTouchTarget,
    getOptimalImageSize,
    supportsFeature,
    
    // Individual properties for convenience
    screenWidth,
    screenHeight,
    isLandscape,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isHighDPI,
    hasNotch,
    keyboardHeight,
    isKeyboardOpen
  }
}