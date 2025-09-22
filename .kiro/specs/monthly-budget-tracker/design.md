# 设计文档

## 概览

月度预算跟踪器是一个基于 Vue 3 + Vite 的移动端 H5 单页应用，采用组件化架构和 Composition API 进行状态管理。应用的核心是动态预算分配算法，结合 iOS 风格的用户界面设计，为用户提供直观、流畅的预算管理体验。

## 架构

### 整体架构模式

```
┌─────────────────────────────────────────┐
│                 View Layer              │
│  (Vue 3 Components + iOS-style UI)     │
├─────────────────────────────────────────┤
│              Business Logic             │
│     (Composition API + Composables)    │
├─────────────────────────────────────────┤
│               Data Layer                │
│        (localStorage + Reactive)       │
└─────────────────────────────────────────┘
```

### 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Composition API + Pinia (轻量级状态管理)
- **路由**: Vue Router 4
- **UI 框架**: 自定义 iOS 风格组件库
- **动画**: Vue Transition + CSS3 Animations
- **数据持久化**: localStorage
- **测试框架**: Vitest + Vue Test Utils
- **类型检查**: TypeScript
- **样式**: SCSS + CSS Modules

## 组件和接口

### 核心组件架构

```
App.vue
├── Layout/
│   ├── TabBar.vue (底部导航)
│   ├── NavigationBar.vue (顶部导航)
│   └── SafeArea.vue (安全区域适配)
├── Views/
│   ├── Dashboard.vue (仪表盘)
│   ├── BudgetSettings.vue (预算设置)
│   ├── ExpenseRecord.vue (消费记录)
│   ├── Statistics.vue (统计分析)
│   └── Profile.vue (个人设置)
├── Components/
│   ├── BudgetCard.vue (预算卡片)
│   ├── ExpenseItem.vue (消费条目)
│   ├── CategoryPicker.vue (分类选择器)
│   ├── AmountInput.vue (金额输入)
│   ├── DatePicker.vue (日期选择器)
│   ├── ProgressRing.vue (进度环)
│   ├── ChartView.vue (图表组件)
│   └── ActionSheet.vue (操作表单)
└── Composables/
    ├── useBudget.ts (预算管理)
    ├── useExpense.ts (消费管理)
    ├── useStorage.ts (数据持久化)
    ├── useStatistics.ts (统计分析)
    └── useGesture.ts (手势处理)
```

### 核心 Composables 接口

#### useBudget.ts
```typescript
interface BudgetComposable {
  // 状态
  monthlyBudget: Ref<number>
  dailyBudget: Ref<number>
  availableBudget: Ref<number>
  totalSpent: Ref<number>
  
  // 方法
  setMonthlyBudget: (amount: number) => void
  calculateDailyBudget: () => number
  calculateAvailableBudget: (date: Date) => number
  updateBudgetAllocation: () => void
  
  // 动态分配算法
  applyCarryOverMechanism: (date: Date) => number
}
```

#### useExpense.ts
```typescript
interface ExpenseComposable {
  // 状态
  expenses: Ref<Expense[]>
  categories: Ref<Category[]>
  
  // 方法
  addExpense: (expense: ExpenseInput) => Promise<void>
  updateExpense: (id: string, expense: ExpenseInput) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  getExpensesByDate: (date: Date) => Expense[]
  getExpensesByCategory: (categoryId: string) => Expense[]
}
```

### 路由设计

```typescript
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '预算概览', showTabBar: true }
  },
  {
    path: '/budget-settings',
    name: 'BudgetSettings',
    component: BudgetSettings,
    meta: { title: '预算设置', showTabBar: false }
  },
  {
    path: '/expense-record',
    name: 'ExpenseRecord',
    component: ExpenseRecord,
    meta: { title: '记录消费', showTabBar: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { title: '统计分析', showTabBar: true }
  }
]
```

## 数据模型

### 核心数据结构

```typescript
// 预算模型
interface Budget {
  id: string
  monthlyAmount: number
  startDate: Date
  endDate: Date
  dailyAllocation: DailyAllocation[]
  createdAt: Date
  updatedAt: Date
}

// 日预算分配
interface DailyAllocation {
  date: Date
  baseAmount: number        // 基础日均预算
  carryOverAmount: number   // 累积金额
  availableAmount: number   // 实际可用金额
  spentAmount: number       // 已消费金额
  remainingAmount: number   // 剩余金额
}

// 消费记录
interface Expense {
  id: string
  amount: number
  categoryId: string
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

// 消费分类
interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
}

// 统计数据
interface Statistics {
  period: 'week' | 'month' | 'custom'
  startDate: Date
  endDate: Date
  totalSpent: number
  budgetUtilization: number
  categoryBreakdown: CategoryStat[]
  dailyTrend: DailyTrendPoint[]
}
```

### 动态预算分配算法

