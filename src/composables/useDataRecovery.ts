import { ref, readonly } from 'vue'
import type { 
  Budget, 
  Expense, 
  Category, 
  StorageData,
  RecoveryResult,
  RecoveryAction
} from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { useErrorHandler } from './useErrorHandler'
import { useToast } from './useToast'
import { generateId } from '@/types/utils'

/**
 * Data recovery and backup composable
 * Provides comprehensive data backup, recovery, and restoration capabilities
 */
export function useDataRecovery() {
  // ============================================================================
  // Dependencies
  // ============================================================================

  const { handleError } = useErrorHandler()
  const { showToast, showSuccess, showError } = useToast()

  // ============================================================================
  // State
  // ============================================================================

  const isRecovering = ref(false)
  const isBackingUp = ref(false)
  const lastBackupDate = ref<Date | null>(null)
  const recoveryHistory = ref<RecoveryResult[]>([])

  // ============================================================================
  // Constants
  // ============================================================================

  const BACKUP_PREFIX = 'backup_'
  const RECOVERY_LOG_KEY = 'recovery_log'
  const AUTO_BACKUP_KEY = 'auto_backup_'
  const BACKUP_RETENTION_DAYS = 30
  const MAX_RECOVERY_HISTORY = 10

  // ============================================================================
  // Backup Operations
  // ============================================================================

  const createBackup = async (
    data: StorageData,
    label?: string
  ): Promise<string> => {
    isBackingUp.value = true

    try {
      const backupId = generateId()
      const timestamp = new Date()
      
      const backupData = {
        id: backupId,
        label: label || `备份 ${timestamp.toLocaleString()}`,
        data,
        timestamp: timestamp.toISOString(),
        version: '1.0.0',
        size: JSON.stringify(data).length,
        checksum: generateChecksum(data)
      }

      const backupKey = `${BACKUP_PREFIX}${backupId}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))
      
      lastBackupDate.value = timestamp
      
      showSuccess('数据备份成功')
      return backupId

    } catch (error) {
      const errorMessage = '创建备份失败'
      showError(errorMessage)
      await handleError(error as Error, { context: { operation: 'createBackup' } })
      throw new Error(errorMessage)
    } finally {
      isBackingUp.value = false
    }
  }

  const createAutoBackup = async (data: StorageData): Promise<void> => {
    try {
      const timestamp = new Date()
      const autoBackupKey = `${AUTO_BACKUP_KEY}${timestamp.toISOString().split('T')[0]}`
      
      const backupData = {
        data,
        timestamp: timestamp.toISOString(),
        automatic: true
      }

      localStorage.setItem(autoBackupKey, JSON.stringify(backupData))
      
      // Clean up old auto backups
      await cleanupOldAutoBackups()
      
    } catch (error) {
      console.warn('Auto backup failed:', error)
      // Don't show error toast for auto backup failures
    }
  }

  const getAvailableBackups = (): Array<{
    id: string
    label: string
    timestamp: Date
    size: number
    automatic: boolean
  }> => {
    const backups: Array<{
      id: string
      label: string
      timestamp: Date
      size: number
      automatic: boolean
    }> = []

    try {
      // Get manual backups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(BACKUP_PREFIX)) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key) || '{}')
            backups.push({
              id: backupData.id,
              label: backupData.label,
              timestamp: new Date(backupData.timestamp),
              size: backupData.size || 0,
              automatic: false
            })
          } catch (error) {
            console.warn(`Failed to parse backup ${key}:`, error)
          }
        }
      }

      // Get auto backups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(AUTO_BACKUP_KEY)) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key) || '{}')
            backups.push({
              id: key,
              label: `自动备份 ${new Date(backupData.timestamp).toLocaleDateString()}`,
              timestamp: new Date(backupData.timestamp),
              size: JSON.stringify(backupData.data).length,
              automatic: true
            })
          } catch (error) {
            console.warn(`Failed to parse auto backup ${key}:`, error)
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    } catch (error) {
      console.error('Failed to get available backups:', error)
      return []
    }
  }

  const deleteBackup = async (backupId: string): Promise<void> => {
    try {
      const backupKey = backupId.startsWith(BACKUP_PREFIX) ? backupId : `${BACKUP_PREFIX}${backupId}`
      localStorage.removeItem(backupKey)
      showSuccess('备份已删除')
    } catch (error) {
      showError('删除备份失败')
      throw error
    }
  }

  // ============================================================================
  // Recovery Operations
  // ============================================================================

  const restoreFromBackup = async (backupId: string): Promise<RecoveryResult> => {
    isRecovering.value = true

    try {
      const backupKey = backupId.startsWith(BACKUP_PREFIX) || backupId.startsWith(AUTO_BACKUP_KEY) 
        ? backupId 
        : `${BACKUP_PREFIX}${backupId}`
      
      const backupStr = localStorage.getItem(backupKey)
      if (!backupStr) {
        throw new Error('备份文件不存在')
      }

      const backup = JSON.parse(backupStr)
      const backupData = backup.data || backup // Handle both manual and auto backup formats

      // Validate backup data
      const validation = validateBackupData(backupData)
      if (!validation.isValid) {
        throw new Error(`备份数据无效: ${validation.errors.join(', ')}`)
      }

      // Create current data backup before restoration
      const currentData = getCurrentData()
      await createBackup(currentData, '恢复前自动备份')

      // Restore data
      await restoreData(backupData)

      const result: RecoveryResult = {
        success: true,
        message: '数据恢复成功'
      }

      recordRecoveryAttempt(result)
      showSuccess('数据已成功恢复')
      
      return result

    } catch (error) {
      const result: RecoveryResult = {
        success: false,
        message: error instanceof Error ? error.message : '数据恢复失败'
      }

      recordRecoveryAttempt(result)
      showError(result.message)
      
      return result
    } finally {
      isRecovering.value = false
    }
  }

  const attemptAutoRecovery = async (): Promise<RecoveryResult> => {
    isRecovering.value = true

    try {
      // Try to recover from auto backup
      const autoBackups = getAvailableBackups().filter(b => b.automatic)
      if (autoBackups.length > 0) {
        const latestBackup = autoBackups[0]
        return await restoreFromBackup(latestBackup.id)
      }

      // Try to recover from manual backup
      const manualBackups = getAvailableBackups().filter(b => !b.automatic)
      if (manualBackups.length > 0) {
        const latestBackup = manualBackups[0]
        return await restoreFromBackup(latestBackup.id)
      }

      // No backups available, initialize with default data
      await initializeDefaultData()

      const result: RecoveryResult = {
        success: true,
        message: '已初始化默认数据'
      }

      recordRecoveryAttempt(result)
      showSuccess('已恢复到初始状态')
      
      return result

    } catch (error) {
      const result: RecoveryResult = {
        success: false,
        message: '自动恢复失败'
      }

      recordRecoveryAttempt(result)
      return result
    } finally {
      isRecovering.value = false
    }
  }

  const repairCorruptedData = async (): Promise<RecoveryResult> => {
    try {
      const currentData = getCurrentData()
      const repairedData = await performDataRepair(currentData)
      
      if (repairedData) {
        await restoreData(repairedData)
        
        const result: RecoveryResult = {
          success: true,
          message: '数据修复成功'
        }

        recordRecoveryAttempt(result)
        showSuccess('数据已修复')
        
        return result
      }

      throw new Error('无法修复数据')

    } catch (error) {
      const result: RecoveryResult = {
        success: false,
        message: '数据修复失败'
      }

      recordRecoveryAttempt(result)
      return result
    }
  }

  // ============================================================================
  // Data Validation and Repair
  // ============================================================================

  const validateBackupData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('备份数据格式无效')
      return { isValid: false, errors }
    }

    // Validate budgets
    if (data.budgets && !Array.isArray(data.budgets)) {
      errors.push('预算数据格式无效')
    }

    // Validate expenses
    if (data.expenses && !Array.isArray(data.expenses)) {
      errors.push('消费记录数据格式无效')
    }

    // Validate categories
    if (data.categories && !Array.isArray(data.categories)) {
      errors.push('分类数据格式无效')
    }

    return { isValid: errors.length === 0, errors }
  }

  const performDataRepair = async (data: StorageData): Promise<StorageData | null> => {
    try {
      const repairedData: StorageData = {
        budgets: [],
        expenses: [],
        categories: [],
        lastUpdated: new Date(),
        version: '1.0.0'
      }

      // Repair budgets
      if (Array.isArray(data.budgets)) {
        repairedData.budgets = data.budgets.filter(budget => 
          budget && 
          typeof budget.id === 'string' && 
          typeof budget.monthlyAmount === 'number' &&
          budget.monthlyAmount > 0
        ).map(budget => ({
          ...budget,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          createdAt: new Date(budget.createdAt),
          updatedAt: new Date(budget.updatedAt),
          dailyAllocation: budget.dailyAllocation || []
        }))
      }

      // Repair expenses
      if (Array.isArray(data.expenses)) {
        repairedData.expenses = data.expenses.filter(expense => 
          expense && 
          typeof expense.id === 'string' && 
          typeof expense.amount === 'number' &&
          expense.amount > 0
        ).map(expense => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt)
        }))
      }

      // Repair categories
      if (Array.isArray(data.categories)) {
        repairedData.categories = data.categories.filter(category => 
          category && 
          typeof category.id === 'string' && 
          typeof category.name === 'string'
        )
      }

      // Ensure default categories exist
      if (repairedData.categories.length === 0) {
        repairedData.categories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          id: generateId()
        }))
      }

      return repairedData

    } catch (error) {
      console.error('Data repair failed:', error)
      return null
    }
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getCurrentData = (): StorageData => {
    try {
      return {
        budgets: JSON.parse(localStorage.getItem('budgets') || '[]'),
        expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
        categories: JSON.parse(localStorage.getItem('categories') || '[]'),
        lastUpdated: new Date(),
        version: '1.0.0'
      }
    } catch (error) {
      return {
        budgets: [],
        expenses: [],
        categories: [],
        lastUpdated: new Date(),
        version: '1.0.0'
      }
    }
  }

  const restoreData = async (data: StorageData): Promise<void> => {
    localStorage.setItem('budgets', JSON.stringify(data.budgets))
    localStorage.setItem('expenses', JSON.stringify(data.expenses))
    localStorage.setItem('categories', JSON.stringify(data.categories))
  }

  const initializeDefaultData = async (): Promise<void> => {
    const defaultData: StorageData = {
      budgets: [],
      expenses: [],
      categories: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        id: generateId()
      })),
      lastUpdated: new Date(),
      version: '1.0.0'
    }

    await restoreData(defaultData)
  }

  const generateChecksum = (data: any): string => {
    // Simple checksum generation (in production, use a proper hash function)
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  const cleanupOldAutoBackups = async (): Promise<void> => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS)

      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(AUTO_BACKUP_KEY)) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key) || '{}')
            const backupDate = new Date(backupData.timestamp)
            if (backupDate < cutoffDate) {
              keysToRemove.push(key)
            }
          } catch (error) {
            // If we can't parse the backup, it's probably corrupted, remove it
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (keysToRemove.length > 0) {
        console.info(`Cleaned up ${keysToRemove.length} old auto backups`)
      }

    } catch (error) {
      console.warn('Failed to cleanup old auto backups:', error)
    }
  }

  const recordRecoveryAttempt = (result: RecoveryResult): void => {
    try {
      const history = [...recoveryHistory.value, result]
      
      // Keep only the last N recovery attempts
      if (history.length > MAX_RECOVERY_HISTORY) {
        history.splice(0, history.length - MAX_RECOVERY_HISTORY)
      }

      recoveryHistory.value = history

      // Also store in localStorage for persistence
      localStorage.setItem(RECOVERY_LOG_KEY, JSON.stringify(history))

    } catch (error) {
      console.warn('Failed to record recovery attempt:', error)
    }
  }

  const loadRecoveryHistory = (): void => {
    try {
      const historyStr = localStorage.getItem(RECOVERY_LOG_KEY)
      if (historyStr) {
        recoveryHistory.value = JSON.parse(historyStr)
      }
    } catch (error) {
      console.warn('Failed to load recovery history:', error)
      recoveryHistory.value = []
    }
  }

  // ============================================================================
  // Export/Import Functions
  // ============================================================================

  const exportData = (): string => {
    const data = getCurrentData()
    return JSON.stringify(data, null, 2)
  }

  const importData = async (jsonData: string): Promise<RecoveryResult> => {
    try {
      const data = JSON.parse(jsonData)
      
      const validation = validateBackupData(data)
      if (!validation.isValid) {
        throw new Error(`导入数据无效: ${validation.errors.join(', ')}`)
      }

      // Create backup before import
      const currentData = getCurrentData()
      await createBackup(currentData, '导入前自动备份')

      // Import data
      await restoreData(data)

      const result: RecoveryResult = {
        success: true,
        message: '数据导入成功'
      }

      recordRecoveryAttempt(result)
      showSuccess('数据已成功导入')
      
      return result

    } catch (error) {
      const result: RecoveryResult = {
        success: false,
        message: error instanceof Error ? error.message : '数据导入失败'
      }

      recordRecoveryAttempt(result)
      showError(result.message)
      
      return result
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  // Load recovery history on initialization
  loadRecoveryHistory()

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    isRecovering: readonly(isRecovering),
    isBackingUp: readonly(isBackingUp),
    lastBackupDate: readonly(lastBackupDate),
    recoveryHistory: readonly(recoveryHistory),

    // Backup operations
    createBackup,
    createAutoBackup,
    getAvailableBackups,
    deleteBackup,

    // Recovery operations
    restoreFromBackup,
    attemptAutoRecovery,
    repairCorruptedData,

    // Data validation
    validateBackupData,

    // Utility functions
    getCurrentData,
    initializeDefaultData,
    cleanupOldAutoBackups,

    // Export/Import
    exportData,
    importData
  }
}

// ============================================================================
// Global Data Recovery Instance
// ============================================================================

let globalDataRecovery: ReturnType<typeof useDataRecovery> | null = null

export function getGlobalDataRecovery() {
  if (!globalDataRecovery) {
    globalDataRecovery = useDataRecovery()
  }
  return globalDataRecovery
}