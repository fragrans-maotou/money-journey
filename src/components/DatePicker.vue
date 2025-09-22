<template>
  <div class="date-picker">
    <div class="date-display" @click="showPicker = !showPicker">
      <div class="date-info">
        <span class="date-label">{{ label }}</span>
        <span class="date-value">{{ formattedDate }}</span>
      </div>
      <div class="date-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <!-- 日期选择器弹出层 -->
    <div v-if="showPicker" class="picker-overlay" @click="closePicker">
      <div class="picker-modal" @click.stop>
        <div class="picker-header">
          <h3>选择日期</h3>
          <button class="close-btn" @click="closePicker" type="button">×</button>
        </div>
        
        <div class="picker-content">
          <!-- 快捷选择 -->
          <div class="quick-select">
            <button
              v-for="option in quickOptions"
              :key="option.label"
              class="quick-option"
              :class="{ active: isQuickOptionActive(option) }"
              @click="selectQuickOption(option)"
              type="button"
            >
              {{ option.label }}
            </button>
          </div>
          
          <!-- 月份年份选择 -->
          <div class="month-year-selector">
            <button class="nav-btn" @click="previousMonth" type="button">‹</button>
            <div class="month-year">
              <span class="month">{{ currentMonthName }}</span>
              <span class="year">{{ currentYear }}</span>
            </div>
            <button class="nav-btn" @click="nextMonth" type="button">›</button>
          </div>
          
          <!-- 日历网格 -->
          <div class="calendar-grid">
            <!-- 星期标题 -->
            <div class="weekday-header">
              <div v-for="day in weekdays" :key="day" class="weekday">
                {{ day }}
              </div>
            </div>
            
            <!-- 日期网格 -->
            <div class="dates-grid">
              <button
                v-for="date in calendarDates"
                :key="date.key"
                class="date-cell"
                :class="{
                  'other-month': !date.isCurrentMonth,
                  'today': date.isToday,
                  'selected': date.isSelected,
                  'disabled': date.isDisabled
                }"
                :disabled="date.isDisabled"
                @click="selectDate(date.date)"
                type="button"
              >
                {{ date.day }}
              </button>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="picker-actions">
            <button class="cancel-btn" @click="closePicker" type="button">
              取消
            </button>
            <button class="confirm-btn" @click="confirmSelection" type="button">
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  modelValue?: Date
  label?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Date): void
  (e: 'change', value: Date): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '选择日期',
  placeholder: '请选择日期'
})

const emit = defineEmits<Emits>()

// ============================================================================
// Reactive State
// ============================================================================

const showPicker = ref(false)
const selectedDate = ref(props.modelValue || new Date())
const currentViewDate = ref(new Date(selectedDate.value))

// ============================================================================
// Constants
// ============================================================================

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

// 快捷选择选项
const quickOptions = [
  { label: '今天', getValue: () => new Date() },
  { label: '昨天', getValue: () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date
  }},
  { label: '本周一', getValue: () => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }},
  { label: '本月1号', getValue: () => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }}
]

// ============================================================================
// Computed Properties
// ============================================================================

const formattedDate = computed(() => {
  if (!selectedDate.value) return props.placeholder
  
  const date = selectedDate.value
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 检查是否是今天
  if (isSameDay(date, today)) {
    return '今天'
  }
  
  // 检查是否是昨天
  if (isSameDay(date, yesterday)) {
    return '昨天'
  }
  
  // 格式化为 MM月DD日
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  const currentYear = today.getFullYear()
  
  if (year === currentYear) {
    return `${month}月${day}日`
  } else {
    return `${year}年${month}月${day}日`
  }
})

const currentMonthName = computed(() => {
  return monthNames[currentViewDate.value.getMonth()]
})

const currentYear = computed(() => {
  return currentViewDate.value.getFullYear()
})

const calendarDates = computed(() => {
  const dates = []
  const viewDate = currentViewDate.value
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取第一周的开始日期（可能是上个月的日期）
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  // 生成6周的日期（42天）
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const isCurrentMonth = date.getMonth() === month
    const isToday = isSameDay(date, new Date())
    const isSelected = selectedDate.value && isSameDay(date, selectedDate.value)
    const isDisabled = isDateDisabled(date)
    
    dates.push({
      date: new Date(date),
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    })
  }
  
  return dates
})

// ============================================================================
// Methods
// ============================================================================

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