```typescript
class BudgetAllocationEngine {
  /**
   * 核心算法：计算指定日期的可用预算
   * 实现余额累进机制，而非简单的线性计算
   */
  calculateAvailableBudget(date: Date, budget: Budget, expenses: Expense[]): number {
    const dailyBase = budget.monthlyAmount / this.getDaysInMonth(date)
    let availableAmount = dailyBase
    
    // 累积前几天的剩余金额
    const previousDays = this.getPreviousDays(date, budget.startDate)
    for (const day of previousDays) {
      const dayExpenses = this.getExpensesByDate(day, expenses)
      const daySpent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const dayRemaining = dailyBase - daySpent
      
      if (dayRemaining > 0) {
        availableAmount += dayRemaining
      } else {
        // 如果某天超支，从后续预算中扣除
        availableAmount += dayRemaining // dayRemaining 是负数
      }
    }
    
    return Math.max(0, availableAmount)
  }
  
  /**
   * 预算重新分配：当用户修改月度预算时调用
   */
  reallocateBudget(newMonthlyAmount: number, currentDate: Date): DailyAllocation[] {
    const remainingDays = this.getRemainingDays(currentDate)
    const spentAmount = this.getTotalSpentThisMonth()
    const remainingBudget = newMonthlyAmount - spentAmount
    
    // 重新计算剩余天数的日均预算
    const newDailyBase = remainingBudget / remainingDays
    
    return this.generateDailyAllocations(currentDate, newDailyBase)
  }
}
```

## 错误处理

### 错误分类与处理策略

```typescript
// 错误类型定义
enum ErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// 错误处理器
class ErrorHandler {
  handleStorageError(error: Error): void {
    // localStorage 错误处理
    console.error('Storage error:', error)
    this.showErrorToast('数据保存失败，请检查存储空间')
    this.attemptDataRecovery()
  }
  
  handleValidationError(field: string, value: any): void {
    // 数据验证错误
    this.showFieldError(field, '请输入有效的数值')
  }
  
  handleCalculationError(error: Error): void {
    // 预算计算错误
    console.error('Calculation error:', error)
    this.showErrorToast('预算计算出现问题，请重试')
    this.resetToSafeState()
  }
}
```

### 数据恢复机制

```typescript
class DataRecoveryService {
  async attemptRecovery(): Promise<boolean> {
    try {
      // 1. 检查备份数据
      const backupData = this.getBackupData()
      if (backupData) {
        await this.restoreFromBackup(backupData)
        return true
      }
      
      // 2. 重建基础数据结构
      await this.initializeDefaultData()
      return true
    } catch (error) {
      console.error('Recovery failed:', error)
      return false
    }
  }
}
```

## 测试策略

### 测试层级

1. **单元测试** (Vitest)
   - Composables 逻辑测试
   - 预算分配算法测试
   - 数据模型验证测试
   - 工具函数测试

### 关键测试用例

```typescript
// 预算分配算法测试
describe('BudgetAllocationEngine', () => {
  test('should carry over remaining budget to next day', () => {
    const engine = new BudgetAllocationEngine()
    const budget = createMockBudget(1200) // 月预算 1200
    const expenses = [
      createMockExpense(30, '2024-01-01') // 第一天消费 30
    ]
    
    const availableBudget = engine.calculateAvailableBudget(
      new Date('2024-01-02'), 
      budget, 
      expenses
    )
    
    // 日均 40，第一天剩余 10，第二天应该有 50
    expect(availableBudget).toBe(50)
  })
  
  test('should handle overspending correctly', () => {
    // 测试超支情况的处理
  })
})
```

### iOS 风格 UI 实现

#### 设计系统

```scss
// iOS 设计令牌
:root {
  // 颜色系统
  --ios-blue: #007AFF;
  --ios-green: #34C759;
  --ios-red: #FF3B30;
  --ios-orange: #FF9500;
  --ios-gray: #8E8E93;
  --ios-gray-light: #F2F2F7;
  --ios-gray-dark: #1C1C1E;
  
  // 圆角
  --ios-radius-small: 8px;
  --ios-radius-medium: 12px;
  --ios-radius-large: 16px;
  
  // 阴影
  --ios-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --ios-shadow-large: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  // 字体
  --ios-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// 高斯模糊效果
.ios-blur {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.8);
}

// iOS 风格按钮
.ios-button {
  border-radius: var(--ios-radius-medium);
  border: none;
  font-family: var(--ios-font-family);
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
}
```

#### 手势处理

```typescript
// 滑动返回手势
export function useSwipeBack() {
  const router = useRouter()
  let startX = 0
  let startY = 0
  
  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startX
    const deltaY = endY - startY
    
    // 从左边缘向右滑动且水平距离大于垂直距离
    if (startX < 20 && deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      router.back()
    }
  }
  
  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
  })
  
  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchend', handleTouchEnd)
  })
}
```

### 性能优化策略

1. **代码分割**: 路由级别的懒加载
2. **组件懒加载**: 非关键组件按需加载
3. **虚拟滚动**: 长列表优化
4. **缓存策略**: localStorage 数据缓存
5. **图片优化**: WebP 格式 + 懒加载
6. **Bundle 优化**: Tree-shaking + 压缩

### 部署与构建

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          charts: ['chart.js']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
```