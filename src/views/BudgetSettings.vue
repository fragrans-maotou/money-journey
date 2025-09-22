<template>
  <div class="budget-settings">
    <div class="settings-header">
      <h1>预算设置</h1>
      <p class="settings-subtitle">管理您的月度预算和预警设置</p>
    </div>
    
    <div class="settings-content">
      <!-- 月度预算设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h2>月度预算</h2>
          <p>设置您的月度预算金额</p>
        </div>
        
        <div class="budget-form">
          <AmountInput
            v-model="budgetAmount"
            placeholder="请输入预算金额"
            :error="budgetError"
            hint="建议根据您的月收入合理设置预算"
            :disabled="isLoading"
            @input="handleBudgetInput"
          />
          
          <div class="budget-period">
            <div class="period-info">
              <span class="period-label">预算周期</span>
              <span class="period-value">{{ formatPeriod(currentPeriod) }}</span>
            </div>
            <IOSButton
              variant="tertiary"
              size="small"
              @click="showPeriodPicker = true"
            >
              更改
            </IOSButton>
          </div>
        </div>
      </div>
      
      <!-- 预算预警设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h2>预算预警</h2>
          <p>当预算使用达到设定比例时提醒您</p>
        </div>
        
        <div class="warning-settings">
          <div class="warning-item">
            <div class="warning-info">
              <span class="warning-label">预警阈值</span>
              <span class="warning-desc">预算使用比例达到此值时提醒</span>
            </div>
            <div class="warning-control">
              <div class="threshold-slider">
                <input
                  v-model="warningThreshold"
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  class="slider"
                  :disabled="isLoading"
                  @input="handleThresholdChange"
                />
                <div class="threshold-value">{{ warningThreshold }}%</div>
              </div>
            </div>
          </div>
          
          <div class="warning-item">
            <div class="warning-info">
              <span class="warning-label">每日提醒</span>
              <span class="warning-desc">每天检查预算使用情况并提醒</span>
            </div>
            <div class="warning-control">
              <label class="ios-switch">
                <input
                  v-model="dailyReminder"
                  type="checkbox"
                  :disabled="isLoading"
                  @change="handleDailyReminderChange"
                />
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 当前预算状态 -->
      <div v-if="budgetSummary.totalBudget > 0" class="settings-section">
        <div class="section-header">
          <h2>当前预算状态</h2>
          <p>本月预算使用情况概览</p>
        </div>
        
        <div class="budget-status">
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">总预算</span>
              <span class="status-value">¥{{ formatAmount(budgetSummary.totalBudget) }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">已使用</span>
              <span class="status-value">¥{{ formatAmount(budgetSummary.totalSpent) }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">剩余</span>
              <span class="status-value" :class="{ 'negative': budgetSummary.remainingBudget < 0 }">
                ¥{{ formatAmount(budgetSummary.remainingBudget) }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">剩余天数</span>
              <span class="status-value">{{ budgetSummary.daysRemaining }}天</span>
            </div>
          </div>
          
          <div class="usage-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${Math.min(100, (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100)}%` }"
                :class="{
                  'warning': (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100 >= warningThreshold,
                  'exceeded': budgetSummary.isOverBudget
                }"
              ></div>
            </div>
            <span class="progress-text">
              已使用 {{ Math.round((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100) }}%
            </span>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="settings-actions">
        <IOSButton
          variant="primary"
          size="large"
          :loading="isLoading"
          :disabled="!canSave"
          @click="saveBudgetSettings"
        >
          保存设置
        </IOSButton>
        
        <IOSButton
          v-if="budgetSummary.totalBudget > 0"
          variant="destructive"
          size="large"
          :disabled="isLoading"
          @click="showDeleteConfirm = true"
        >
          删除预算
        </IOSButton>
      </div>
    </div>
    
    <!-- 周期选择器 -->
    <IOSActionSheet
      v-model:visible="showPeriodPicker"
      title="选择预算周期"
      :actions="periodActions"
    />
    
    <!-- 删除确认对话框 -->
    <IOSActionSheet
      v-model:visible="showDeleteConfirm"
      title="删除预算"
      message="删除后将清空所有预算数据，此操作不可恢复"
      :actions="deleteActions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AmountInput from '@/components/AmountInput.vue'
import IOSButton from '@/components/ui/IOSButton.vue'
import IOSActionSheet from '@/components/ui/IOSActionSheet.vue'
import { useBudget } from '@/composables/useBudget'
import type { BudgetInput } from '@/types'

// Composables
const router = useRouter()
const {
  currentBudget,
  budgetSummary,
  isLoading,
  error,
  setMonthlyBudget,
  updateMonthlyBudget,
  deleteBudget,
  clearError
} = useBudget()

// Form state
const budgetAmount = ref<number>(0)
const budgetError = ref<string>('')
const warningThreshold = ref<number>(80)
const dailyReminder = ref<boolean>(true)
const currentPeriod = ref<{ start: Date; end: Date } | null>(null)

// UI state
const showPeriodPicker = ref(false)
const showDeleteConfirm = ref(false)

// Computed
const canSave = computed(() => {
  return budgetAmount.value > 0 && !budgetError.value && !isLoading.value
})

// Period actions for ActionSheet
const periodActions = [
  { text: '本月', type: 'default' as const, handler: () => handlePeriodSelect({ id: 'current' }) },
  { text: '下月', type: 'default' as const, handler: () => handlePeriodSelect({ id: 'next' }) },
  { text: '自定义周期', type: 'default' as const, handler: () => handlePeriodSelect({ id: 'custom' }) }
]

// Delete actions for ActionSheet
const deleteActions = [
  { text: '删除预算', type: 'destructive' as const, handler: () => handleDeleteAction({ id: 'delete' }) },
  { text: '取消', type: 'default' as const, handler: () => handleDeleteAction({ id: 'cancel' }) }
]

// Methods
const handleBudgetInput = (value: number) => {
  budgetError.value = ''
  
  if (value <= 0) {
    budgetError.value = '预算金额必须大于0'
  } else if (value > 999999.99) {
    budgetError.value = '预算金额不能超过999,999.99'
  }
}

const handleThresholdChange = () => {
  // 预警阈值变化处理
  console.log('Warning threshold changed to:', warningThreshold.value)
}

const handleDailyReminderChange = () => {
  // 每日提醒开关变化处理
  console.log('Daily reminder changed to:', dailyReminder.value)
}

const handlePeriodSelect = (action: { id: string }) => {
  switch (action.id) {
    case 'current':
      currentPeriod.value = getCurrentMonthPeriod()
      break
    case 'next':
      currentPeriod.value = getNextMonthPeriod()
      break
    case 'custom':
      // TODO: 实现自定义周期选择
      console.log('Custom period selection not implemented yet')
      break
  }
  showPeriodPicker.value = false
}

const handleDeleteAction = async (action: { id: string }) => {
  if (action.id === 'delete' && currentBudget.value) {
    try {
      await deleteBudget(currentBudget.value.id)
      router.push('/')
    } catch (err) {
      console.error('Failed to delete budget:', err)
    }
  }
  showDeleteConfirm.value = false
}

const saveBudgetSettings = async () => {
  if (!canSave.value) return
  
  clearError()
  
  try {
    const budgetInput: BudgetInput = {
      monthlyAmount: budgetAmount.value,
      startDate: currentPeriod.value?.start || new Date()
    }
    
    if (currentBudget.value) {
      // 更新现有预算
      await updateMonthlyBudget({ monthlyAmount: budgetAmount.value })
    } else {
      // 创建新预算
      await setMonthlyBudget(budgetInput)
    }
    
    // 保存成功后返回首页
    router.push('/')
  } catch (err) {
    console.error('Failed to save budget:', err)
  }
}

// Utility functions
function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatPeriod(period: { start: Date; end: Date }): string {
  const start = period?.start.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })
  return start
}

function getCurrentMonthPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

function getNextMonthPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return { start, end }
}

// Watchers
watch(error, (newError) => {
  if (newError) {
    budgetError.value = newError
  }
})

// Lifecycle
onMounted(() => {
  // 初始化表单数据
  if (currentBudget.value) {
    budgetAmount.value = currentBudget.value.monthlyAmount
    currentPeriod.value = {
      start: currentBudget.value.startDate,
      end: currentBudget.value.endDate
    }
  } else {
    currentPeriod.value = getCurrentMonthPeriod()
  }
})
</script>

<style lang="scss" scoped>
.budget-settings {
  padding: var(--ios-spacing-lg, 16px);
  min-height: 100vh;
  background: var(--ios-system-background, #f2f2f7);
  padding-bottom: calc(var(--ios-spacing-xl, 24px) + env(safe-area-inset-bottom));
}

.settings-header {
  margin-bottom: var(--ios-spacing-xl, 24px);
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: var(--ios-label, #1c1c1e);
    margin: 0 0 var(--ios-spacing-xs, 4px) 0;
  }
  
  .settings-subtitle {
    font-size: var(--ios-font-size-body, 17px);
    color: var(--ios-secondary-label, #3c3c43);
    margin: 0;
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg, 16px);
}

.settings-section {
  background: var(--ios-secondary-system-background, white);
  border-radius: var(--ios-radius-large, 16px);
  padding: var(--ios-spacing-lg, 16px);
  box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  
  .section-header {
    margin-bottom: var(--ios-spacing-lg, 16px);
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--ios-label, #1c1c1e);
      margin: 0 0 var(--ios-spacing-xs, 4px) 0;
    }
    
    p {
      font-size: var(--ios-font-size-footnote, 13px);
      color: var(--ios-secondary-label, #3c3c43);
      margin: 0;
    }
  }
}

// 预算表单样式
.budget-form {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg, 16px);
}

.budget-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ios-spacing-md, 12px) var(--ios-spacing-lg, 16px);
  background: var(--ios-tertiary-system-background, #f2f2f7);
  border-radius: var(--ios-radius-medium, 12px);
  
  .period-info {
    display: flex;
    flex-direction: column;
    gap: var(--ios-spacing-xs, 4px);
    
    .period-label {
      font-size: var(--ios-font-size-footnote, 13px);
      color: var(--ios-secondary-label, #3c3c43);
    }
    
    .period-value {
      font-size: var(--ios-font-size-body, 17px);
      font-weight: 500;
      color: var(--ios-label, #1c1c1e);
    }
  }
}

// 预警设置样式
.warning-settings {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg, 16px);
}

.warning-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ios-spacing-md, 12px);
  
  .warning-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--ios-spacing-xs, 4px);
    
    .warning-label {
      font-size: var(--ios-font-size-body, 17px);
      font-weight: 500;
      color: var(--ios-label, #1c1c1e);
    }
    
    .warning-desc {
      font-size: var(--ios-font-size-footnote, 13px);
      color: var(--ios-secondary-label, #3c3c43);
    }
  }
  
  .warning-control {
    flex-shrink: 0;
  }
}

