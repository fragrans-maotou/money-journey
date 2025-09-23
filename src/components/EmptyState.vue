<template>
  <div class="empty-state">
    <!-- Illustration/Icon -->
    <div class="empty-state__visual">
      <div v-if="illustration" class="empty-state__illustration">
        {{ illustration }}
      </div>
      <div v-else-if="icon" class="empty-state__icon">
        {{ icon }}
      </div>
      <div v-else class="empty-state__default-icon">
        📋
      </div>
    </div>

    <!-- Content -->
    <div class="empty-state__content">
      <h3 class="empty-state__title">
        {{ title }}
      </h3>
      <p class="empty-state__message">
        {{ message }}
      </p>
    </div>

    <!-- Actions -->
    <div v-if="actions && actions.length > 0" class="empty-state__actions">
      <button
        v-for="action in actions"
        :key="action.label"
        :class="[
          'empty-state__action',
          `empty-state__action--${action.style || 'primary'}`
        ]"
        @click="handleActionClick(action)"
      >
        <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
        {{ action.label }}
      </button>
    </div>

    <!-- Slot for custom content -->
    <div v-if="$slots.default" class="empty-state__custom">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EmptyState, EmptyStateAction } from '@/types/errors'

// ============================================================================
// Props
// ============================================================================

interface Props {
  title: string
  message: string
  icon?: string
  illustration?: string
  actions?: EmptyStateAction[]
}

const props = defineProps<Props>()

// ============================================================================
// Methods
// ============================================================================

const handleActionClick = (action: EmptyStateAction): void => {
  try {
    action.action()
  } catch (error) {
    console.error('Empty state action failed:', error)
  }
}
</script>

<style lang="scss" scoped>
// ============================================================================
// Empty State Container
// ============================================================================

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 300px;
  max-width: 400px;
  margin: 0 auto;
}

// ============================================================================
// Visual Elements
// ============================================================================

.empty-state__visual {
  margin-bottom: 24px;
}

.empty-state__illustration {
  font-size: 80px;
  line-height: 1;
  opacity: 0.8;
  margin-bottom: 8px;
}

.empty-state__icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.6;
  margin-bottom: 8px;
}

.empty-state__default-icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.4;
  margin-bottom: 8px;
  filter: grayscale(1);
}

// ============================================================================
// Content
// ============================================================================

.empty-state__content {
  margin-bottom: 32px;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.empty-state__message {
  font-size: 16px;
  color: #8E8E93;
  line-height: 1.5;
  margin: 0;
  max-width: 300px;
}

// ============================================================================
// Actions
// ============================================================================

.empty-state__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.empty-state__action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;

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
    border: 1px solid rgba(0, 122, 255, 0.2);

    &:hover {
      background: rgba(0, 122, 255, 0.2);
    }
  }
}

.action-icon {
  font-size: 18px;
  line-height: 1;
}

// ============================================================================
// Custom Content Slot
// ============================================================================

.empty-state__custom {
  margin-top: 24px;
  width: 100%;
}

// ============================================================================
// Size Variants
// ============================================================================

.empty-state--compact {
  min-height: 200px;
  padding: 24px 16px;

  .empty-state__visual {
    margin-bottom: 16px;
  }

  .empty-state__illustration {
    font-size: 60px;
  }

  .empty-state__icon {
    font-size: 36px;
  }

  .empty-state__title {
    font-size: 18px;
  }

  .empty-state__message {
    font-size: 14px;
  }

  .empty-state__content {
    margin-bottom: 24px;
  }
}

.empty-state--large {
  min-height: 400px;
  padding: 60px 20px;

  .empty-state__visual {
    margin-bottom: 32px;
  }

  .empty-state__illustration {
    font-size: 100px;
  }

  .empty-state__icon {
    font-size: 64px;
  }

  .empty-state__title {
    font-size: 24px;
  }

  .empty-state__message {
    font-size: 18px;
  }

  .empty-state__content {
    margin-bottom: 40px;
  }
}

// ============================================================================
// Theme Variants
// ============================================================================

.empty-state--subtle {
  .empty-state__visual {
    opacity: 0.5;
  }

  .empty-state__title {
    color: #8E8E93;
  }

  .empty-state__message {
    color: #AEAEB2;
  }
}

// ============================================================================
// Dark Mode Support
// ============================================================================

@media (prefers-color-scheme: dark) {
  .empty-state__title {
    color: #FFFFFF;
  }

  .empty-state__message {
    color: #EBEBF5;
  }

  .empty-state__action--secondary {
    background: rgba(0, 122, 255, 0.2);
    color: #64D2FF;
    border-color: rgba(100, 210, 255, 0.3);

    &:hover {
      background: rgba(0, 122, 255, 0.3);
    }
  }

  .empty-state--subtle {
    .empty-state__title {
      color: #EBEBF5;
    }

    .empty-state__message {
      color: #8E8E93;
    }
  }
}

// ============================================================================
// Responsive Design
// ============================================================================

@media (max-width: 480px) {
  .empty-state {
    padding: 32px 16px;
    min-height: 250px;
  }

  .empty-state__illustration {
    font-size: 64px;
  }

  .empty-state__icon {
    font-size: 40px;
  }

  .empty-state__title {
    font-size: 18px;
  }

  .empty-state__message {
    font-size: 15px;
  }

  .empty-state__actions {
    max-width: none;
  }

  .empty-state__action {
    font-size: 15px;
    padding: 10px 20px;
    min-height: 44px;
  }
}

// ============================================================================
// Animation
// ============================================================================

.empty-state {
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state__visual {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state__action {
  animation: fadeIn 0.8s ease;
  animation-fill-mode: both;
}

.empty-state__action:nth-child(1) { animation-delay: 0.2s; }
.empty-state__action:nth-child(2) { animation-delay: 0.3s; }
.empty-state__action:nth-child(3) { animation-delay: 0.4s; }

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>