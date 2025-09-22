<template>
  <div class="progress-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg 
      :width="size" 
      :height="size" 
      class="progress-ring-svg"
      :style="{ transform: 'rotate(-90deg)' }"
    >
      <!-- 背景圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        stroke="#F2F2F7"
        fill="transparent"
        class="progress-ring-background"
      />
      
      <!-- 进度圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="color"
        fill="transparent"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :stroke-linecap="strokeLinecap"
        class="progress-ring-progress"
      />
    </svg>
    
    <!-- 中心内容 -->
    <div class="progress-ring-content">
      <div class="progress-percentage">
        {{ Math.round(progress) }}%
      </div>
      <div class="progress-label" v-if="label">
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  strokeLinecap?: 'round' | 'square' | 'butt'
  label?: string
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  strokeWidth: 8,
  color: '#007AFF',
  backgroundColor: '#F2F2F7',
  strokeLinecap: 'round',
  animated: true
})

// 计算圆环参数
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

// 计算进度偏移
const strokeDashoffset = computed(() => {
  const progress = Math.max(0, Math.min(100, props.progress))
  return circumference.value - (progress / 100) * circumference.value
})
</script>

<style lang="scss" scoped>
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring-svg {
  position: absolute;
  top: 0;
  left: 0;
}

.progress-ring-background {
  opacity: 0.3;
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  .progress-ring[data-animated="false"] & {
    transition: none;
  }
}

.progress-ring-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 1;
  
  .progress-percentage {
    font-size: 18px;
    font-weight: 700;
    color: var(--ios-gray-dark, #1c1c1e);
    line-height: 1;
    margin-bottom: 2px;
  }
  
  .progress-label {
    font-size: 12px;
    color: var(--ios-gray, #8e8e93);
    line-height: 1;
  }
}

// 响应式调整
@media (max-width: 375px) {
  .progress-ring-content {
    .progress-percentage {
      font-size: 16px;
    }
    
    .progress-label {
      font-size: 11px;
    }
  }
}
</style>