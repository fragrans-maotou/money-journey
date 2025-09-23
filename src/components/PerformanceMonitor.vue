<template>
  <div 
    v-if="showMonitor && isDevelopment"
    class="performance-monitor"
    :class="{ 'performance-monitor--warning': isLowPerformance }"
  >
    <div class="performance-monitor-header">
      <span class="performance-monitor-title">性能监控</span>
      <button 
        class="performance-monitor-toggle"
        @click="toggleExpanded"
      >
        {{ isExpanded ? '−' : '+' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="performance-monitor-content">
      <div class="performance-metric">
        <span class="metric-label">FPS:</span>
        <span class="metric-value" :class="{ 'metric-value--warning': fps < 30 }">
          {{ fps }}
        </span>
      </div>
      
      <div class="performance-metric">
        <span class="metric-label">内存:</span>
        <span class="metric-value" :class="{ 'metric-value--warning': memoryUsage > 50 }">
          {{ memoryUsage }}%
        </span>
      </div>
      
      <div class="performance-metric">
        <span class="metric-label">渲染:</span>
        <span class="metric-value">{{ renderTime.toFixed(1) }}ms</span>
      </div>
      
      <div class="performance-metric">
        <span class="metric-label">设备:</span>
        <span class="metric-value">
          {{ deviceInfo.screenWidth }}×{{ deviceInfo.screenHeight }}
          {{ deviceInfo.isHighDPI ? '@2x' : '' }}
        </span>
      </div>
      
      <div class="performance-metric">
        <span class="metric-label">触摸目标:</span>
        <span class="metric-value">{{ touchTargetCount }}</span>
        <button 
          class="metric-action"
          @click="validateTargets"
        >
          验证
        </button>
      </div>
      
      <div v-if="touchIssues.length > 0" class="performance-issues">
        <div class="issues-title">触摸目标问题:</div>
        <ul class="issues-list">
          <li v-for="issue in touchIssues" :key="issue" class="issue-item">
            {{ issue }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePerformanceOptimization } from '../composables/usePerformanceOptimization'
import { useDeviceAdaptation } from '../composables/useDeviceAdaptation'
import { useTouchOptimization } from '../composables/useTouchOptimization'

interface Props {
  showMonitor?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showMonitor: true
})

const { performanceMetrics, startPerformanceMonitoring } = usePerformanceOptimization()
const { deviceInfo } = useDeviceAdaptation()
const { touchTargets, validateTouchTargets } = useTouchOptimization()

// Component state
const isExpanded = ref(false)
const touchIssues = ref<string[]>([])

// Computed properties
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')
const fps = computed(() => performanceMetrics.value.fps)
const memoryUsage = computed(() => performanceMetrics.value.memoryUsage)
const renderTime = computed(() => performanceMetrics.value.renderTime)
const isLowPerformance = computed(() => performanceMetrics.value.isLowPerformance)
const touchTargetCount = computed(() => touchTargets.value.size)

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const validateTargets = () => {
  touchIssues.value = validateTouchTargets()
}

// Lifecycle
onMounted(() => {
  if (isDevelopment.value && props.showMonitor) {
    startPerformanceMonitoring()
    
    // Initial validation
    setTimeout(() => {
      validateTargets()
    }, 1000)
  }
})
</script>

<style lang="scss" scoped>
.performance-monitor {
  position: fixed;
  top: env(safe-area-inset-top, 20px);
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  min-width: 120px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &--warning {
    background: rgba(255, 59, 48, 0.8);
  }
}

.performance-monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.performance-monitor-title {
  font-weight: bold;
  font-size: 11px;
}

.performance-monitor-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.performance-monitor-content {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 4px;
}

.performance-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  gap: 8px;
}

.metric-label {
  opacity: 0.8;
  font-size: 10px;
}

.metric-value {
  font-weight: bold;
  
  &--warning {
    color: #ff3b30;
  }
}

.metric-action {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 9px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.performance-issues {
  margin-top: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.issues-title {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #ff3b30;
}

.issues-list {
  margin: 0;
  padding-left: 12px;
  font-size: 9px;
}

.issue-item {
  margin-bottom: 2px;
  opacity: 0.9;
}
</style>