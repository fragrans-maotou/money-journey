<template>
  <div class="chart-view">
    <!-- 图表类型切换 -->
    <div class="chart-tabs">
      <button
        v-for="type in chartTypes"
        :key="type.value"
        :class="['chart-tab', { active: currentChartType === type.value }]"
        @click="setChartType(type.value)"
      >
        <span class="chart-tab-icon">{{ type.icon }}</span>
        <span class="chart-tab-label">{{ type.label }}</span>
      </button>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <div v-if="isLoading" class="chart-loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="chart-error">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="retry-button" @click="$emit('retry')">重试</button>
      </div>

      <div v-else-if="!hasData" class="chart-empty">
        <span class="empty-icon">📊</span>
        <p>暂无数据</p>
        <p class="empty-subtitle">开始记录消费后，这里将显示统计图表</p>
      </div>

      <div v-else class="chart-content">
        <!-- 分类饼图 -->
        <div v-if="currentChartType === 'pie'" class="pie-chart">
          <svg :width="chartSize" :height="chartSize" class="pie-svg">
            <g :transform="`translate(${chartSize / 2}, ${chartSize / 2})`">
              <!-- 饼图扇形 -->
              <path
                v-for="(segment, index) in pieSegments"
                :key="segment.categoryId"
                :d="segment.path"
                :fill="segment.color"
                :class="['pie-segment', { active: hoveredSegment === index }]"
                @mouseenter="hoveredSegment = index"
                @mouseleave="hoveredSegment = null"
                @click="$emit('segment-click', segment)"
              />
              
              <!-- 中心文字 -->
              <text class="pie-center-text" text-anchor="middle" dy="0.35em">
                <tspan class="pie-total-label" x="0" dy="-0.5em">总消费</tspan>
                <tspan class="pie-total-amount" x="0" dy="1.2em">¥{{ formatAmount(totalAmount) }}</tspan>
              </text>
            </g>
          </svg>

          <!-- 图例 -->
          <div class="chart-legend">
            <div
              v-for="(item, index) in categoryBreakdown"
              :key="item.categoryId"
              :class="['legend-item', { active: hoveredSegment === index }]"
              @mouseenter="hoveredSegment = index"
              @mouseleave="hoveredSegment = null"
              @click="$emit('legend-click', item)"
            >
              <div class="legend-color" :style="{ backgroundColor: getCategoryColor(item.categoryId) }"></div>
              <div class="legend-content">
                <div class="legend-name">{{ item.categoryName }}</div>
                <div class="legend-value">
                  <span class="legend-amount">¥{{ formatAmount(item.amount) }}</span>
                  <span class="legend-percentage">{{ item.percentage.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势折线图 -->
        <div v-if="currentChartType === 'line'" class="line-chart">
          <svg :width="chartWidth" :height="chartHeight" class="line-svg">
            <!-- 网格线 -->
            <g class="grid">
              <!-- 水平网格线 -->
              <line
                v-for="y in yGridLines"
                :key="`h-${y}`"
                :x1="padding.left"
                :y1="y"
                :x2="chartWidth - padding.right"
                :y2="y"
                class="grid-line"
              />
              <!-- 垂直网格线 -->
              <line
                v-for="x in xGridLines"
                :key="`v-${x}`"
                :x1="x"
                :y1="padding.top"
                :x2="x"
                :y2="chartHeight - padding.bottom"
                class="grid-line"
              />
            </g>

            <!-- Y轴标签 -->
            <g class="y-axis">
              <text
                v-for="(label, index) in yAxisLabels"
                :key="`y-${index}`"
                :x="padding.left - 10"
                :y="label.y"
                class="axis-label"
                text-anchor="end"
                dy="0.35em"
              >
                ¥{{ formatAmount(label.value) }}
              </text>
            </g>

            <!-- X轴标签 -->
            <g class="x-axis">
              <text
                v-for="(label, index) in xAxisLabels"
                :key="`x-${index}`"
                :x="label.x"
                :y="chartHeight - padding.bottom + 20"
                class="axis-label"
                text-anchor="middle"
              >
                {{ label.text }}
              </text>
            </g>

            <!-- 趋势线 -->
            <path
              :d="trendLinePath"
              class="trend-line"
              fill="none"
              stroke="#007AFF"
              stroke-width="2"
            />

            <!-- 数据点 -->
            <circle
              v-for="(point, index) in trendPoints"
              :key="`point-${index}`"
              :cx="point.x"
              :cy="point.y"
              :r="hoveredPoint === index ? 6 : 4"
              :class="['trend-point', { active: hoveredPoint === index }]"
              @mouseenter="hoveredPoint = index; showTooltip(point)"
              @mouseleave="hoveredPoint = null; hideTooltip()"
            />
          </svg>

          <!-- 工具提示 -->
          <div
            v-if="tooltip.visible"
            class="chart-tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            <div class="tooltip-date">{{ tooltip.date }}</div>
            <div class="tooltip-amount">¥{{ formatAmount(tooltip.amount) }}</div>
          </div>
        </div>

        <!-- 柱状图 -->
        <div v-if="currentChartType === 'bar'" class="bar-chart">
          <svg :width="chartWidth" :height="chartHeight" class="bar-svg">
            <!-- 网格线 -->
            <g class="grid">
              <line
                v-for="y in yGridLines"
                :key="`h-${y}`"
                :x1="padding.left"
                :y1="y"
                :x2="chartWidth - padding.right"
                :y2="y"
                class="grid-line"
              />
            </g>

            <!-- Y轴标签 -->
            <g class="y-axis">
              <text
                v-for="(label, index) in yAxisLabels"
                :key="`y-${index}`"
                :x="padding.left - 10"
                :y="label.y"
                class="axis-label"
                text-anchor="end"
                dy="0.35em"
              >
                ¥{{ formatAmount(label.value) }}
              </text>
            </g>

            <!-- 柱状图 -->
            <rect
              v-for="(bar, index) in barData"
              :key="`bar-${index}`"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :class="['bar', { active: hoveredBar === index }]"
              :fill="getCategoryColor(bar.categoryId)"
              @mouseenter="hoveredBar = index; showBarTooltip(bar)"
              @mouseleave="hoveredBar = null; hideTooltip()"
              @click="$emit('bar-click', bar)"
            />

            <!-- X轴标签 -->
            <g class="x-axis">
              <text
                v-for="(bar, index) in barData"
                :key="`x-${index}`"
                :x="bar.x + bar.width / 2"
                :y="chartHeight - padding.bottom + 20"
                class="axis-label bar-label"
                text-anchor="middle"
              >
                {{ bar.categoryName }}
              </text>
            </g>
          </svg>

          <!-- 工具提示 -->
          <div
            v-if="tooltip.visible"
            class="chart-tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            <div class="tooltip-category">{{ tooltip.categoryName }}</div>
            <div class="tooltip-amount">¥{{ formatAmount(tooltip.amount) }}</div>
            <div class="tooltip-percentage">{{ tooltip.percentage }}%</div>
          </div>
        </div>

        <!-- 消费热力图 -->
        <div v-if="currentChartType === 'heatmap'" class="heatmap-chart">
          <div class="heatmap-header">
            <h4 class="heatmap-title">消费热力图</h4>
            <p class="heatmap-subtitle">颜色越深表示消费越多</p>
          </div>
          
          <div class="heatmap-grid">
            <div class="heatmap-days">
              <div class="day-label">日</div>
              <div class="day-label">一</div>
              <div class="day-label">二</div>
              <div class="day-label">三</div>
              <div class="day-label">四</div>
              <div class="day-label">五</div>
              <div class="day-label">六</div>
            </div>
            
            <div class="heatmap-weeks">
              <div
                v-for="(week, weekIndex) in heatmapData"
                :key="`week-${weekIndex}`"
                class="heatmap-week"
              >
                <div
                  v-for="(day, dayIndex) in week"
                  :key="`day-${weekIndex}-${dayIndex}`"
                  :class="['heatmap-cell', { 'has-data': day.amount > 0 }]"
                  :style="{ 
                    backgroundColor: getHeatmapColor(day.amount, maxDailyAmount),
                    opacity: day.amount > 0 ? 1 : 0.3
                  }"
                  @mouseenter="showHeatmapTooltip(day, $event)"
                  @mouseleave="hideTooltip()"
                >
                  <span class="cell-date">{{ day.date.getDate() }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="heatmap-legend">
            <span class="legend-label">少</span>
            <div class="legend-gradient">
              <div
                v-for="i in 5"
                :key="i"
                class="legend-step"
                :style="{ backgroundColor: getHeatmapColor((i / 5) * maxDailyAmount, maxDailyAmount) }"
              ></div>
            </div>
            <span class="legend-label">多</span>
          </div>

          <!-- 热力图工具提示 -->
          <div
            v-if="tooltip.visible"
            class="chart-tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            <div class="tooltip-date">{{ tooltip.date }}</div>
            <div class="tooltip-amount">¥{{ formatAmount(tooltip.amount) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { CategoryStat, DailyTrendPoint, Category } from '@/types'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  categoryBreakdown: CategoryStat[]
  dailyTrend: DailyTrendPoint[]
  categories: Category[]
  isLoading?: boolean
  error?: string | null
  chartType?: 'pie' | 'line' | 'bar'
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  chartType: 'pie'
})

defineEmits<{
  'segment-click': [segment: any]
  'legend-click': [item: CategoryStat]
  'bar-click': [bar: any]
  'retry': []
}>()

// ============================================================================
// Reactive State
// ============================================================================

const currentChartType = ref<'pie' | 'line' | 'bar' | 'heatmap'>(props.chartType)
const hoveredSegment = ref<number | null>(null)
const hoveredPoint = ref<number | null>(null)
const hoveredBar = ref<number | null>(null)

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  amount: 0,
  categoryName: '',
  percentage: ''
})

