<template>
  <div class="expense-item" @click="handleClick">
    <div class="expense-info">
      <div 
        class="category-icon" 
        :style="{ backgroundColor: category?.color || '#95A5A6' }"
      >
        {{ category?.icon || '📝' }}
      </div>
      <div class="expense-details">
        <div class="expense-header">
          <span class="category-name">{{ category?.name || '未知分类' }}</span>
          <span class="expense-time">{{ formatTime(expense.date) }}</span>
        </div>
        <div class="expense-description">
          {{ expense.description || '无备注' }}
        </div>
      </div>
    </div>
    
    <div class="expense-actions">
      <div class="expense-amount">
        ¥{{ expense.amount.toFixed(2) }}
      </div>
      <div v-if="showActions" class="action-buttons">
        <button 
          class="edit-btn"
          @click.stop="handleEdit"
          type="button"
        >
          编辑
        </button>
        <button 
          class="delete-btn"
          @click.stop="handleDelete"
          type="button"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense, Category } from '@/types'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  expense: Expense
  category?: Category
  showActions?: boolean
  clickable?: boolean
}

interface Emits {
  (e: 'click', expense: Expense): void
  (e: 'edit', expense: Expense): void
  (e: 'delete', expense: Expense): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  clickable: true
})

const emit = defineEmits<Emits>()

// ============================================================================
// Computed Properties
// ============================================================================

const category = computed(() => props.category)

// ============================================================================
// Methods
// ============================================================================

const formatTime = (date: Date): string => {
  const now = new Date()
  const expenseDate = new Date(date)
  
  // 如果是今天，显示时间
  if (expenseDate.toDateString() === now.toDateString()) {
    return expenseDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (expenseDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  // 如果是本年，显示月日
  if (expenseDate.getFullYear() === now.getFullYear()) {
    return expenseDate.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
  
  // 其他情况显示完整日期
  return expenseDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.expense)
  }
}

const handleEdit = () => {
  emit('edit', props.expense)
}

const handleDelete = () => {
  emit('delete', props.expense)
}
</script>

<style lang="scss" scoped>
.expense-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-radius: var(--ios-radius-medium, 12px);
  box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--ios-shadow-large, 0 4px 16px rgba(0, 0, 0, 0.1));
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .expense-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0; // 允许文本截断
    
    .category-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;
      flex-shrink: 0;
    }
    
    .expense-details {
      flex: 1;
      min-width: 0;
      
      .expense-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .category-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
        }
        
        .expense-time {
          font-size: 12px;
          color: var(--ios-gray, #8e8e93);
          flex-shrink: 0;
          margin-left: 8px;
        }
      }
      
      .expense-description {
        font-size: 14px;
        color: var(--ios-gray, #8e8e93);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  
  .expense-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    
    .expense-amount {
      font-size: 18px;
      font-weight: 700;
      color: var(--ios-gray-dark, #1c1c1e);
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
      
      button {
        padding: 6px 12px;
        border: none;
        border-radius: var(--ios-radius-small, 8px);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:active {
          transform: scale(0.95);
        }
      }
      
      .edit-btn {
        background: var(--ios-blue, #007AFF);
        color: white;
        
        &:hover {
          background: #0056CC;
        }
      }
      
      .delete-btn {
        background: var(--ios-red, #FF3B30);
        color: white;
        
        &:hover {
          background: #D70015;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .expense-item {
    padding: 12px;
    
    .expense-info {
      .category-icon {
        width: 36px;
        height: 36px;
        font-size: 16px;
      }
      
      .expense-details {
        .expense-header {
          .category-name {
            font-size: 15px;
          }
          
          .expense-time {
            font-size: 11px;
          }
        }
        
        .expense-description {
          font-size: 13px;
        }
      }
    }
    
    .expense-actions {
      .expense-amount {
        font-size: 16px;
      }
      
      .action-buttons {
        button {
          padding: 4px 8px;
          font-size: 11px;
        }
      }
    }
  }
}
</style>