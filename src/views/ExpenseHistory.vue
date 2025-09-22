<template>
  <div class="expense-history">
    <!-- 页面头部 -->
    <div class="history-header">
      <h1>消费历史</h1>
      <div class="header-actions">
        <button 
          class="filter-btn"
          @click="showFilterModal = true"
          type="button"
        >
          <span class="filter-icon">🔍</span>
          筛选
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索消费记录..."
          @input="handleSearch"
        />
        <button 
          v-if="searchQuery"
          class="clear-search-btn"
          @click="clearSearch"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
    
    <!-- 筛选标签 -->
    <div v-if="hasActiveFilters" class="filter-tags">
      <div class="filter-tag" v-if="currentFilter.categoryId">
        <span>{{ getCategoryName(currentFilter.categoryId) }}</span>
        <button @click="clearCategoryFilter" type="button">✕</button>
      </div>
      <div class="filter-tag" v-if="currentFilter.startDate || currentFilter.endDate">
        <span>{{ formatDateRange() }}</span>
        <button @click="clearDateFilter" type="button">✕</button>
      </div>
      <div class="filter-tag" v-if="currentFilter.minAmount || currentFilter.maxAmount">
        <span>{{ formatAmountRange() }}</span>
        <button @click="clearAmountFilter" type="button">✕</button>
      </div>
      <button class="clear-all-filters" @click="clearAllFilters" type="button">
        清除所有筛选
      </button>
    </div>
    
    <!-- 统计概览 -->
    <div class="statistics-overview">
      <div class="stat-item">
        <span class="stat-label">总记录</span>
        <span class="stat-value">{{ filteredExpenses.length }}笔</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总金额</span>
        <span class="stat-value">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均金额</span>
        <span class="stat-value">¥{{ averageAmount.toFixed(2) }}</span>
      </div>
    </div>
    
    <!-- 消费记录列表 -->
    <div class="expense-list-section">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      
      <div v-else-if="filteredExpenses.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>{{ searchQuery ? '没有找到匹配的记录' : '暂无消费记录' }}</h3>
        <p>{{ searchQuery ? '尝试调整搜索条件' : '开始记录您的第一笔消费吧' }}</p>
        <button 
          v-if="!searchQuery"
          class="add-expense-btn"
          @click="$router.push('/expense-record')"
          type="button"
        >
          添加消费记录
        </button>
      </div>
      
      <div v-else class="expense-list">
        <!-- 按日期分组显示 -->
        <div 
          v-for="group in groupedExpenses" 
          :key="group.date"
          class="expense-group"
        >
          <div class="group-header">
            <span class="group-date">{{ group.dateLabel }}</span>
            <span class="group-total">¥{{ group.total.toFixed(2) }}</span>
          </div>
          
          <div class="group-expenses">
            <ExpenseItem
              v-for="expense in group.expenses"
              :key="expense.id"
              :expense="expense"
              :category="getCategoryById(expense.categoryId)"
              :show-actions="true"
              @edit="handleEditExpense"
              @delete="handleDeleteExpense"
              @click="handleExpenseClick"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 筛选模态框 -->
    <div v-if="showFilterModal" class="filter-modal-overlay" @click="closeFilterModal">
      <div class="filter-modal" @click.stop>
        <div class="modal-header">
          <h3>筛选条件</h3>
          <button class="close-btn" @click="closeFilterModal" type="button">✕</button>
        </div>
        
        <div class="modal-content">
          <!-- 分类筛选 -->
          <div class="filter-group">
            <label class="filter-label">消费分类</label>
            <select v-model="filterForm.categoryId" class="filter-select">
              <option value="">全部分类</option>
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>
          
          <!-- 日期范围筛选 -->
          <div class="filter-group">
            <label class="filter-label">日期范围</label>
            <div class="date-range-inputs">
              <input
                v-model="filterForm.startDate"
                type="date"
                class="filter-input"
                placeholder="开始日期"
              />
              <span class="date-separator">至</span>
              <input
                v-model="filterForm.endDate"
                type="date"
                class="filter-input"
                placeholder="结束日期"
              />
            </div>
          </div>
          
          <!-- 金额范围筛选 -->
          <div class="filter-group">
            <label class="filter-label">金额范围</label>
            <div class="amount-range-inputs">
              <input
                v-model.number="filterForm.minAmount"
                type="number"
                class="filter-input"
                placeholder="最小金额"
                min="0"
                step="0.01"
              />
              <span class="amount-separator">至</span>
              <input
                v-model.number="filterForm.maxAmount"
                type="number"
                class="filter-input"
                placeholder="最大金额"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="reset-btn" @click="resetFilter" type="button">
            重置
          </button>
          <button class="apply-btn" @click="applyFilter" type="button">
            应用筛选
          </button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="delete-modal-overlay" @click="closeDeleteModal">
      <div class="delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        
        <div class="modal-content">
          <p>确定要删除这条消费记录吗？</p>
          <div v-if="expenseToDelete" class="expense-preview">
            <div class="preview-info">
              <span class="preview-category">{{ getCategoryName(expenseToDelete.categoryId) }}</span>
              <span class="preview-amount">¥{{ expenseToDelete.amount.toFixed(2) }}</span>
            </div>
            <div class="preview-description">{{ expenseToDelete.description || '无备注' }}</div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeDeleteModal" type="button">
            取消
          </button>
          <button class="confirm-delete-btn" @click="confirmDelete" type="button">
            删除
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
import { useRouter } from 'vue-router'
import { useExpense } from '@/composables/useExpense'
import ExpenseItem from '@/components/ExpenseItem.vue'
import type { Expense, ExpenseFilter } from '@/types'

