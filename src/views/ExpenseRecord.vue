<template>
  <div class="expense-record">
    <div class="record-header">
      <h1>{{ isEditing ? '编辑消费' : '记录消费' }}</h1>
      <button 
        v-if="isEditing" 
        class="cancel-edit-btn"
        @click="cancelEdit"
        type="button"
      >
        取消
      </button>
    </div>
    
    <div class="record-content">
      <!-- 消费记录表单 -->
      <div class="record-form">
        <form @submit.prevent="handleSubmit">
          <!-- 金额输入 -->
          <div class="form-group">
            <label class="form-label">消费金额</label>
            <AmountInput
              v-model="formData.amount"
              placeholder="请输入消费金额"
              :error="errors.amount"
              @blur="validateAmount"
            />
          </div>
          
          <!-- 分类选择 -->
          <div class="form-group">
            <label class="form-label">消费分类</label>
            <CategoryPicker
              v-model="formData.categoryId"
              @change="validateCategory"
            />
            <div v-if="errors.categoryId" class="error-message">
              {{ errors.categoryId }}
            </div>
          </div>
          
          <!-- 日期选择 -->
          <div class="form-group">
            <label class="form-label">消费日期</label>
            <DatePicker
              v-model="formData.date"
              label="消费日期"
              :max-date="new Date()"
              @change="validateDate"
            />
            <div v-if="errors.date" class="error-message">
              {{ errors.date }}
            </div>
          </div>
          
          <!-- 备注输入 -->
          <div class="form-group">
            <label class="form-label">消费备注</label>
            <textarea
              v-model="formData.description"
              class="description-input"
              placeholder="请输入消费备注（可选）"
              maxlength="100"
              rows="3"
              @blur="validateDescription"
            />
            <div class="input-footer">
              <div v-if="errors.description" class="error-message">
                {{ errors.description }}
              </div>
              <div class="char-count">
                {{ formData.description.length }}/100
              </div>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="form-actions">
            <button
              type="submit"
              class="submit-btn"
              :disabled="!isFormValid || isLoading"
            >
              {{ isLoading ? '保存中...' : (isEditing ? '更新记录' : '添加记录') }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- 今日消费概览 -->
      <div class="today-summary">
        <h3>今日消费概览</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="label">今日消费</span>
            <span class="value">¥{{ todayTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">消费笔数</span>
            <span class="value">{{ todayExpenses.length }}笔</span>
          </div>
        </div>
        
        <!-- 今日消费列表 -->
        <div v-if="todayExpenses.length > 0" class="today-expenses">
          <h4>今日记录</h4>
          <div class="expense-list">
            <div
              v-for="expense in todayExpenses.slice(0, 3)"
              :key="expense.id"
              class="expense-item"
              @click="editExpense(expense)"
            >
              <div class="expense-info">
                <div class="category-icon" :style="{ backgroundColor: getCategoryColor(expense.categoryId) }">
                  {{ getCategoryIcon(expense.categoryId) }}
                </div>
                <div class="expense-details">
                  <span class="category-name">{{ getCategoryName(expense.categoryId) }}</span>
                  <span class="description">{{ expense.description || '无备注' }}</span>
                </div>
              </div>
              <div class="expense-amount">
                ¥{{ expense.amount.toFixed(2) }}
              </div>
            </div>
          </div>
          
          <button 
            v-if="todayExpenses.length > 3"
            class="view-more-btn"
            @click="$router.push('/expense-history')"
            type="button"
          >
            查看更多记录
          </button>
        </div>
      </div>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="showSuccessMessage" class="success-toast">
      <div class="toast-content">
        <span class="toast-icon">✓</span>
        <span class="toast-message">{{ successMessage }}</span>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-toast">
      <div class="toast-content">
        <span class="toast-icon">✕</span>
        <span class="toast-message">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExpense } from '@/composables/useExpense'
import AmountInput from '@/components/AmountInput.vue'
import CategoryPicker from '@/components/CategoryPicker.vue'
import DatePicker from '@/components/DatePicker.vue'
import type { ExpenseInput, Expense } from '@/types'

// ============================================================================
// Router & Route
// ============================================================================

const route = useRoute()
const router = useRouter()

// ============================================================================
// Composables
// ============================================================================

const { 
  addExpense, 
  updateExpense, 
  todayExpenses, 
  todayTotal, 
  categories,
  getCategoryById,
  isLoading, 
  error,
  clearError
} = useExpense()

// ============================================================================
// Reactive State
// ============================================================================

const isEditing = ref(false)
const editingExpenseId = ref<string | null>(null)
const showSuccessMessage = ref(false)
const successMessage = ref('')

const formData = ref<ExpenseInput>({
  amount: 0,
  categoryId: '',
  description: '',
  date: new Date()
})

const errors = ref<Record<string, string>>({})

// ============================================================================
// Computed Properties
// ============================================================================

const isFormValid = computed(() => {
  return formData.value.amount > 0 &&
         formData.value.categoryId &&
         formData.value.date &&
         Object.keys(errors.value).length === 0
})

// ============================================================================
// Methods
// ============================================================================

const getCategoryIcon = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.icon || '📝'
}

const getCategoryName = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.name || '未知分类'
}