const isDateDisabled = (date: Date): boolean => {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  return false
}

const isQuickOptionActive = (option: any): boolean => {
  if (!selectedDate.value) return false
  return isSameDay(selectedDate.value, option.getValue())
}

const selectDate = (date: Date) => {
  if (isDateDisabled(date)) return
  selectedDate.value = new Date(date)
}

const selectQuickOption = (option: any) => {
  const date = option.getValue()
  if (!isDateDisabled(date)) {
    selectedDate.value = date
    currentViewDate.value = new Date(date)
  }
}

const previousMonth = () => {
  const newDate = new Date(currentViewDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentViewDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentViewDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentViewDate.value = newDate
}

const closePicker = () => {
  showPicker.value = false
}

const confirmSelection = () => {
  emit('update:modelValue', selectedDate.value)
  emit('change', selectedDate.value)
  closePicker()
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = new Date(newValue)
    currentViewDate.value = new Date(newValue)
  }
})
</script>

<style lang="scss" scoped>
.date-picker {
  .date-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: white;
    border: 1px solid #E5E5EA;
    border-radius: var(--ios-radius-medium, 12px);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--ios-blue, #007AFF);
    }
    
    .date-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .date-label {
        font-size: 12px;
        color: var(--ios-gray, #8e8e93);
        font-weight: 500;
      }
      
      .date-value {
        font-size: 16px;
        color: var(--ios-gray-dark, #1c1c1e);
        font-weight: 500;
      }
    }
    
    .date-icon {
      color: var(--ios-gray, #8e8e93);
      display: flex;
      align-items: center;
    }
  }
}

// 选择器弹出层
.picker-overlay {
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

.picker-modal {
  background: white;
  border-radius: var(--ios-radius-large, 16px);
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  overflow: hidden;
  
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 0;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0;
    }
    
    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--ios-gray-light, #f2f2f7);
      border-radius: 50%;
      font-size: 20px;
      color: var(--ios-gray, #8e8e93);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #E5E5EA;
      }
    }
  }
  
  .picker-content {
    padding: 20px;
    
    .quick-select {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      
      .quick-option {
        padding: 6px 12px;
        border: 1px solid #E5E5EA;
        border-radius: var(--ios-radius-small, 8px);
        background: white;
        color: var(--ios-gray-dark, #1c1c1e);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--ios-blue, #007AFF);
        }
        
        &.active {
          background: var(--ios-blue, #007AFF);
          color: white;
          border-color: var(--ios-blue, #007AFF);
        }
      }
    }
    
    .month-year-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .nav-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--ios-gray-light, #f2f2f7);
        border-radius: 50%;
        font-size: 18px;
        color: var(--ios-gray-dark, #1c1c1e);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: #E5E5EA;
        }
      }
      
      .month-year {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .month {
          font-size: 18px;
          font-weight: 600;
          color: var(--ios-gray-dark, #1c1c1e);
        }
        
        .year {
          font-size: 16px;
          color: var(--ios-gray, #8e8e93);
        }
      }
    }
    
    .calendar-grid {
      .weekday-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        margin-bottom: 8px;
        
        .weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: var(--ios-gray, #8e8e93);
          padding: 8px 0;
        }
      }
      
      .dates-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        
        .date-cell {
          aspect-ratio: 1;
          border: none;
          background: transparent;
          border-radius: var(--ios-radius-small, 8px);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &:hover:not(:disabled) {
            background: var(--ios-gray-light, #f2f2f7);
          }
          
          &.other-month {
            color: var(--ios-gray, #8e8e93);
            opacity: 0.5;
          }
          
          &.today {
            background: var(--ios-blue, #007AFF);
            color: white;
            
            &:hover {
              background: #0056CC;
            }
          }
          
          &.selected {
            background: var(--ios-blue, #007AFF);
            color: white;
            
            &:hover {
              background: #0056CC;
            }
          }
          
          &.disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
        }
      }
    }
    
    .picker-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      
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
          transform: scale(0.95);
        }
      }
      
      .cancel-btn {
        background: var(--ios-gray-light, #f2f2f7);
        color: var(--ios-gray-dark, #1c1c1e);
        
        &:hover {
          background: #E5E5EA;
        }
      }
      
      .confirm-btn {
        background: var(--ios-blue, #007AFF);
        color: white;
        
        &:hover {
          background: #0056CC;
        }
      }
    }
  }
}
</style>