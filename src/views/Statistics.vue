<template>
  <div class="statistics-view">
    <!-- 导航栏 -->
    <div class="nav-bar">
      <h1 class="nav-title">统计分析</h1>
      <button class="period-selector" @click="showPeriodPicker = true">
        <span>{{ currentPeriodLabel }}</span>
        <span class="selector-arrow">▼</span>
      </button>
    </div>

    <!-- 时间段选择器 -->
    <div v-if="showPeriodPicker" class="period-picker-overlay" @click="showPeriodPicker = false">
      <div class="period-picker" @click.stop>
        <div class="picker-header">
          <h3>选择统计时间段</h3>
          <button class="close-button" @click="showPeriodPicker = false">✕</button>
        </div>
        
        <div class="picker-options">
          <button
            v-for="option in periodOptions"
            :key="option.value"
            :class="['picker-option', { active: currentPeriod === option.value }]"
            @click="selectPeriod(option.value as StatisticsPeriod)"
          >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-label">{{ option.label }}</span>
          </button>
        </div>

        <!-- 自定义时间范围 -->
        <div v-if="currentPeriod === 'custom'" class="custom-date-range">
          <div class="date-input-group">
            <label>开始日期</label>
            <input
              v-model="customStartDateStr"
              type="date"
              class="date-input"
              @change="updateCustomDateRange"
            />
          </div>
          <div class="date-input-group">
            <label>结束日期</label>
            <input
              v-model="customEndDateStr"
              type="date"
              class="date-input"
              @change="updateCustomDateRange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="statistics-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <div class="card-label">总消费</div>
            <div class="card-value">¥{{ formatAmount(currentStatistics.totalSpent) }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-label">消费笔数</div>
            <div class="card-value">{{ currentPeriodExpenses.length }}笔</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-label">日均消费</div>
            <div class="card-value">¥{{ formatAmount(averageDailySpending) }}</div>
          </div>
        </div>

        <div v-if="budgetAnalysis" class="overview-card">
          <div class="card-icon">🎯</div>
          <div class="card-content">
            <div class="card-label">预算达成率</div>
            <div class="card-value">{{ budgetAnalysis.achievementRate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- 预算分析（仅月度显示） -->
      <div v-if="budgetAnalysis && currentPeriod === 'month'" class="budget-analysis">
        <div class="section-header">
          <h2 class="section-title">预算执行情况</h2>
        </div>

        <div class="budget-progress">
          <div class="progress-header">
            <div class="progress-info">
              <span class="progress-label">预算进度</span>
              <span class="progress-value">{{ budgetAnalysis.achievementRate.toFixed(1) }}%</span>
            </div>
            <div class="progress-status" :class="budgetAnalysis.status">
              {{ budgetAnalysis.message }}
            </div>
          </div>

          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :class="budgetAnalysis.status"
              :style="{ width: Math.min(budgetAnalysis.achievementRate, 100) + '%' }"
            ></div>
            <div 
              v-if="budgetAnalysis.achievementRate > 100"
              class="progress-overflow"
              :style="{ width: (budgetAnalysis.achievementRate - 100) + '%' }"
            ></div>
          </div>

          <div class="progress-details">
            <div class="detail-item">
              <span class="detail-label">已消费</span>
              <span class="detail-value">¥{{ formatAmount(budgetAnalysis.totalSpent) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">剩余预算</span>
              <span class="detail-value">¥{{ formatAmount(budgetAnalysis.remainingBudget) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">剩余天数</span>
              <span class="detail-value">{{ budgetAnalysis.daysRemaining }}天</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">建议日消费</span>
              <span class="detail-value">¥{{ formatAmount(budgetAnalysis.recommendedDailySpend) }}</span>
            </div>
          </div>

          <!-- 增强的预算分析 -->
          <div class="enhanced-budget-analysis">
            <div class="analysis-row">
              <div class="analysis-item">
                <span class="analysis-label">预计月末消费</span>
                <span class="analysis-value" :class="budgetAnalysis.projectedMonthEnd > budgetAnalysis.totalBudget ? 'over-budget' : 'normal'">
                  ¥{{ formatAmount(budgetAnalysis.projectedMonthEnd) }}
                </span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">风险等级</span>
                <span class="risk-badge" :class="budgetAnalysis.riskLevel">
                  {{ getRiskLevelText(budgetAnalysis.riskLevel) }}
                </span>
              </div>
            </div>
            
            <div v-if="budgetAnalysis.savingsOpportunity > 0" class="savings-opportunity">
              <span class="savings-icon">💡</span>
              <div class="savings-content">
                <span class="savings-title">节省机会</span>
                <span class="savings-amount">可节省 ¥{{ formatAmount(budgetAnalysis.savingsOpportunity) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表展示 -->
      <div class="chart-section">
        <div class="section-header">
          <h2 class="section-title">消费分析</h2>
        </div>

        <ChartView
          :category-breakdown="categoryBreakdown"
          :daily-trend="dailyTrend"
          :categories="[...categories]"
          :is-loading="isLoading"
          :error="error"
          @segment-click="handleSegmentClick"
          @legend-click="handleLegendClick"
          @bar-click="handleBarClick"
          @retry="loadStatistics"
        />
      </div>

      <!-- 分类排行榜 -->
      <div class="category-ranking">
        <div class="section-header">
          <h2 class="section-title">消费排行</h2>
          <span class="section-subtitle">按分类统计</span>
        </div>

        <div v-if="categoryBreakdown.length === 0" class="empty-state">
          <span class="empty-icon">📊</span>
          <p>暂无消费数据</p>
        </div>

        <div v-else class="ranking-list">
          <div
            v-for="(item, index) in categoryBreakdown"
            :key="item.categoryId"
            class="ranking-item"
            @click="handleCategoryClick(item)"
          >
            <div class="ranking-position">{{ index + 1 }}</div>
            <div class="ranking-category">
              <div class="category-info">
                <span class="category-icon">{{ getCategoryIcon(item.categoryId) }}</span>
                <span class="category-name">{{ item.categoryName }}</span>
              </div>
              <div class="category-stats">
                <span class="category-amount">¥{{ formatAmount(item.amount) }}</span>
                <span class="category-percentage">{{ item.percentage.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="ranking-bar">
              <div 
                class="bar-fill" 
                :style="{ 
                  width: item.percentage + '%',
                  backgroundColor: getCategoryColor(item.categoryId)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势分析 -->
      <div class="trend-analysis">
        <div class="section-header">
          <h2 class="section-title">趋势分析</h2>
        </div>

        <div v-if="trendAnalysis" class="trend-summary">
          <div class="trend-card">
            <div class="trend-icon" :class="trendAnalysis.direction">
              {{ getTrendIcon(trendAnalysis.direction) }}
            </div>
            <div class="trend-content">
              <div class="trend-label">消费趋势</div>
              <div class="trend-description">{{ getTrendDescription(trendAnalysis.direction) }}</div>
            </div>
          </div>

          <div class="trend-stats">
            <div class="stat-item">
              <span class="stat-label">日均消费</span>
              <span class="stat-value">¥{{ formatAmount(trendAnalysis.averageDaily) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最高单日</span>
              <span class="stat-value">¥{{ formatAmount(trendAnalysis.maxDaily) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最低单日</span>
              <span class="stat-value">¥{{ formatAmount(trendAnalysis.minDaily) }}</span>
            </div>
          </div>

          <!-- 增强的趋势分析 -->
          <div class="enhanced-trend-analysis">
            <div class="trend-comparison">
              <div class="trend-period">
                <span class="period-label">前半段平均</span>
                <span class="period-value">¥{{ formatAmount(trendAnalysis.firstHalfAverage) }}</span>
              </div>
              <div class="trend-arrow">
                <span v-if="trendAnalysis.secondHalfAverage > trendAnalysis.firstHalfAverage" class="arrow-up">↗</span>
                <span v-else-if="trendAnalysis.secondHalfAverage < trendAnalysis.firstHalfAverage" class="arrow-down">↘</span>
                <span v-else class="arrow-stable">→</span>
              </div>
              <div class="trend-period">
                <span class="period-label">后半段平均</span>
                <span class="period-value">¥{{ formatAmount(trendAnalysis.secondHalfAverage) }}</span>
              </div>
            </div>

            <div class="weekday-weekend-comparison">
              <div class="comparison-item">
                <span class="comparison-label">工作日平均</span>
                <span class="comparison-value">¥{{ formatAmount(trendAnalysis.weekdayAverage) }}</span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">周末平均</span>
                <span class="comparison-value">¥{{ formatAmount(trendAnalysis.weekendAverage) }}</span>
              </div>
            </div>

            <div v-if="Math.abs(trendAnalysis.momentum) > 10" class="momentum-indicator">
              <span class="momentum-icon">{{ trendAnalysis.momentum > 0 ? '📈' : '📉' }}</span>
              <span class="momentum-text">
                最近消费{{ trendAnalysis.momentum > 0 ? '加速' : '放缓' }}，
                动量{{ Math.abs(trendAnalysis.momentum).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史对比（仅月度显示） -->
      <div v-if="historicalComparison && currentPeriod === 'month'" class="historical-comparison">
        <div class="section-header">
          <h2 class="section-title">历史对比</h2>
          <span class="section-subtitle">与上月同期对比</span>
        </div>

        <div class="comparison-summary">
          <div class="comparison-card">
            <div class="comparison-period">
              <div class="period-label">本月</div>
              <div class="period-amount">¥{{ formatAmount(historicalComparison.thisMonth.total) }}</div>
              <div class="period-count">{{ historicalComparison.thisMonth.count }}笔</div>
            </div>
            
            <div class="comparison-arrow">
              <span v-if="historicalComparison.change.trend === 'increase'" class="arrow-up">↗</span>
              <span v-else-if="historicalComparison.change.trend === 'decrease'" class="arrow-down">↘</span>
              <span v-else class="arrow-stable">→</span>
            </div>
            
            <div class="comparison-period">
              <div class="period-label">上月</div>
              <div class="period-amount">¥{{ formatAmount(historicalComparison.lastMonth.total) }}</div>
              <div class="period-count">{{ historicalComparison.lastMonth.count }}笔</div>
            </div>
          </div>

          <div class="comparison-change">
            <div class="change-amount" :class="historicalComparison.change.trend">
              {{ historicalComparison.change.amount >= 0 ? '+' : '' }}¥{{ formatAmount(Math.abs(historicalComparison.change.amount)) }}
            </div>
            <div class="change-percentage" :class="historicalComparison.change.trend">
              {{ historicalComparison.change.percentage >= 0 ? '+' : '' }}{{ historicalComparison.change.percentage.toFixed(1) }}%
            </div>
          </div>
        </div>

        <!-- 详细对比数据 -->
        <div class="detailed-comparison">
          <div class="comparison-metrics">
            <div class="metric-item">
              <span class="metric-label">日均消费对比</span>
              <div class="metric-values">
                <span class="current-value">¥{{ formatAmount(historicalComparison.thisMonth.averageDaily) }}</span>
                <span class="vs-text">vs</span>
                <span class="previous-value">¥{{ formatAmount(historicalComparison.lastMonth.averageDaily) }}</span>
              </div>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">最高单日消费</span>
              <div class="metric-values">
                <span class="current-value">¥{{ formatAmount(historicalComparison.thisMonth.maxDaily) }}</span>
                <span class="vs-text">vs</span>
                <span class="previous-value">¥{{ formatAmount(historicalComparison.lastMonth.maxDaily) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预算对比（如果有预算数据） -->
        <div v-if="historicalComparison.budgetComparison" class="budget-comparison">
          <h3 class="comparison-subtitle">预算执行对比</h3>
          <div class="budget-comparison-card">
            <div class="budget-metric">
              <span class="budget-label">本月预算达成率</span>
              <span class="budget-value" :class="getBudgetStatusClass(historicalComparison.budgetComparison.thisMonthAchievement)">
                {{ historicalComparison.budgetComparison.thisMonthAchievement.toFixed(1) }}%
              </span>
            </div>
            <div class="budget-metric">
              <span class="budget-label">上月预算达成率</span>
              <span class="budget-value" :class="getBudgetStatusClass(historicalComparison.budgetComparison.lastMonthAchievement)">
                {{ historicalComparison.budgetComparison.lastMonthAchievement.toFixed(1) }}%
              </span>
            </div>
            <div class="budget-change">
              <span class="change-label">达成率变化</span>
              <span class="change-value" :class="historicalComparison.budgetComparison.achievementChange >= 0 ? 'increase' : 'decrease'">
                {{ historicalComparison.budgetComparison.achievementChange >= 0 ? '+' : '' }}{{ historicalComparison.budgetComparison.achievementChange.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 分类对比 -->
        <div v-if="historicalComparison.categoryComparison.length > 0" class="category-comparison">
          <h3 class="comparison-subtitle">分类变化</h3>
          <div class="comparison-list">
            <div
              v-for="item in historicalComparison.categoryComparison.slice(0, 5)"
              :key="item.categoryId"
              class="comparison-item"
            >
              <div class="comparison-category">
                <span class="category-icon">{{ getCategoryIcon(item.categoryId) }}</span>
                <span class="category-name">{{ item.categoryName }}</span>
              </div>
              <div class="comparison-values">
                <span class="value-change" :class="item.change >= 0 ? 'increase' : 'decrease'">
                  {{ item.change >= 0 ? '+' : '' }}¥{{ formatAmount(Math.abs(item.change)) }}
                </span>
                <span class="percentage-change" :class="item.changePercentage >= 0 ? 'increase' : 'decrease'">
                  {{ item.changePercentage >= 0 ? '+' : '' }}{{ item.changePercentage.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStatistics } from '@/composables/useStatistics'
import { useExpense } from '@/composables/useExpense'
import ChartView from '@/components/ChartView.vue'
import type { CategoryStat, StatisticsPeriod } from '@/types'

// ============================================================================
// Composables
// ============================================================================

const {
  currentPeriod,
  currentDateRange,
  currentPeriodExpenses,
  categoryBreakdown,
  dailyTrend,
  currentStatistics,
  budgetAnalysis,
  historicalComparison,
  isLoading,
  error,
  setPeriod,
  setCustomDateRange,
  getTrendAnalysis,
  clearError
} = useStatistics()

const { categories, getCategoryById } = useExpense()

// ============================================================================
// Reactive State
// ============================================================================

const showPeriodPicker = ref(false)
const customStartDateStr = ref('')
const customEndDateStr = ref('')

// ============================================================================
// Computed Properties
// ============================================================================

const currentPeriodLabel = computed(() => {
  switch (currentPeriod.value) {
    case 'week':
      return '本周'
    case 'month':
      return '本月'
    case 'custom':
      const start = currentDateRange.value.startDate
      const end = currentDateRange.value.endDate
      return `${formatDate(start)} - ${formatDate(end)}`
    default:
      return '本月'
  }
})

const periodOptions = [
  { value: 'week', label: '本周', icon: '📅' },
  { value: 'month', label: '本月', icon: '📆' },
  { value: 'custom', label: '自定义', icon: '🗓️' }
]

const averageDailySpending = computed(() => {
  const expenses = currentPeriodExpenses.value
  if (expenses.length === 0) return 0

  const { startDate, endDate } = currentDateRange.value
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  return totalSpent / daysDiff
})

const trendAnalysis = computed(() => {
  return getTrendAnalysis()
})

// ============================================================================
// Methods
// ============================================================================

const selectPeriod = (period: StatisticsPeriod) => {
  setPeriod(period)
  
  if (period === 'custom') {
    // 设置默认的自定义日期范围（最近30天）
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29)
    
    customStartDateStr.value = formatDateInput(start)
    customEndDateStr.value = formatDateInput(end)
    
    setCustomDateRange(start, end)
  }
  
  showPeriodPicker.value = false
}

const updateCustomDateRange = () => {
  if (customStartDateStr.value && customEndDateStr.value) {
    const startDate = new Date(customStartDateStr.value)
    const endDate = new Date(customEndDateStr.value)
    
    if (startDate <= endDate) {
      setCustomDateRange(startDate, endDate)
    }
  }
}

const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'k'
  }
  return amount.toFixed(0)
}

const formatDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatDateInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const getCategoryIcon = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.icon || '📝'
}

const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.color || '#95A5A6'
}

const getTrendIcon = (direction: string): string => {
  switch (direction) {
    case 'increasing':
      return '📈'
    case 'decreasing':
      return '📉'
    default:
      return '📊'
  }
}

const getTrendDescription = (direction: string): string => {
  switch (direction) {
    case 'increasing':
      return '消费呈上升趋势'
    case 'decreasing':
      return '消费呈下降趋势'
    default:
      return '消费相对稳定'
  }
}

const getBudgetStatusClass = (achievementRate: number): string => {
  if (achievementRate > 100) return 'over-budget'
  if (achievementRate > 90) return 'warning'
  if (achievementRate > 70) return 'normal'
  return 'good'
}

const getRiskLevelText = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'high':
      return '高风险'
    case 'medium':
      return '中风险'
    case 'low':
      return '低风险'
    default:
      return '正常'
  }
}

const loadStatistics = () => {
  clearError()
  // 重新加载统计数据的逻辑已经通过响应式系统自动处理
}

// ============================================================================
// Event Handlers
// ============================================================================

const handleSegmentClick = (segment: any) => {
  console.log('Segment clicked:', segment)
  // 可以导航到该分类的详细页面
}

const handleLegendClick = (item: CategoryStat) => {
  console.log('Legend clicked:', item)
  // 可以导航到该分类的详细页面
}

const handleBarClick = (bar: any) => {
  console.log('Bar clicked:', bar)
  // 可以导航到该分类的详细页面
}

const handleCategoryClick = (item: CategoryStat) => {
  console.log('Category clicked:', item)
  // 可以导航到该分类的详细页面或显示更多信息
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  // 初始化自定义日期范围的默认值
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  
  customStartDateStr.value = formatDateInput(start)
  customEndDateStr.value = formatDateInput(end)
})

// ============================================================================
// Watchers
// ============================================================================

watch(showPeriodPicker, (show) => {
  if (show) {
    // 当显示选择器时，更新自定义日期的值
    if (currentPeriod.value === 'custom') {
      customStartDateStr.value = formatDateInput(currentDateRange.value.startDate)
      customEndDateStr.value = formatDateInput(currentDateRange.value.endDate)
    }
  }
})
</script>

<style scoped lang="scss">
.statistics-view {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 80px; // 为底部导航留出空间
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #E5E5EA;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0;
}

.period-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  background: white;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #F2F2F7;
  }
}

.selector-arrow {
  font-size: 10px;
  transition: transform 0.2s ease;
}

// 时间段选择器
.period-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.period-picker {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin: 20px;
  max-width: 320px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1C1C1E;
    margin: 0;
  }
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #F2F2F7;
  color: #8E8E93;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #E5E5EA;
  }
}

.picker-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.picker-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  background: white;
  color: #1C1C1E;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #F2F2F7;
  }

  &.active {
    border-color: #007AFF;
    background: #007AFF;
    color: white;
  }
}

.option-icon {
  font-size: 18px;
}

.custom-date-range {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #E5E5EA;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 14px;
    color: #8E8E93;
    font-weight: 500;
  }
}

.date-input {
  padding: 12px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  color: #1C1C1E;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
}

// 主要内容
.statistics-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 概览卡片
.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2F2F7;
  border-radius: 10px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
}

// 预算分析
.budget-analysis {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0;
}

.section-subtitle {
  font-size: 12px;
  color: #8E8E93;
}

.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 14px;
  color: #8E8E93;
}

.progress-value {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.progress-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;

  &.on_track {
    background: #E8F5E8;
    color: #34C759;
  }

  &.ahead {
    background: #FFF3E0;
    color: #FF9500;
  }

  &.behind {
    background: #E3F2FD;
    color: #007AFF;
  }

  &.over_budget {
    background: #FFEBEE;
    color: #FF3B30;
  }
}

.progress-bar {
  height: 8px;
  background: #F2F2F7;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;

  &.on_track {
    background: #34C759;
  }

  &.ahead {
    background: #FF9500;
  }

  &.behind {
    background: #007AFF;
  }

  &.over_budget {
    background: #FF3B30;
  }
}

.progress-overflow {
  position: absolute;
  top: 0;
  left: 100%;
  height: 100%;
  background: #FF3B30;
  opacity: 0.7;
}

.progress-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-label {
  font-size: 12px;
  color: #8E8E93;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

// 图表部分
.chart-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

// 分类排行榜
.category-ranking {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8E8E93;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: 12px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #F2F2F7;
  }
}

.ranking-position {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ranking-category {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

.category-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.category-percentage {
  font-size: 12px;
  color: #8E8E93;
}

.ranking-bar {
  width: 60px;
  height: 4px;
  background: #F2F2F7;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

// 趋势分析
.trend-analysis {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.trend-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F2F2F7;
  border-radius: 12px;
}

.trend-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;

  &.increasing {
    background: #E8F5E8;
  }

  &.decreasing {
    background: #FFEBEE;
  }

  &.stable {
    background: #E3F2FD;
  }
}

.trend-content {
  flex: 1;
}

.trend-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.trend-description {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

.trend-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #F2F2F7;
  border-radius: 8px;
}

.stat-label {
  font-size: 10px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

// 历史对比
.historical-comparison {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.comparison-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.comparison-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #F2F2F7;
  border-radius: 12px;
}

.comparison-period {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.period-label {
  font-size: 12px;
  color: #8E8E93;
}

.period-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.period-count {
  font-size: 10px;
  color: #8E8E93;
}

.comparison-arrow {
  font-size: 24px;
  
  .arrow-up {
    color: #FF3B30;
  }
  
  .arrow-down {
    color: #34C759;
  }
  
  .arrow-stable {
    color: #8E8E93;
  }
}

.comparison-change {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: #F2F2F7;
}

.change-amount {
  font-size: 16px;
  font-weight: 600;

  &.increase {
    color: #FF3B30;
  }

  &.decrease {
    color: #34C759;
  }

  &.stable {
    color: #8E8E93;
  }
}

.change-percentage {
  font-size: 12px;

  &.increase {
    color: #FF3B30;
  }

  &.decrease {
    color: #34C759;
  }

  &.stable {
    color: #8E8E93;
  }
}

.category-comparison {
  margin-top: 20px;
}

.comparison-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 12px 0;
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #F2F2F7;
  border-radius: 8px;
}

.comparison-category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comparison-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-change,
.percentage-change {
  font-size: 12px;
  font-weight: 500;

  &.increase {
    color: #FF3B30;
  }

  &.decrease {
    color: #34C759;
  }
}

// 详细对比数据
.detailed-comparison {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F2F2F7;
}

.comparison-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.metric-label {
  font-size: 12px;
  color: #8E8E93;
}

.metric-values {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-value {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.vs-text {
  font-size: 10px;
  color: #8E8E93;
}

.previous-value {
  font-size: 12px;
  color: #8E8E93;
}

// 预算对比
.budget-comparison {
  margin-top: 20px;
}

.budget-comparison-card {
  background: #F2F2F7;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-size: 12px;
  color: #8E8E93;
}

.budget-value {
  font-size: 14px;
  font-weight: 600;

  &.good {
    color: #34C759;
  }

  &.normal {
    color: #007AFF;
  }

  &.warning {
    color: #FF9500;
  }

  &.over-budget {
    color: #FF3B30;
  }
}

.budget-change {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #E5E5EA;
}

.change-label {
  font-size: 12px;
  color: #8E8E93;
}

.change-value {
  font-size: 14px;
  font-weight: 600;

  &.increase {
    color: #FF3B30;
  }

  &.decrease {
    color: #34C759;
  }
}

// 增强的预算分析
.enhanced-budget-analysis {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F2F2F7;
}

.analysis-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.analysis-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.analysis-label {
  font-size: 10px;
  color: #8E8E93;
  text-align: center;
}

.analysis-value {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;

  &.over-budget {
    color: #FF3B30;
  }

  &.normal {
    color: #34C759;
  }
}

.risk-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.low {
    background: #E8F5E8;
    color: #34C759;
  }

  &.medium {
    background: #FFF3E0;
    color: #FF9500;
  }

  &.high {
    background: #FFEBEE;
    color: #FF3B30;
  }
}

.savings-opportunity {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #E8F5E8;
  border-radius: 8px;
  margin-top: 8px;
}

.savings-icon {
  font-size: 16px;
}

.savings-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.savings-title {
  font-size: 10px;
  color: #34C759;
  font-weight: 500;
}

.savings-amount {
  font-size: 12px;
  color: #34C759;
  font-weight: 600;
}

// 增强的趋势分析
.enhanced-trend-analysis {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trend-comparison {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #F2F2F7;
  border-radius: 8px;
}

.trend-period {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.period-label {
  font-size: 10px;
  color: #8E8E93;
}

.period-value {
  font-size: 12px;
  font-weight: 600;
  color: #1C1C1E;
}

.trend-arrow {
  font-size: 20px;
  
  .arrow-up {
    color: #FF3B30;
  }
  
  .arrow-down {
    color: #34C759;
  }
  
  .arrow-stable {
    color: #8E8E93;
  }
}

.weekday-weekend-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #F2F2F7;
  border-radius: 6px;
}

.comparison-label {
  font-size: 10px;
  color: #8E8E93;
}

.comparison-value {
  font-size: 12px;
  font-weight: 600;
  color: #1C1C1E;
}

.momentum-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #E3F2FD;
  border-radius: 8px;
}

.momentum-icon {
  font-size: 16px;
}

.momentum-text {
  font-size: 11px;
  color: #007AFF;
  font-weight: 500;
}
</style>