const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.color || '#95A5A6'
}

const validateAmount = () => {
  if (formData.value.amount <= 0) {
    errors.value.amount = '请输入有效的消费金额'
  } else if (formData.value.amount > 999999) {
    errors.value.amount = '消费金额不能超过999,999元'
  } else {
    delete errors.value.amount
  }
}

const validateCategory = () => {
  if (!formData.value.categoryId) {
    errors.value.categoryId = '请选择消费分类'
  } else {
    delete errors.value.categoryId
  }
}

const validateDate = () => {
  if (!formData.value.date) {
    errors.value.date = '请选择消费日期'
  } else if (formData.value.date > new Date()) {
    errors.value.date = '消费日期不能是未来日期'
  } else {
    delete errors.value.date
  }
}

const validateDescription = () => {
  if (formData.value.description.length > 100) {
    errors.value.description = '备注不能超过100个字符'
  } else {
    delete errors.value.description
  }
}

const validateForm = (): boolean => {
  validateAmount()
  validateCategory()
  validateDate()
  validateDescription()
  
  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  formData.value = {
    amount: 0,
    categoryId: '',
    description: '',
    date: new Date()
  }
  errors.value = {}
  isEditing.value = false
  editingExpenseId.value = null
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    clearError()
    
    if (isEditing.value && editingExpenseId.value) {
      // 更新现有记录
      await updateExpense(editingExpenseId.value, {
        amount: formData.value.amount,
        categoryId: formData.value.categoryId,
        description: formData.value.description,
        date: formData.value.date
      })
      
      successMessage.value = '消费记录已更新'
      showSuccessToast()
      
      // 返回到统计页面或者重置表单
      resetForm()
    } else {
      // 添加新记录
      await addExpense(formData.value)
      
      successMessage.value = '消费记录已添加'
      showSuccessToast()
      
      // 重置表单，保持日期为今天
      const today = new Date()
      formData.value = {
        amount: 0,
        categoryId: '',
        description: '',
        date: today
      }
    }
  } catch (err) {
    console.error('Failed to save expense:', err)
    // 错误处理已在 useExpense 中完成
  }
}

const editExpense = (expense: Expense) => {
  isEditing.value = true
  editingExpenseId.value = expense.id
  
  formData.value = {
    amount: expense.amount,
    categoryId: expense.categoryId,
    description: expense.description,
    date: new Date(expense.date)
  }
  
  // 滚动到表单顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  resetForm()
}

const showSuccessToast = () => {
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  // 检查是否有编辑参数
  const expenseId = route.query.edit as string
  if (expenseId) {
    const expense = todayExpenses.value.find(e => e.id === expenseId)
    if (expense) {
      editExpense(expense)
    }
  }
})

