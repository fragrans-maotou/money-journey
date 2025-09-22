<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>预算概览</h1>
      <div class="header-actions">
        <button 
          class="refresh-button"
          @click="refreshData"
          :disabled="isLoading"
        >
          <span class="refresh-icon" :class="{ 'spinning': isLoading }">🔄</span>
        </button>
      </div>
    </div>
    
    <div class="dashboard-content">
      <!-- 预算卡片 -->
      <BudgetCard 
        v-if="currentBudget"
        :budget-summary="budgetSummary"
        :available-budget="availableBudget"
      />
      
      <!-- 无预算状态 -->
      <div v-else class="no-budget-state">
        <div class="no-budget-icon">💰</div>
        <h3>还没有设置预算</h3>
        <p>设置月度预算，开始管理您的支出</p>
        <button 
          class="setup-budget-button"
          @click="navigateToSettings"
        >
          设置预算
        </button>
      </div>
      
      <!-- 今日预算信息 -->
      <div v-if="currentBudget" class="today-budget">
        <h3>今日预算</h3>
        <div class="today-info">
          <div class="today-available">
            <span class="label">可用金额</span>
            <span class="amount" :class="{ 'over-budget': availableBudget < 0 }">
              ¥{{ formatAmount(Math.abs(availableBudget)) }}
            </span>
          </div>
          <div class="today-spent" v-if="todaySpent > 0">
            <span class="label">今日已消费</span>
            <span class="amount">¥{{ formatAmount(todaySpent) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 快速操作 -->
      <div v-if="currentBudget" class="quick-actions">
        <h3>快速操作</h3>
        <div class="action-buttons">
          <button 
            class="action-button"
            @click="navigateToExpenseRecord"
          >
            <span class="action-icon">➕</span>
            <span class="action-text">记录消费</span>
          </button>
          <button 
            class="action-button"
            @click="navigateToStatistics"
          >
            <span class="action-icon">📊</span>
            <span class="action-text">查看统计</span>
          </button>
        </div>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="error" class="error-state">
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="clearError">
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBudget } from '@/composables/useBudget'
import { useExpense } from '@/composables/useExpense'
import BudgetCard from '@/components/BudgetCard.vue'

const router = useRouter()

// 使用预算管理 composable
const {
  currentBudget,
  isLoading,
  error,
  budgetSummary,
  availableBudget,
  getCurrentMonthBudget,
  clearError
} = useBudget()

// 使用消费管理 composable
const { getExpensesByDate } = useExpense()

// 计算今日消费
const todaySpent = computed(() => {
  const today = new Date()
  const todayExpenses = getExpensesByDate(today)
  return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
})

// 刷新数据
const refreshData = async () => {
  try {
    await getCurrentMonthBudget()
  } catch (err) {
    console.error('Failed to refresh data:', err)
  }
}

// 导航到设置页面
const navigateToSettings = () => {
  router.push('/budget-settings')
}

// 导航到消费记录页面
const navigateToExpenseRecord = () => {
  router.push('/expense-record')
}

// 导航到统计页面
const navigateToStatistics = () => {
  router.push('/statistics')
}

// 格式化金额
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// 组件挂载时初始化数据
onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;
  min-height: 100vh;
  background: var(--ios-gray-light, #f2f2f7);
  padding-bottom: 100px; // 为底部导航留出空间
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: var(--ios-gray-dark, #1c1c1e);
    margin: 0;
  }
  
  .header-actions {
    .refresh-button {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .refresh-icon {
        font-size: 18px;
        display: inline-block;
        transition: transform 0.6s ease;
        
        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

.dashboard-content {
  // 无预算状态
  .no-budget-state {
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    padding: 40px 24px;
    text-align: center;
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    margin-bottom: 20px;
    
    .no-budget-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0 0 8px 0;
    }
    
    p {
      font-size: 16px;
      color: var(--ios-gray, #8e8e93);
      margin: 0 0 24px 0;
      line-height: 1.4;
    }
    
    .setup-budget-button {
      background: var(--ios-blue, #007AFF);
      color: white;
      border: none;
      border-radius: var(--ios-radius-medium, 12px);
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #0056CC;
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
  
  // 今日预算信息
  .today-budget {
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    padding: 20px;
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    margin-bottom: 20px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0 0 16px 0;
    }
    
    .today-info {
      .today-available,
      .today-spent {
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
        
        .amount {
          font-size: 18px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
          
          &.over-budget {
            color: #FF3B30;
          }
        }
      }
    }
  }
  
  // 快速操作
  .quick-actions {
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    padding: 20px;
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    margin-bottom: 20px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0 0 16px 0;
    }
    
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      
      .action-button {
        background: var(--ios-gray-light, #f2f2f7);
        border: none;
        border-radius: var(--ios-radius-medium, 12px);
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #E5E5EA;
        }
        
        &:active {
          transform: scale(0.95);
        }
        
        .action-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .action-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--ios-gray-dark, #1c1c1e);
        }
      }
    }
  }
  
  // 错误状态
  .error-state {
    background: rgba(255, 59, 48, 0.1);
    border: 1px solid rgba(255, 59, 48, 0.2);
    border-radius: var(--ios-radius-medium, 12px);
    padding: 16px;
    text-align: center;
    margin-bottom: 20px;
    
    .error-message {
      color: #FF3B30;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .retry-button {
      background: #FF3B30;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background: #D70015;
      }
    }
  }
}

// 动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 375px) {
  .dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    h1 {
      font-size: 28px;
    }
  }
  
  .quick-actions .action-buttons {
    grid-template-columns: 1fr;
    
    .action-button {
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
      
      .action-icon {
        margin-bottom: 0;
        margin-right: 12px;
      }
    }
  }
}
</style>