// ============================================================================
// Router
// ============================================================================

const router = useRouter()

// ============================================================================
// Composables
// ============================================================================

const {
  filteredExpenses,
  categories,
  currentFilter,
  isLoading,
  error,
  deleteExpense,
  setFilter,
  clearFilter,
  getCategoryById,
  clearError
} = useExpense()

// ============================================================================
// Reactive State
// ============================================================================

const searchQuery = ref('')
const showFilterModal = ref(false)
const showDeleteModal = ref(false)
const expenseToDelete = ref<Expense | null>(null)
const showSuccessMessage = ref(false)
const successMessage = ref('')

const filterForm = ref<{
  categoryId: string
  startDate: string
  endDate: string
  minAmount: number | undefined
  maxAmount: number | undefined
}>({
  categoryId: '',
  startDate: '',
  endDate: '',
  minAmount: undefined,
  maxAmount: undefined
})

// ============================================================================
// Computed Properties
// ============================================================================

const hasActiveFilters = computed(() => {
  return !!(
    currentFilter.value.categoryId ||
    currentFilter.value.startDate ||
    currentFilter.value.endDate ||
    currentFilter.value.minAmount ||
    currentFilter.value.maxAmount ||
    searchQuery.value
  )
})

const totalAmount = computed(() => {
  return filteredExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const averageAmount = computed(() => {
  return filteredExpenses.value.length > 0 
    ? totalAmount.value / filteredExpenses.value.length 
    : 0
})

const groupedExpenses = computed(() => {
  const groups = new Map<string, {
    date: string
    dateLabel: string
    expenses: Expense[]
    total: number
  }>()
  
  filteredExpenses.value.forEach(expense => {
    try {
      // 确保 expense.date 是 Date 对象
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
      if (isNaN(expenseDate.getTime())) {
        console.warn('Invalid expense date:', expense.date)
        return
      }
      
      const dateStr = expenseDate.toISOString().split('T')[0]
      
      if (!groups.has(dateStr)) {
        groups.set(dateStr, {
          date: dateStr,
          dateLabel: formatGroupDate(expenseDate),
          expenses: [],
          total: 0
        })
      }
      
      const group = groups.get(dateStr)!
      group.expenses.push(expense)
      group.total += expense.amount
    } catch (error) {
      console.warn('Error processing expense date:', expense.date, error)
    }
  })
  
  return Array.from(groups.values())
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
})

// ============================================================================
// Methods
// ============================================================================

const formatGroupDate = (date: Date | string): string => {
  const now = new Date()
  const expenseDate = date instanceof Date ? date : new Date(date)
  
  // 如果是今天
  if (expenseDate.toDateString() === now.toDateString()) {
    return '今天'
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (expenseDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  // 如果是本周
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  if (expenseDate >= weekStart) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[expenseDate.getDay()]
  }
  
  // 如果是本年
  if (expenseDate.getFullYear() === now.getFullYear()) {
    return expenseDate.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    })
  }
  
  // 其他情况
  return expenseDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCategoryName = (categoryId: string): string => {
  const category = getCategoryById(categoryId)
  return category?.name || '未知分类'
}

const handleSearch = () => {
  const filter: ExpenseFilter = {
    ...currentFilter.value,
    description: searchQuery.value || undefined
  }
  setFilter(filter)
}

const clearSearch = () => {
  searchQuery.value = ''
  const filter: ExpenseFilter = {
    ...currentFilter.value
  }
  delete filter.description
  setFilter(filter)
}

const formatDateRange = (): string => {
  const { startDate, endDate } = currentFilter.value
  
  if (startDate && endDate) {
    return `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`
  } else if (startDate) {
    return `从 ${startDate.toLocaleDateString('zh-CN')}`
  } else if (endDate) {
    return `至 ${endDate.toLocaleDateString('zh-CN')}`
  }
  
  return ''
}

const formatAmountRange = (): string => {
  const { minAmount, maxAmount } = currentFilter.value
  
  if (minAmount !== undefined && maxAmount !== undefined) {
    return `¥${minAmount} - ¥${maxAmount}`
  } else if (minAmount !== undefined) {
    return `≥ ¥${minAmount}`
  } else if (maxAmount !== undefined) {
    return `≤ ¥${maxAmount}`
  }
  
  return ''
}

const clearCategoryFilter = () => {
  const filter: ExpenseFilter = {
    ...currentFilter.value
  }
  delete filter.categoryId
  setFilter(filter)
}

const clearDateFilter = () => {
  const filter: ExpenseFilter = {
    ...currentFilter.value
  }
  delete filter.startDate
  delete filter.endDate
  setFilter(filter)
}

const clearAmountFilter = () => {
  const filter: ExpenseFilter = {
    ...currentFilter.value
  }
  delete filter.minAmount
  delete filter.maxAmount
  setFilter(filter)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  clearFilter()
}

const closeFilterModal = () => {
  showFilterModal.value = false
}

const resetFilter = () => {
  filterForm.value = {
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: undefined,
    maxAmount: undefined
  }
}

const applyFilter = () => {
  const filter: ExpenseFilter = {}
  
  if (filterForm.value.categoryId) {
    filter.categoryId = filterForm.value.categoryId
  }
  
  if (filterForm.value.startDate) {
    filter.startDate = new Date(filterForm.value.startDate)
  }
  
  if (filterForm.value.endDate) {
    filter.endDate = new Date(filterForm.value.endDate)
  }
  
  if (filterForm.value.minAmount !== undefined && filterForm.value.minAmount > 0) {
    filter.minAmount = filterForm.value.minAmount
  }
  
  if (filterForm.value.maxAmount !== undefined && filterForm.value.maxAmount > 0) {
    filter.maxAmount = filterForm.value.maxAmount
  }
  
  // 保持搜索查询
  if (searchQuery.value) {
    filter.description = searchQuery.value
  }
  
  setFilter(filter)
  closeFilterModal()
}

const handleEditExpense = (expense: Expense) => {
  router.push({
    path: '/expense-record',
    query: { edit: expense.id }
  })
}

const handleDeleteExpense = (expense: Expense) => {
  expenseToDelete.value = expense
  showDeleteModal.value = true
}

const handleExpenseClick = (expense: Expense) => {
  // 可以在这里添加查看详情的逻辑
  console.log('Expense clicked:', expense)
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  expenseToDelete.value = null
}

const confirmDelete = async () => {
  if (!expenseToDelete.value) return
  
  try {
    await deleteExpense(expenseToDelete.value.id)
    
    successMessage.value = '消费记录已删除'
    showSuccessToast()
    
    closeDeleteModal()
  } catch (err) {
    console.error('Failed to delete expense:', err)
  }
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
  // 初始化筛选表单
  const filter = currentFilter.value
  filterForm.value = {
    categoryId: filter.categoryId || '',
    startDate: filter.startDate ? (filter.startDate instanceof Date ? filter.startDate : new Date(filter.startDate)).toISOString().split('T')[0] : '',
    endDate: filter.endDate ? (filter.endDate instanceof Date ? filter.endDate : new Date(filter.endDate)).toISOString().split('T')[0] : '',
    minAmount: filter.minAmount,
    maxAmount: filter.maxAmount
  }
  
  if (filter.description) {
    searchQuery.value = filter.description
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
.expense-history {
  padding: 20px;
  min-height: 100vh;
  background: var(--ios-gray-light, #f2f2f7);
  padding-bottom: 100px; // 为底部导航留出空间
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: var(--ios-gray-dark, #1c1c1e);
    margin: 0;
  }
  
  .header-actions {
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: white;
      color: var(--ios-blue, #007AFF);
      border: none;
      border-radius: var(--ios-radius-medium, 12px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      
      &:hover {
        background: #F8F9FA;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      .filter-icon {
        font-size: 16px;
      }
    }
  }
}

.search-section {
  margin-bottom: 16px;
  
  .search-input-wrapper {
    position: relative;
    
    .search-input {
      width: 100%;
      padding: 12px 16px;
      padding-right: 40px;
      background: white;
      border: 1px solid #E5E5EA;
      border-radius: var(--ios-radius-medium, 12px);
      font-size: 16px;
      font-family: inherit;
      box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      
      &:focus {
        outline: none;
        border-color: var(--ios-blue, #007AFF);
      }
      
      &::placeholder {
        color: var(--ios-gray, #8e8e93);
      }
    }
    
    .clear-search-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      background: var(--ios-gray, #8e8e93);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: var(--ios-gray-dark, #1c1c1e);
      }
    }
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  
  .filter-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--ios-blue, #007AFF);
    color: white;
    border-radius: var(--ios-radius-medium, 12px);
    font-size: 12px;
    font-weight: 500;
    
    button {
      background: none;
      border: none;
      color: white;
      font-size: 14px;
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  .clear-all-filters {
    padding: 6px 12px;
    background: var(--ios-gray, #8e8e93);
    color: white;
    border: none;
    border-radius: var(--ios-radius-medium, 12px);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover {
      background: var(--ios-gray-dark, #1c1c1e);
    }
  }
}

.statistics-overview {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  
  .stat-item {
    flex: 1;
    background: white;
    padding: 16px;
    border-radius: var(--ios-radius-medium, 12px);
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    text-align: center;
    
    .stat-label {
      display: block;
      font-size: 12px;
      color: var(--ios-gray, #8e8e93);
      margin-bottom: 4px;
    }
    
    .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: var(--ios-gray-dark, #1c1c1e);
    }
  }
}

.expense-list-section {
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E5E5EA;
      border-top: 3px solid var(--ios-blue, #007AFF);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    span {
      color: var(--ios-gray, #8e8e93);
      font-size: 16px;
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: var(--ios-radius-large, 16px);
    box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    
    .empty-icon {
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
    }
    
    .add-expense-btn {
      padding: 12px 24px;
      background: var(--ios-blue, #007AFF);
      color: white;
      border: none;
      border-radius: var(--ios-radius-medium, 12px);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #0056CC;
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
  }
  
  .expense-list {
    .expense-group {
      margin-bottom: 24px;
      
      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border-radius: var(--ios-radius-medium, 12px);
        box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
        margin-bottom: 8px;
        
        .group-date {
          font-size: 16px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
        }
        
        .group-total {
          font-size: 16px;
          font-weight: 700;
          color: var(--ios-blue, #007AFF);
        }
      }
      
      .group-expenses {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }
  }
}

// 模态框样式
.filter-modal-overlay,
.delete-modal-overlay {
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
  padding: 20px;
}

.filter-modal,
.delete-modal {
  background: white;
  border-radius: var(--ios-radius-large, 16px);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 0 20px;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0;
    }
    
    .close-btn {
      width: 32px;
      height: 32px;
      background: var(--ios-gray-light, #f2f2f7);
      border: none;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #E5E5EA;
      }
    }
  }
  
  .modal-content {
    padding: 20px;
    
    .filter-group {
      margin-bottom: 20px;
      
      .filter-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--ios-gray-dark, #1c1c1e);
        margin-bottom: 8px;
      }
      
      .filter-select,
      .filter-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #E5E5EA;
        border-radius: var(--ios-radius-medium, 12px);
        font-size: 16px;
        font-family: inherit;
        background: white;
        
        &:focus {
          outline: none;
          border-color: var(--ios-blue, #007AFF);
        }
      }
      
      .date-range-inputs,
      .amount-range-inputs {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .filter-input {
          flex: 1;
        }
        
        .date-separator,
        .amount-separator {
          font-size: 14px;
          color: var(--ios-gray, #8e8e93);
          flex-shrink: 0;
        }
      }
    }
    
    // 删除模态框特有样式
    p {
      font-size: 16px;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0 0 16px 0;
      text-align: center;
    }
    
    .expense-preview {
      background: var(--ios-gray-light, #f2f2f7);
      border-radius: var(--ios-radius-medium, 12px);
      padding: 16px;
      
      .preview-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .preview-category {
          font-size: 16px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
        }
        
        .preview-amount {
          font-size: 18px;
          font-weight: 700;
          color: var(--ios-red, #FF3B30);
        }
      }
      
      .preview-description {
        font-size: 14px;
        color: var(--ios-gray, #8e8e93);
      }
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    padding: 0 20px 20px 20px;
    
    button {
      flex: 1;
      padding: 12px 24px;
      border: none;
      border-radius: var(--ios-radius-medium, 12px);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:active {
        transform: scale(0.98);
      }
    }
    
    .reset-btn,
    .cancel-btn {
      background: var(--ios-gray-light, #f2f2f7);
      color: var(--ios-gray-dark, #1c1c1e);
      
      &:hover {
        background: #E5E5EA;
      }
    }
    
    .apply-btn {
      background: var(--ios-blue, #007AFF);
      color: white;
      
      &:hover {
        background: #0056CC;
      }
    }
    
    .confirm-delete-btn {
      background: var(--ios-red, #FF3B30);
      color: white;
      
      &:hover {
        background: #D70015;
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

// 动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

// 响应式设计
@media (max-width: 480px) {
  .expense-history {
    padding: 16px;
  }
  
  .history-header {
    h1 {
      font-size: 28px;
    }
  }
  
  .statistics-overview {
    flex-direction: column;
    gap: 12px;
    
    .stat-item {
      padding: 12px;
    }
  }
  
  .filter-modal,
  .delete-modal {
    margin: 10px;
    max-height: 90vh;
  }
}
</style>