<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup
        name="toast"
        tag="div"
        class="toast-list"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast',
            `toast--${toast.type}`,
            { 'toast--persistent': toast.persistent }
          ]"
          @click="handleToastClick(toast)"
        >
          <!-- Toast Content -->
          <div class="toast__content">
            <!-- Icon -->
            <div class="toast__icon">
              {{ getToastIcon(toast.type) }}
            </div>

            <!-- Text Content -->
            <div class="toast__text">
              <div v-if="toast.title" class="toast__title">
                {{ toast.title }}
              </div>
              <div class="toast__message">
                {{ toast.message }}
              </div>
            </div>

            <!-- Close Button -->
            <button
              v-if="toast.persistent || toast.actions"
              class="toast__close"
              @click.stop="removeToast(toast.id)"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <!-- Actions -->
          <div v-if="toast.actions && toast.actions.length > 0" class="toast__actions">
            <button
              v-for="action in toast.actions"
              :key="action.label"
              :class="[
                'toast__action',
                `toast__action--${action.style || 'secondary'}`
              ]"
              @click.stop="handleActionClick(action, toast)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import type { ToastMessage, ToastType, ToastAction } from '@/types/errors'

// ============================================================================
// Composables
// ============================================================================

const {
  toasts,
  removeToast,
  getToastIcon
} = useToast()

// ============================================================================
// Methods
// ============================================================================

const handleToastClick = (toast: ToastMessage): void => {
  // Auto-dismiss non-persistent toasts on click
  if (!toast.persistent && !toast.actions?.length) {
    removeToast(toast.id)
  }
}

const handleActionClick = (action: ToastAction, toast: ToastMessage): void => {
  try {
    action.action()
    // Remove toast after action is executed (unless it's persistent)
    if (!toast.persistent) {
      removeToast(toast.id)
    }
  } catch (error) {
    console.error('Toast action failed:', error)
  }
}
</script>

<style lang="scss" scoped>
// ============================================================================
// Toast Container
// ============================================================================

.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
  padding: env(safe-area-inset-top, 20px) 16px 0;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

// ============================================================================
// Toast Base Styles
// ============================================================================

.toast {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

// ============================================================================
// Toast Content
// ============================================================================

.toast__content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.toast__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border-radius: 50%;
  color: white;
  margin-top: 2px;
}

.toast__text {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 4px;
  line-height: 1.3;
}

.toast__message {
  font-size: 14px;
  color: #3C3C43;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2px;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
    color: #1C1C1E;
  }

  &:active {
    transform: scale(0.9);
  }
}

// ============================================================================
// Toast Actions
// ============================================================================

.toast__actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  justify-content: flex-end;
}

.toast__action {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;

  &:active {
    transform: scale(0.95);
  }

  &--primary {
    background: #007AFF;
    color: white;

    &:hover {
      background: #0056CC;
    }
  }

  &--secondary {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;

    &:hover {
      background: rgba(0, 122, 255, 0.2);
    }
  }

  &--danger {
    background: #FF3B30;
    color: white;

    &:hover {
      background: #D70015;
    }
  }
}

// ============================================================================
// Toast Type Variants
// ============================================================================

.toast--success {
  .toast__icon {
    background: #34C759;
  }
}

.toast--error {
  .toast__icon {
    background: #FF3B30;
  }
}

.toast--warning {
  .toast__icon {
    background: #FF9500;
  }
}

.toast--info {
  .toast__icon {
    background: #007AFF;
  }
}

// ============================================================================
// Persistent Toast Styles
// ============================================================================

.toast--persistent {
  border-left: 4px solid;

  &.toast--success {
    border-left-color: #34C759;
  }

  &.toast--error {
    border-left-color: #FF3B30;
  }

  &.toast--warning {
    border-left-color: #FF9500;
  }

  &.toast--info {
    border-left-color: #007AFF;
  }
}

// ============================================================================
// Animations
// ============================================================================

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-100px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}

// ============================================================================
// Dark Mode Support
// ============================================================================

@media (prefers-color-scheme: dark) {
  .toast {
    background: rgba(28, 28, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .toast__title {
    color: #FFFFFF;
  }

  .toast__message {
    color: #EBEBF5;
  }

  .toast__close {
    background: rgba(255, 255, 255, 0.1);
    color: #EBEBF5;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
    }
  }

  .toast__action--secondary {
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
  .toast-container {
    padding-left: 12px;
    padding-right: 12px;
  }

  .toast {
    max-width: none;
  }

  .toast__content {
    padding: 14px;
  }

  .toast__actions {
    padding: 0 14px 14px;
    flex-direction: column;

    .toast__action {
      width: 100%;
    }
  }
}
</style>