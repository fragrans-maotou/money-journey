<template>
  <div class="error-demo">
    <div class="demo-header">
      <h1>错误处理和用户反馈演示</h1>
      <p>演示全局错误处理、Toast 提示、加载状态和数据恢复功能</p>
    </div>

    <div class="demo-sections">
      <!-- Error Handling Demo -->
      <section class="demo-section">
        <h2>错误处理演示</h2>
        <div class="demo-buttons">
          <button @click="triggerValidationError" class="demo-btn demo-btn--warning">
            触发验证错误
          </button>
          <button @click="triggerStorageError" class="demo-btn demo-btn--danger">
            触发存储错误
          </button>
          <button @click="triggerCalculationError" class="demo-btn demo-btn--danger">
            触发计算错误
          </button>
          <button @click="triggerComponentError" class="demo-btn demo-btn--danger">
            触发组件错误
          </button>
        </div>
        
        <div v-if="errors.length > 0" class="error-list">
          <h3>当前错误列表:</h3>
          <div v-for="error in errors" :key="error.id" class="error-item">
            <div class="error-header">
              <span class="error-type">{{ getErrorTypeText(error.type) }}</span>
              <span class="error-severity" :class="`severity-${error.severity}`">
                {{ getSeverityText(error.severity) }}
              </span>
              <button @click="clearError(error.id)" class="clear-btn">清除</button>
            </div>
            <div class="error-message">{{ error.message }}</div>
            <div class="error-time">{{ formatTime(error.timestamp) }}</div>
          </div>
        </div>
      </section>

      <!-- Toast Demo -->
      <section class="demo-section">
        <h2>Toast 提示演示</h2>
        <div class="demo-buttons">
          <button @click="showSuccessToast" class="demo-btn demo-btn--success">
            成功提示
          </button>
          <button @click="showErrorToast" class="demo-btn demo-btn--danger">
            错误提示
          </button>
          <button @click="showWarningToast" class="demo-btn demo-btn--warning">
            警告提示
          </button>
          <button @click="showInfoToast" class="demo-btn demo-btn--info">
            信息提示
          </button>
          <button @click="showPersistentToast" class="demo-btn demo-btn--secondary">
            持久提示
          </button>
          <button @click="clearAllToasts" class="demo-btn demo-btn--secondary">
            清除所有
          </button>
        </div>
      </section>

      <!-- Loading State Demo -->
      <section class="demo-section">
        <h2>加载状态演示</h2>
        <div class="demo-buttons">
          <button @click="showSimpleLoading" class="demo-btn demo-btn--primary">
            简单加载
          </button>
          <button @click="showProgressLoading" class="demo-btn demo-btn--primary">
            进度加载
          </button>
          <button @click="showCancelableLoading" class="demo-btn demo-btn--primary">
            可取消加载
          </button>
          <button @click="showGlobalLoading" class="demo-btn demo-btn--primary">
            全局加载
          </button>
        </div>
        
        <div class="loading-info">
          <p>当前加载状态: {{ isLoading ? '加载中' : '空闲' }}</p>
          <p v-if="loadingMessage">加载消息: {{ loadingMessage }}</p>
          <p v-if="loadingProgress !== undefined">进度: {{ Math.round(loadingProgress) }}%</p>
        </div>
      </section>

      <!-- Data Recovery Demo -->
      <section class="demo-section">
        <h2>数据恢复演示</h2>
        <div class="demo-buttons">
          <button @click="createManualBackup" class="demo-btn demo-btn--success">
            创建备份
          </button>
          <button @click="showBackupList" class="demo-btn demo-btn--info">
            查看备份
          </button>
          <button @click="attemptRecovery" class="demo-btn demo-btn--warning">
            尝试恢复
          </button>
          <button @click="exportAppData" class="demo-btn demo-btn--secondary">
            导出数据
          </button>
        </div>
        
        <div v-if="backups.length > 0" class="backup-list">
          <h3>可用备份:</h3>
          <div v-for="backup in backups" :key="backup.id" class="backup-item">
            <div class="backup-info">
              <span class="backup-label">{{ backup.label }}</span>
              <span class="backup-time">{{ formatTime(backup.timestamp) }}</span>
              <span class="backup-size">{{ formatSize(backup.size) }}</span>
            </div>
            <div class="backup-actions">
              <button @click="restoreBackup(backup.id)" class="restore-btn">恢复</button>
              <button @click="deleteBackup(backup.id)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State Demo -->
      <section class="demo-section">
        <h2>空状态演示</h2>
        <div class="demo-buttons">
          <button @click="showEmptyState = !showEmptyState" class="demo-btn demo-btn--secondary">
            {{ showEmptyState ? '隐藏' : '显示' }}空状态
          </button>
        </div>
        
        <div v-if="showEmptyState" class="empty-state-container">
          <EmptyState
            title="暂无数据"
            message="这是一个空状态演示，您可以点击下方按钮来添加一些内容。"
            icon="📋"
            :actions="[
              {
                label: '添加数据',
                action: () => showSuccessToast(),
                style: 'primary',
                icon: '+'
              },
              {
                label: '刷新页面',
                action: () => window.location.reload(),
                style: 'secondary'
              }
            ]"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useToast } from '@/composables/useToast'
