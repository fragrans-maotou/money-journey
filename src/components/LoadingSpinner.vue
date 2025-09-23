<template>
  <div
    v-if="isVisible"
    :class="[
      'loading-overlay',
      {
        'loading-overlay--global': global,
        'loading-overlay--inline': !global,
        'loading-overlay--cancelable': cancelable
      }
    ]"
  >
    <!-- Background Blur -->
    <div class="loading-overlay__backdrop" @click="handleBackdropClick" />

    <!-- Loading Content -->
    <div class="loading-content">
      <!-- Spinner -->
      <div class="loading-spinner">
        <div class="spinner-ring">
          <div class="spinner-ring__circle"></div>
        </div>
      </div>

      <!-- Message -->
      <div v-if="message" class="loading-message">
        {{ message }}
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress && progress !== undefined" class="loading-progress">
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{ width: `${Math.max(0, Math.min(100, progress))}%` }"
          />
        </div>
        <div class="progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>

      <!-- Cancel Button -->
      <button
        v-if="cancelable"
        class="loading-cancel"
        @click="handleCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================================================
// Props
// ============================================================================

interface Props {
  visible?: boolean
  global?: boolean
  message?: string
  progress?: number
  showProgress?: boolean
  cancelable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  global: false,
  showProgress: false,
  cancelable: false
})

// ============================================================================
// Emits
// ============================================================================

interface Emits {
  cancel: []
  backdropClick: []
}

const emit = defineEmits<Emits>()

// ============================================================================
// Computed Properties
// ============================================================================

const isVisible = computed(() => props.visible)

// ============================================================================
// Methods
// ============================================================================

const handleCancel = (): void => {
  if (props.cancelable) {
    emit('cancel')
  }
}

const handleBackdropClick = (): void => {
  emit('backdropClick')
  
  // Auto-cancel if cancelable
  if (props.cancelable) {
    handleCancel()
  }
}
</script>

<style lang="scss" scoped>
// ============================================================================
// Loading Overlay Base
// ============================================================================

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &--inline {
    position: absolute;
    z-index: 10;
  }
}

.loading-overlay__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: default;

  .loading-overlay--cancelable & {
    cursor: pointer;
  }
}

// ============================================================================
// Loading Content
// ============================================================================

.loading-content {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  max-width: 300px;
  text-align: center;
}

// ============================================================================
// Spinner Styles
// ============================================================================

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  position: relative;
}

.spinner-ring__circle {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ============================================================================
// Loading Message
// ============================================================================

.loading-message {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  line-height: 1.4;
  margin: 0;
}

// ============================================================================
// Progress Bar
// ============================================================================

.loading-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 122, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: #007AFF;
  border-radius: 2px;
  transition: width 0.3s ease;
  transform-origin: left;
}

.progress-text {
  font-size: 14px;
  color: #8E8E93;
  font-weight: 500;
  text-align: center;
}

// ============================================================================
// Cancel Button
// ============================================================================

.loading-cancel {
  padding: 8px 20px;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
}

// ============================================================================
// Size Variants
// ============================================================================

.loading-overlay--inline {
  .loading-content {
    padding: 24px;
    min-width: 150px;
  }

  .spinner-ring {
    width: 32px;
    height: 32px;
  }

  .loading-message {
    font-size: 14px;
  }
}

// ============================================================================
// Dark Mode Support
// ============================================================================

@media (prefers-color-scheme: dark) {
  .loading-overlay__backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .loading-content {
    background: rgba(28, 28, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .loading-message {
    color: #FFFFFF;
  }

  .progress-text {
    color: #EBEBF5;
  }

  .loading-cancel {
    background: rgba(0, 122, 255, 0.2);
    color: #64D2FF;

    &:hover {
      background: rgba(0, 122, 255, 0.3);
    }
  }
}

// ============================================================================
// Responsive Design
// ============================================================================

@media (max-width: 480px) {
  .loading-content {
    padding: 24px;
    min-width: 180px;
    max-width: 280px;
  }

  .loading-message {
    font-size: 15px;
  }
}

// ============================================================================
// Animation Variants
// ============================================================================

.loading-overlay {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Pulse animation for spinner
.spinner-ring__circle {
  animation: spin 1s linear infinite, pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Progress bar animation
.progress-bar__fill {
  animation: progressShine 2s ease-in-out infinite;
}

@keyframes progressShine {
  0% {
    background: #007AFF;
  }
  50% {
    background: linear-gradient(90deg, #007AFF, #64D2FF, #007AFF);
  }
  100% {
    background: #007AFF;
  }
}
</style>