// ============================================================================
// Chart Configuration
// ============================================================================

const chartTypes = [
  { value: 'pie', label: '分类占比', icon: '🥧' },
  { value: 'line', label: '消费趋势', icon: '📈' },
  { value: 'bar', label: '分类对比', icon: '📊' },
  { value: 'heatmap', label: '消费热力图', icon: '🔥' }
]

const chartSize = 280
const chartWidth = 360
const chartHeight = 240
const padding = { top: 20, right: 20, bottom: 40, left: 60 }

// ============================================================================
// Computed Properties
// ============================================================================

const hasData = computed(() => {
  return props.categoryBreakdown.length > 0 || props.dailyTrend.length > 0
})

const totalAmount = computed(() => {
  return props.categoryBreakdown.reduce((sum, item) => sum + item.amount, 0)
})

// 饼图扇形数据
const pieSegments = computed(() => {
  if (props.categoryBreakdown.length === 0) return []

  const total = totalAmount.value
  let currentAngle = -Math.PI / 2 // 从顶部开始

  return props.categoryBreakdown.map((item, index) => {
    const percentage = item.amount / total
    const angle = percentage * 2 * Math.PI
    const radius = chartSize / 2 - 20

    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const x1 = Math.cos(startAngle) * radius
    const y1 = Math.sin(startAngle) * radius
    const x2 = Math.cos(endAngle) * radius
    const y2 = Math.sin(endAngle) * radius

    const largeArcFlag = angle > Math.PI ? 1 : 0

    const path = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ')

    currentAngle += angle

    return {
      ...item,
      path,
      color: getCategoryColor(item.categoryId),
      startAngle,
      endAngle,
      percentage: item.percentage
    }
  })
})