import { useLoadingState } from '@/composables/useLoadingState'
import { useDataRecovery } from '@/composables/useDataRecovery'
import { ErrorType, ErrorSeverity, ToastType } from '@/types/errors'
import EmptyState from '@/components/EmptyState.vue'

// ============================================================================
// Composables
// ============================================================================

const {
  handleError,
  handleStorageError,
  handleCalculationError,
  handleComponentError,
  handleValidationError,
  errors,
  clearError,
  clearAllErrors
} = useErrorHandler()

const {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  clearAllToasts
} = useToast()

const {
  startLoading,
  stopLoading,
  updateProgress,
  startGlobalLoading,
  stopGlobalLoading,
  updateGlobalProgress,
  isLoading,
  loadingMessage,
  loadingProgress,
  withLoading
} = useLoadingState()

const {
  createBackup,
  getAvailableBackups,
  restoreFromBackup,
  deleteBackup: removeBackup,
  attemptAutoRecovery,
  exportData,
  getCurrentData
} = useDataRecovery()

// ============================================================================
// State
// ============================================================================

const showEmptyState = ref(false)
const backups = ref<any[]>([])

// ============================================================================
// Error Handling Demo Methods
// ============================================================================

const triggerValidationError = () => {
  handleValidationError('amount', '请输入有效的金额', -100)
}

const triggerStorageError = async () => {
  const error = new Error('QuotaExceededError: Storage quota exceeded')
  await handleStorageError(error, { operation: 'save', key: 'demo-data' })
}

const triggerCalculationError = async () => {
  const error = new Error('Division by zero in budget calculation')
  await handleCalculationError(error, { budgetId: 'demo-budget', operation: 'calculate' })
}

const triggerComponentError = async () => {
  const error = new Error('Component rendering failed')
  await handleComponentError('DemoComponent', error, { props: { demo: true } })
}

// ============================================================================
// Toast Demo Methods
// ============================================================================

const showSuccessToast = () => {
  showSuccess('操作成功完成！', '成功')
}

const showErrorToast = () => {
  showError('操作失败，请重试', '错误', {
    actions: [
      {
        label: '重试',
        action: () => showSuccess('重试成功！')
      }
    ]
  })
}

const showWarningToast = () => {
  showWarning('请注意，这是一个警告消息', '警告')
}

const showInfoToast = () => {
  showInfo('这是一条信息提示', '提示')
}

const showPersistentToast = () => {
  showToast({
    type: ToastType.INFO,
    title: '持久提示',
    message: '这条消息不会自动消失，需要手动关闭',
    persistent: true,
    actions: [
      {
        label: '知道了',
        action: () => {}
      }
    ]
  })
}

// ============================================================================
// Loading State Demo Methods
// ============================================================================

const showSimpleLoading = async () => {
  await withLoading('simple-demo', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }, { message: '正在处理...' })
  
  showSuccess('处理完成！')
}

const showProgressLoading = async () => {
  const loadingKey = startLoading('progress-demo', {
    message: '正在上传文件...',
    showProgress: true
  })

  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200))
    updateProgress(loadingKey, i, `上传进度 ${i}%`)
  }

  stopLoading(loadingKey)
  showSuccess('文件上传完成！')
}

const showCancelableLoading = async () => {
  const loadingKey = startLoading('cancelable-demo', {
    message: '正在执行长时间操作...',
    cancelable: true,
    timeout: 10000,
    onCancel: () => {
      showWarning('操作已取消')
    },
    onTimeout: () => {
      showError('操作超时')
    }
  })

  await new Promise(resolve => setTimeout(resolve, 3000))
  stopLoading(loadingKey)
  showSuccess('操作完成！')
}

const showGlobalLoading = async () => {
  startGlobalLoading('正在初始化应用...')
  
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 300))
    updateGlobalProgress(i, `初始化进度 ${i}%`)
  }
  
  stopGlobalLoading()
  showSuccess('应用初始化完成！')
}

// ============================================================================
// Data Recovery Demo Methods
// ============================================================================

const createManualBackup = async () => {
  try {
    const currentData = getCurrentData()
    const backupId = await createBackup(currentData, `手动备份 ${new Date().toLocaleString()}`)
    showSuccess(`备份创建成功: ${backupId}`)
    refreshBackupList()
  } catch (error) {
    showError('创建备份失败')
  }
}

const showBackupList = () => {
  refreshBackupList()
  if (backups.value.length === 0) {
    showInfo('暂无可用备份')
  }
}