// ============================================================================
// Watchers
// ============================================================================

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      clearError()
    }, 5000)
  }
})
</script>

<style lang="scss" scoped>
.expense-record {
  padding: 20px;
  min-height: 100vh;
  background: var(--ios-gray-light, #f2f2f7);
  padding-bottom: 100px; // 为底部导航留出空间
}

.record-header {
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
  
  .cancel-edit-btn {
    padding: 8px 16px;
    background: var(--ios-gray-light, #f2f2f7);
    color: var(--ios-gray-dark, #1c1c1e);
    border: none;
    border-radius: var(--ios-radius-medium, 12px);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #E5E5EA;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .record-form {
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    padding: 24px;
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    
    .form-group {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .form-label {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: var(--ios-gray-dark, #1c1c1e);
        margin-bottom: 12px;
      }
      
      .description-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #E5E5EA;
        border-radius: var(--ios-radius-medium, 12px);
        font-size: 16px;
        font-family: inherit;
        background: white;
        resize: vertical;
        min-height: 80px;
        
        &:focus {
          outline: none;
          border-color: var(--ios-blue, #007AFF);
        }
        
        &::placeholder {
          color: var(--ios-gray, #8e8e93);
        }
      }
      
      .input-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        
        .char-count {
          font-size: 12px;
          color: var(--ios-gray, #8e8e93);
        }
      }
      
      .error-message {
        color: var(--ios-red, #FF3B30);
        font-size: 14px;
        margin-top: 8px;
      }
    }
    
    .form-actions {
      margin-top: 32px;
      
      .submit-btn {
        width: 100%;
        padding: 16px 24px;
        background: var(--ios-blue, #007AFF);
        color: white;
        border: none;
        border-radius: var(--ios-radius-medium, 12px);
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background: #0056CC;
        }
        
        &:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .today-summary {
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    padding: 24px;
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0 0 16px 0;
    }
    
    .summary-content {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      
      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .label {
          font-size: 14px;
          color: var(--ios-gray, #8e8e93);
        }
        
        .value {
          font-size: 18px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
        }
      }
    }
    
    .today-expenses {
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--ios-gray-dark, #1c1c1e);
        margin: 0 0 12px 0;
      }
      
      .expense-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
        
        .expense-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--ios-gray-light, #f2f2f7);
          border-radius: var(--ios-radius-medium, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: #E5E5EA;
          }
          
          &:active {
            transform: scale(0.98);
          }
          
          .expense-info {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .category-icon {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
            }
            
            .expense-details {
              display: flex;
              flex-direction: column;
              gap: 2px;
              
              .category-name {
                font-size: 14px;
                font-weight: 500;
                color: var(--ios-gray-dark, #1c1c1e);
              }
              
              .description {
                font-size: 12px;
                color: var(--ios-gray, #8e8e93);
              }
            }
          }
          
          .expense-amount {
            font-size: 16px;
            font-weight: 600;
            color: var(--ios-gray-dark, #1c1c1e);
          }
        }
      }
      
      .view-more-btn {
        width: 100%;
        padding: 12px 24px;
        background: var(--ios-gray-light, #f2f2f7);
        color: var(--ios-blue, #007AFF);
        border: none;
        border-radius: var(--ios-radius-medium, 12px);
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #E5E5EA;
        }
        
        &:active {
          transform: scale(0.98);
        }
      }
    }
  }
}

// Toast 样式
.success-toast,
.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.3s ease;
  
  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: var(--ios-radius-medium, 12px);
    font-size: 14px;
    font-weight: 500;
    box-shadow: var(--ios-shadow-large, 0 4px 16px rgba(0, 0, 0, 0.1));
    
    .toast-icon {
      font-size: 16px;
      font-weight: 600;
    }
  }
}

.success-toast .toast-content {
  background: var(--ios-green, #34C759);
  color: white;
}

.error-toast .toast-content {
  background: var(--ios-red, #FF3B30);
  color: white;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>