// 趋势线数据
const trendPoints = computed(() => {
  if (props.dailyTrend.length === 0) return []

  const maxAmount = Math.max(...props.dailyTrend.map(point => point.amount))
  const minAmount = Math.min(...props.dailyTrend.map(point => point.amount))
  const range = maxAmount - minAmount || 1

  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  return props.dailyTrend.map((point, index) => {
    const x = padding.left + (index / (props.dailyTrend.length - 1)) * plotWidth
    const y = padding.top + plotHeight - ((point.amount - minAmount) / range) * plotHeight

    return {
      x,
      y,
      amount: point.amount,
      date: point.date,
      index
    }
  })
})

const trendLinePath = computed(() => {
  if (trendPoints.value.length === 0) return ''

  return trendPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

// 柱状图数据
const barData = computed(() => {
  if (props.categoryBreakdown.length === 0) return []

  const maxAmount = Math.max(...props.categoryBreakdown.map(item => item.amount))
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom
  const barWidth = plotWidth / props.categoryBreakdown.length * 0.8
  const barSpacing = plotWidth / props.categoryBreakdown.length * 0.2

  return props.categoryBreakdown.map((item, index) => {
    const height = (item.amount / maxAmount) * plotHeight
    const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2
    const y = padding.top + plotHeight - height

    return {
      ...item,
      x,
      y,
      width: barWidth,
      height
    }
  })
})

// 网格线和轴标签
const yGridLines = computed(() => {
  const lines = []
  const maxAmount = currentChartType.value === 'line' 
    ? Math.max(...props.dailyTrend.map(point => point.amount))
    : Math.max(...props.categoryBreakdown.map(item => item.amount))
  
  const plotHeight = chartHeight - padding.top - padding.bottom
  
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (i / 5) * plotHeight
    lines.push(y)
  }
  
  return lines
})

const xGridLines = computed(() => {
  if (currentChartType.value !== 'line') return []
  
  const lines = []
  const plotWidth = chartWidth - padding.left - padding.right
  const pointCount = props.dailyTrend.length
  
  for (let i = 0; i < pointCount; i += Math.ceil(pointCount / 6)) {
    const x = padding.left + (i / (pointCount - 1)) * plotWidth
    lines.push(x)
  }
  
  return lines
})

const yAxisLabels = computed(() => {
  const labels = []
  const maxAmount = currentChartType.value === 'line' 
    ? Math.max(...props.dailyTrend.map(point => point.amount))
    : Math.max(...props.categoryBreakdown.map(item => item.amount))
  
  const plotHeight = chartHeight - padding.top - padding.bottom
  
  for (let i = 0; i <= 5; i++) {
    const value = (maxAmount / 5) * (5 - i)
    const y = padding.top + (i / 5) * plotHeight
    labels.push({ value, y })
  }
  
  return labels
})

const xAxisLabels = computed(() => {
  if (currentChartType.value !== 'line') return []
  
  const labels = []
  const plotWidth = chartWidth - padding.left - padding.right
  const pointCount = props.dailyTrend.length
  
  for (let i = 0; i < pointCount; i += Math.ceil(pointCount / 6)) {
    const point = props.dailyTrend[i]
    if (point) {
      const x = padding.left + (i / (pointCount - 1)) * plotWidth
      const date = new Date(point.date)
      const text = `${date.getMonth() + 1}/${date.getDate()}`
      labels.push({ x, text })
    }
  }
  
  return labels
})

// 热力图数据
const heatmapData = computed(() => {
  if (props.dailyTrend.length === 0) return []

  const weeks: Array<Array<{ date: Date; amount: number }>> = []
  let currentWeek: Array<{ date: Date; amount: number }> = []

  // 获取第一天是星期几
  const firstDay = props.dailyTrend[0].date
  const firstDayOfWeek = firstDay.getDay()

  // 填充第一周前面的空白天数
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDate = new Date(firstDay)
    emptyDate.setDate(firstDay.getDate() - (firstDayOfWeek - i))
    currentWeek.push({ date: emptyDate, amount: 0 })
  }

  // 填充实际数据
  props.dailyTrend.forEach(point => {
    currentWeek.push({ date: point.date, amount: point.amount })

    // 如果当前周已满7天，开始新的一周
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  // 填充最后一周剩余的空白天数
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    const lastDate = currentWeek[currentWeek.length - 1].date
    const nextDate = new Date(lastDate)
    nextDate.setDate(lastDate.getDate() + 1)
    currentWeek.push({ date: nextDate, amount: 0 })
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
})

const maxDailyAmount = computed(() => {
  return Math.max(...props.dailyTrend.map(point => point.amount), 1)
})

// ============================================================================
// Methods
// ============================================================================

const setChartType = (type: string) => {
  currentChartType.value = type as 'pie' | 'line' | 'bar' | 'heatmap'
}

const getCategoryColor = (categoryId: string): string => {
  const category = props.categories.find(cat => cat.id === categoryId)
  return category?.color || '#95A5A6'
}

const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'k'
  }
  return amount.toFixed(0)
}

