<template>
  <div 
    ref="containerRef"
    class="lazy-image"
    :class="{ 
      'is-loading': isLoading,
      'is-loaded': isLoaded,
      'has-error': hasError
    }"
  >
    <img
      v-if="shouldLoad"
      ref="imageRef"
      :src="optimizedSrc"
      :srcset="optimizedSrcset"
      :alt="alt"
      :loading="nativeLoading ? 'lazy' : 'eager'"
      class="lazy-image-img"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- Placeholder -->
    <div v-if="isLoading || (!shouldLoad && placeholder)" class="lazy-image-placeholder">
      <slot name="placeholder">
        <div class="lazy-image-skeleton" />
      </slot>
    </div>
    
    <!-- Error state -->
    <div v-if="hasError" class="lazy-image-error">
      <slot name="error">
        <div class="lazy-image-error-icon">⚠️</div>
        <p class="lazy-image-error-text">图片加载失败</p>
      </slot>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading && showLoadingIndicator" class="lazy-image-loading">
      <slot name="loading">
        <div class="lazy-image-spinner" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePerformanceOptimization } from '../composables/usePerformanceOptimization'
import { useDeviceAdaptation } from '../composables/useDeviceAdaptation'

interface Props {
  src: string
  srcset?: string
  alt?: string
  placeholder?: boolean
  showLoadingIndicator?: boolean
  rootMargin?: string
  threshold?: number
  nativeLoading?: boolean
  quality?: number
  width?: number
  height?: number
  retryCount?: number
  retryDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  placeholder: true,
  showLoadingIndicator: true,
  rootMargin: '50px',
  threshold: 0.1,
  nativeLoading: false,
  quality: 80,
  retryCount: 3,
  retryDelay: 1000
})

const emit = defineEmits<{
  load: [Event]
  error: [Event]
  intersect: [IntersectionObserverEntry]
}>()

const { createLazyLoader, optimizeImage } = usePerformanceOptimization()
const { getOptimalImageSize, isHighDPI } = useDeviceAdaptation()

// Refs
const containerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()

// State
const isIntersecting = ref(false)
const isLoading = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const retryAttempts = ref(0)

// Computed
const shouldLoad = computed(() => {
  return props.nativeLoading || isIntersecting.value
})

const optimizedSrc = computed(() => {
  if (!props.width || !props.height) return props.src
  
  const { width, height } = getOptimalImageSize(props.width, props.height)
  
  // If we have specific dimensions and quality settings, we could
  // implement image optimization here (e.g., using a service)
  return props.src
})

const optimizedSrcset = computed(() => {
  if (!props.srcset) return undefined
  
  // Process srcset for high DPI displays
  if (isHighDPI.value) {
    return props.srcset
  }
  
  return props.srcset
})

// Lazy loading setup
let lazyLoader: ReturnType<typeof createLazyLoader> | null = null
let retryTimeout: NodeJS.Timeout | null = null

const setupLazyLoading = () => {
  if (props.nativeLoading || !containerRef.value) return

  lazyLoader = createLazyLoader({
    rootMargin: props.rootMargin,
    threshold: props.threshold,
    once: true
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        isIntersecting.value = true
        emit('intersect', entry)
      }
    })
  }, {
    rootMargin: props.rootMargin,
    threshold: props.threshold
  })

  observer.observe(containerRef.value)

  return () => {
    observer.disconnect()
    lazyLoader?.disconnect()
  }
}

// Image loading handlers
const handleLoad = (event: Event) => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  retryAttempts.value = 0
  emit('load', event)
}

const handleError = (event: Event) => {
  isLoading.value = false
  hasError.value = true
  
  // Retry logic
  if (retryAttempts.value < props.retryCount) {
    retryAttempts.value++
    
    retryTimeout = setTimeout(() => {
      if (imageRef.value) {
        isLoading.value = true
        hasError.value = false
        // Force reload by changing src
        const src = imageRef.value.src
        imageRef.value.src = ''
        imageRef.value.src = src
      }
    }, props.retryDelay * retryAttempts.value)
  } else {
    emit('error', event)
  }
}

// Watch for loading state
watch(shouldLoad, (newValue) => {
  if (newValue && !isLoaded.value && !hasError.value) {
    isLoading.value = true
  }
})

// Preload image for better UX
const preloadImage = async () => {
  if (!props.src) return

  try {
    const img = new Image()
    img.src = optimizedSrc.value
    if (optimizedSrcset.value) {
      img.srcset = optimizedSrcset.value
    }
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
  } catch (error) {
    console.warn('Image preload failed:', error)
  }
}

// Lifecycle
onMounted(() => {
  const cleanup = setupLazyLoading()
  
  // Preload if image is likely to be visible soon
  if (props.rootMargin && parseInt(props.rootMargin) > 100) {
    preloadImage()
  }

  onUnmounted(() => {
    cleanup?.()
    if (retryTimeout) {
      clearTimeout(retryTimeout)
    }
  })
})
</script>

<style lang="scss" scoped>
.lazy-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: var(--ios-gray-6, #f2f2f7);
  
  &.is-loading {
    .lazy-image-placeholder {
      opacity: 1;
    }
  }
  
  &.is-loaded {
    .lazy-image-placeholder {
      opacity: 0;
    }
    
    .lazy-image-img {
      opacity: 1;
    }
  }
  
  &.has-error {
    .lazy-image-error {
      opacity: 1;
    }
  }
}

.lazy-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ios-gray-6, #f2f2f7);
  transition: opacity 0.3s ease;
}

.lazy-image-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--ios-gray-5, #e5e5ea) 25%,
    var(--ios-gray-4, #d1d1d6) 50%,
    var(--ios-gray-5, #e5e5ea) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.lazy-image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--ios-gray-6, #f2f2f7);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image-error-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.lazy-image-error-text {
  font-size: 12px;
  color: var(--ios-gray, #8e8e93);
  margin: 0;
  text-align: center;
}

.lazy-image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.lazy-image-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--ios-gray-4, #d1d1d6);
  border-top: 2px solid var(--ios-blue, #007aff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>