const refreshBackupList = () => {
  backups.value = getAvailableBackups()
}

const restoreBackup = async (backupId: string) => {
  try {
    const result = await restoreFromBackup(backupId)
    if (result.success) {
      showSuccess('数据恢复成功！')
    } else {
      showError(`恢复失败: ${result.message}`)
    }
  } catch (error) {
    showError('恢复操作失败')
  }
}

const deleteBackup = async (backupId: string) => {
  try {
    await removeBackup(backupId)
    refreshBackupList()
    showSuccess('备份已删除')
  } catch (error) {
    showError('删除备份失败')
  }
}

const attemptRecovery = async () => {
  try {
    const result = await attemptAutoRecovery()
    if (result.success) {
      showSuccess(`自动恢复成功: ${result.message}`)
    } else {
      showError(`自动恢复失败: ${result.message}`)
    }
  } catch (error) {
    showError('恢复操作失败')
  }
}

const exportAppData = () => {
  try {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess('数据导出成功！')
  } catch (error) {
    showError('数据导出失败')
  }
}

// ============================================================================
// Utility Methods
// ============================================================================

const getErrorTypeText = (type: ErrorType): string => {
  switch (type) {
    case ErrorType.VALIDATION_ERROR: return '验证错误'
    case ErrorType.STORAGE_ERROR: return '存储错误'
    case ErrorType.CALCULATION_ERROR: return '计算错误'
    case ErrorType.COMPONENT_ERROR: return '组件错误'
    case ErrorType.NETWORK_ERROR: return '网络错误'
    default: return '未知错误'
  }
}

const getSeverityText = (severity: ErrorSeverity): string => {
  switch (severity) {
    case ErrorSeverity.LOW: return '低'
    case ErrorSeverity.MEDIUM: return '中'
    case ErrorSeverity.HIGH: return '高'
    case ErrorSeverity.CRITICAL: return '严重'
    default: return '未知'
  }
}

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleString()
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Initialize backup list
refreshBackupList()
</script>

<style lang="scss" scoped>
.error-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 28px;
    color: #1C1C1E;
    margin-bottom: 8px;
  }
  
  p {
    color: #8E8E93;
    font-size: 16px;
  }
}

.demo-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.demo-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h2 {
    font-size: 20px;
    color: #1C1C1E;
    margin-bottom: 16px;
  }
}

.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.demo-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &--primary {
    background: #007AFF;
    color: white;
    
    &:hover {
      background: #0056CC;
    }
  }
  
  &--success {
    background: #34C759;
    color: white;
    
    &:hover {
      background: #28A745;
    }
  }
  
  &--danger {
    background: #FF3B30;
    color: white;
    
    &:hover {
      background: #D70015;
    }
  }
  
  &--warning {
    background: #FF9500;
    color: white;
    
    &:hover {
      background: #E6850E;
    }
  }
  
  &--info {
    background: #007AFF;
    color: white;
    
    &:hover {
      background: #0056CC;
    }
  }
  
  &--secondary {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
    
    &:hover {
      background: rgba(0, 122, 255, 0.2);
    }
  }
}

.error-list, .backup-list {
  margin-top: 20px;
  
  h3 {
    font-size: 16px;
    color: #1C1C1E;
    margin-bottom: 12px;
  }
}

.error-item, .backup-item {
  background: #F2F2F7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-type {
  font-weight: 600;
  color: #1C1C1E;
}

.error-severity {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  
  &.severity-low {
    background: #E3F2FD;
    color: #1976D2;
  }
  
  &.severity-medium {
    background: #FFF3E0;
    color: #F57C00;
  }
  
  &.severity-high {
    background: #FFEBEE;
    color: #D32F2F;
  }
  
  &.severity-critical {
    background: #FCE4EC;
    color: #C2185B;
  }
}

.clear-btn, .restore-btn, .delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}

.clear-btn, .delete-btn {
  background: #FF3B30;
  color: white;
}

.restore-btn {
  background: #34C759;
  color: white;
  margin-right: 8px;
}

.error-message {
  color: #3C3C43;
  font-size: 14px;
  margin-bottom: 4px;
}

.error-time {
  color: #8E8E93;
  font-size: 12px;
}

.loading-info {
  background: #F2F2F7;
  border-radius: 8px;
  padding: 12px;
  
  p {
    margin: 4px 0;
    font-size: 14px;
    color: #3C3C43;
  }
}

.backup-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.backup-label {
  font-weight: 600;
  color: #1C1C1E;
}

.backup-time, .backup-size {
  color: #8E8E93;
  font-size: 12px;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.empty-state-container {
  margin-top: 20px;
  min-height: 300px;
}

@media (max-width: 768px) {
  .error-demo {
    padding: 16px;
  }
  
  .demo-section {
    padding: 16px;
  }
  
  .demo-buttons {
    flex-direction: column;
  }
  
  .demo-btn {
    width: 100%;
  }
}
</style>