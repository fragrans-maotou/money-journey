// ============================================================================
// Error Types and Interfaces
// ============================================================================

export enum ErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  context?: Record<string, any>
  timestamp: Date
  stack?: string
  component?: string
  action?: string
  recoverable: boolean
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  attemptRecovery?: boolean
  fallbackAction?: () => void
}

// ============================================================================
// Toast Types
// ============================================================================

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ToastMessage {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: ToastAction[]
  timestamp: Date
}

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// ============================================================================
// Loading State Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
  cancelable?: boolean
  onCancel?: () => void
}

export interface LoadingOptions {
  message?: string
  timeout?: number
  showProgress?: boolean
  cancelable?: boolean
  onTimeout?: () => void
  onCancel?: () => void
}

// ============================================================================
// Empty State Types
// ============================================================================

export interface EmptyState {
  title: string
  message: string
  icon?: string
  illustration?: string
  actions?: EmptyStateAction[]
}

export interface EmptyStateAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
  icon?: string
}

// ============================================================================
// Recovery Types
// ============================================================================

export interface RecoveryAction {
  id: string
  label: string
  description: string
  action: () => Promise<boolean>
  priority: number
  automatic: boolean
}

export interface RecoveryResult {
  success: boolean
  message: string
  actions?: RecoveryAction[]
}