// 阈值滑块样式
.threshold-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ios-spacing-sm, 8px);
  min-width: 120px;
  
  .slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--ios-tertiary-system-fill, #d1d1d6);
    outline: none;
    -webkit-appearance: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ios-blue, #007aff);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ios-blue, #007aff);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .threshold-value {
    font-size: var(--ios-font-size-footnote, 13px);
    font-weight: 600;
    color: var(--ios-blue, #007aff);
  }
}

// iOS 开关样式
.ios-switch {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .switch-slider {
      background-color: var(--ios-green, #34c759);
      
      &:before {
        transform: translateX(20px);
      }
    }
    
    &:disabled + .switch-slider {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--ios-tertiary-system-fill, #d1d1d6);
    transition: 0.2s;
    border-radius: 31px;
    
    &:before {
      position: absolute;
      content: "";
      height: 27px;
      width: 27px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

// 预算状态样式
.budget-status {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg, 16px);
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ios-spacing-md, 12px);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-xs, 4px);
  padding: var(--ios-spacing-md, 12px);
  background: var(--ios-tertiary-system-background, #f2f2f7);
  border-radius: var(--ios-radius-medium, 12px);
  
  .status-label {
    font-size: var(--ios-font-size-footnote, 13px);
    color: var(--ios-secondary-label, #3c3c43);
  }
  
  .status-value {
    font-size: var(--ios-font-size-headline, 17px);
    font-weight: 600;
    color: var(--ios-label, #1c1c1e);
    
    &.negative {
      color: var(--ios-red, #ff3b30);
    }
  }
}

.usage-progress {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-sm, 8px);
  
  .progress-bar {
    height: 8px;
    background: var(--ios-tertiary-system-fill, #d1d1d6);
    border-radius: 4px;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: var(--ios-blue, #007aff);
      border-radius: 4px;
      transition: all 0.3s ease;
      
      &.warning {
        background: var(--ios-orange, #ff9500);
      }
      
      &.exceeded {
        background: var(--ios-red, #ff3b30);
      }
    }
  }
  
  .progress-text {
    font-size: var(--ios-font-size-footnote, 13px);
    color: var(--ios-secondary-label, #3c3c43);
    text-align: center;
  }
}

// 操作按钮样式
.settings-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-md, 12px);
  margin-top: var(--ios-spacing-lg, 16px);
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .budget-settings {
    background: var(--ios-system-background, #000000);
  }
  
  .settings-section {
    background: var(--ios-secondary-system-background, #1c1c1e);
  }
  
  .budget-period,
  .status-item {
    background: var(--ios-tertiary-system-background, #2c2c2e);
  }
  
  .slider {
    background: var(--ios-tertiary-system-fill, #48484a);
  }
  
  .ios-switch .switch-slider {
    background-color: var(--ios-tertiary-system-fill, #48484a);
  }
  
  .progress-bar {
    background: var(--ios-tertiary-system-fill, #48484a);
  }
}
</style>