const showTooltip = (point: any) => {
  const rect = document.querySelector('.line-chart')?.getBoundingClientRect()
  if (rect) {
    tooltip.value = {
      visible: true,
      x: point.x + rect.left,
      y: point.y + rect.top - 40,
      date: new Date(point.date).toLocaleDateString(),
      amount: point.amount,
      categoryName: '',
      percentage: ''
    }
  }
}

const showBarTooltip = (bar: any) => {
  const rect = document.querySelector('.bar-chart')?.getBoundingClientRect()
  if (rect) {
    tooltip.value = {
      visible: true,
      x: bar.x + bar.width / 2 + rect.left,
      y: bar.y + rect.top - 40,
      date: '',
      amount: bar.amount,
      categoryName: bar.categoryName,
      percentage: bar.percentage.toFixed(1)
    }
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const getHeatmapColor = (amount: number, maxAmount: number): string => {
  if (amount === 0) return '#F2F2F7'
  
  const intensity = amount / maxAmount
  const baseColor = [0, 122, 255] // iOS blue
  const alpha = Math.max(0.1, intensity)
  
  return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`
}

const showHeatmapTooltip = (day: { date: Date; amount: number }, event: MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltip.value = {
    visible: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 40,
    date: day.date.toLocaleDateString(),
    amount: day.amount,
    categoryName: '',
    percentage: ''
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.chartType, (newType) => {
  currentChartType.value = newType
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  // 添加全局点击事件监听器来隐藏工具提示
  document.addEventListener('click', hideTooltip)
})

onUnmounted(() => {
  document.removeEventListener('click', hideTooltip)
})
</script>

<style scoped lang="scss">
.chart-view {
  background: white;
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: #F2F2F7;
  border-radius: 12px;
}

.chart-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #8E8E93;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-direction: column;
  &.active {
    background: white;
    color: #007AFF;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: #007AFF;
  }
}

.chart-tab-icon {
  font-size: 16px;
}

.chart-container {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-loading,
.chart-error,
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8E8E93;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #F2F2F7;
  border-top: 2px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.retry-button {
  padding: 8px 16px;
  border: 1px solid #007AFF;
  border-radius: 8px;
  background: transparent;
  color: #007AFF;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #007AFF;
    color: white;
  }
}

.empty-subtitle {
  font-size: 12px;
  opacity: 0.7;
}

.chart-content {
  width: 100%;
}

// 饼图样式
.pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.pie-svg {
  display: block;
}

.pie-segment {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    filter: brightness(1.1);
    transform: scale(1.02);
  }
}

.pie-center-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pie-total-label {
  font-size: 12px;
  fill: #8E8E93;
}

.pie-total-amount {
  font-size: 18px;
  font-weight: 600;
  fill: #1C1C1E;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    background: #F2F2F7;
  }
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-name {
  font-size: 14px;
  color: #1C1C1E;
}

.legend-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.legend-percentage {
  font-size: 12px;
  color: #8E8E93;
}

// 折线图和柱状图样式
.line-chart,
.bar-chart {
  position: relative;
}

.line-svg,
.bar-svg {
  display: block;
  width: 100%;
}

.grid-line {
  stroke: #F2F2F7;
  stroke-width: 1;
}

.axis-label {
  font-size: 10px;
  fill: #8E8E93;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.bar-label {
  font-size: 9px;
  transform: rotate(-45deg);
  transform-origin: center;
}

.trend-line {
  stroke: #007AFF;
  stroke-width: 2;
  fill: none;
}

.trend-point {
  fill: #007AFF;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    fill: #0056CC;
  }
}

.bar {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    filter: brightness(1.1);
  }
}

.chart-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.tooltip-date,
.tooltip-category {
  font-weight: 500;
  margin-bottom: 2px;
}

.tooltip-amount {
  font-weight: 600;
  color: #34C759;
}

.tooltip-percentage {
  font-size: 11px;
  opacity: 0.8;
}

// 热力图样式
.heatmap-chart {
  padding: 16px;
}

.heatmap-header {
  text-align: center;
  margin-bottom: 20px;
}

.heatmap-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 4px 0;
}

.heatmap-subtitle {
  font-size: 12px;
  color: #8E8E93;
  margin: 0;
}

.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.heatmap-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.day-label {
  font-size: 10px;
  color: #8E8E93;
  text-align: center;
  padding: 4px;
  font-weight: 500;
}

.heatmap-weeks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heatmap-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #E5E5EA;
  position: relative;

  &:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.has-data {
    border-color: rgba(0, 122, 255, 0.3);
  }
}

.cell-date {
  font-size: 8px;
  color: #1C1C1E;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.legend-label {
  font-size: 10px;
  color: #8E8E93;
}

.legend-gradient {
  display: flex;
  gap: 2px;
}

.legend-step {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid #E5E5EA;
}
</style>