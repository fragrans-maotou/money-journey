<template>
  <div class="budget-card">
    <div class="budget-card-header">
      <h3 class="budget-title">本月预算</h3>
      <div class="budget-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>
    
    <div class="budget-amount">
      <span class="currency">¥</span>
      <span class="amount">{{ formatAmount(budgetSummary.totalBudget) }}</span>
    </div>
    
    <div class="budget-progress">
      <ProgressRing 
        :progress="progressPercentage"
        :size="120"
        :stroke-width="8"
        :color="progressColor"
      />
      <div class="progress-info">
        <div class="spent-amount">
          <span class="label">已消费</span>
          <span class="value">¥{{ formatAmount(budgetSummary.totalSpent) }}</span>
        </div>
        <div class="remaining-amount">
          <span class="label">剩余</span>
          <span class="value">¥{{ formatAmount(budgetSummary.remainingBudget) }}</span>
        </div>
      </div>
    </div>
    
    <div class="budget-details">
      <div class="detail-item">
        <span class="detail-label">日均预算</span>
        <span class="detail-value">¥{{ formatAmount(budgetSummary.dailyAverage) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">剩余天数</span>
        <span class="detail-value">{{ budgetSummary.daysRemaining }}天</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">今日可用</span>
        <span class="detail-value" :class="{ 'over-budget': availableBudget < 0 }">
          ¥{{ formatAmount(Math.abs(availableBudget)) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BudgetSummary } from '@/types'
import ProgressRing from './ProgressRing.vue'

interface Props {
  budgetSummary: BudgetSummary
  availableBudget: number
}

const props = defineProps<Props>()

// 计算进度百分比
const progressPercentage = computed(() => {
  if (props.budgetSummary.totalBudget === 0) return 0
  return Math.min(100, (props.budgetSummary.totalSpent / props.budgetSummary.totalBudget) * 100)
})

// 计算进度颜色
const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage >= 100) return '#FF3B30' // iOS Red
  if (percentage >= 80) return '#FF9500'  // iOS Orange
  if (percentage >= 60) return '#FFCC00'  // iOS Yellow
  return '#34C759' // iOS Green
})

// 计算状态类名
const statusClass = computed(() => {
  if (props.budgetSummary.isOverBudget) return 'status-exceeded'
  if (progressPercentage.value >= 80) return 'status-warning'
  return 'status-normal'
})

// 计算状态文本
const statusText = computed(() => {
  if (props.budgetSummary.isOverBudget) return '已超支'
  if (progressPercentage.value >= 80) return '接近预算'
  return '正常'
})

// 格式化金额
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}
</script>

<style lang="scss" scoped>
.budget-card {
  background: white;
  border-radius: var(--ios-radius-large, 16px);
  padding: 24px;
  box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 20px;
}

.budget-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .budget-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--ios-gray-dark, #1c1c1e);
    margin: 0;
  }
  
  .budget-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    
    &.status-normal {
      background: rgba(52, 199, 89, 0.1);
      color: #34C759;
    }
    
    &.status-warning {
      background: rgba(255, 149, 0, 0.1);
      color: #FF9500;
    }
    
    &.status-exceeded {
      background: rgba(255, 59, 48, 0.1);
      color: #FF3B30;
    }
  }
}

.budget-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 24px;
  
  .currency {
    font-size: 24px;
    font-weight: 500;
    color: var(--ios-gray, #8e8e93);
    margin-right: 4px;
  }
  
  .amount {
    font-size: 36px;
    font-weight: 700;
    color: var(--ios-gray-dark, #1c1c1e);
  }
}

.budget-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  
  .progress-info {
    flex: 1;
    margin-left: 24px;
    
    .spent-amount,
    .remaining-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        font-size: 14px;
        color: var(--ios-gray, #8e8e93);
      }
      
      .value {
        font-size: 16px;
        font-weight: 600;
        color: var(--ios-gray-dark, #1c1c1e);
      }
    }
  }
}

.budget-details {
  border-top: 1px solid var(--ios-gray-light, #f2f2f7);
  padding-top: 20px;
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-size: 14px;
      color: var(--ios-gray, #8e8e93);
    }
    
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      
      &.over-budget {
        color: #FF3B30;
      }
    }
  }
}
</style>