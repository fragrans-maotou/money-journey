<template>
  <div class="category-picker">
    <div class="picker-header">
      <h3>选择分类</h3>
      <button 
        class="add-category-btn"
        @click="showAddCategory = true"
        type="button"
      >
        <span class="icon">+</span>
        添加分类
      </button>
    </div>
    
    <div class="categories-grid">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategoryId === category.id }"
        @click="selectCategory(category.id)"
        type="button"
      >
        <div class="category-icon" :style="{ backgroundColor: category.color }">
          {{ category.icon }}
        </div>
        <span class="category-name">{{ category.name }}</span>
      </button>
    </div>

    <!-- 添加分类模态框 -->
    <div v-if="showAddCategory" class="modal-overlay" @click="closeAddCategory">
      <div class="add-category-modal" @click.stop>
        <div class="modal-header">
          <h4>添加新分类</h4>
          <button class="close-btn" @click="closeAddCategory" type="button">×</button>
        </div>
        
        <form @submit.prevent="handleAddCategory" class="add-category-form">
          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="newCategory.name"
              type="text"
              placeholder="请输入分类名称"
              maxlength="10"
              required
            />
          </div>
          
          <div class="form-group">
            <label>选择图标</label>
            <div class="icon-grid">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                type="button"
                class="icon-option"
                :class="{ active: newCategory.icon === icon }"
                @click="newCategory.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>选择颜色</label>
            <div class="color-grid">
              <button
                v-for="color in availableColors"
                :key="color"
                type="button"
                class="color-option"
                :class="{ active: newCategory.color === color }"
                :style="{ backgroundColor: color }"
                @click="newCategory.color = color"
              />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeAddCategory">
              取消
            </button>
            <button 
              type="submit" 
              class="confirm-btn"
              :disabled="!isNewCategoryValid || isLoading"
            >
              {{ isLoading ? '添加中...' : '确认添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useExpense } from '@/composables/useExpense'
import type { CategoryInput } from '@/types'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  modelValue?: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', categoryId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择分类'
})

const emit = defineEmits<Emits>()

// ============================================================================
// Composables
// ============================================================================

const { categories, addCategory, isLoading, error } = useExpense()

// ============================================================================
// Reactive State
// ============================================================================

const selectedCategoryId = ref(props.modelValue || '')
const showAddCategory = ref(false)

const newCategory = ref<CategoryInput>({
  name: '',
  icon: '📝',
  color: '#95A5A6'
})

// 可用图标
const availableIcons = [
  '🍽️', '🚗', '🛍️', '🎬', '🏥', '📚', '📝', '💰', '🏠', '⚡',
  '📱', '👕', '🎮', '✈️', '🚌', '🚇', '⛽', '🍕', '☕', '🍺',
  '💊', '🏃', '🎵', '📖', '🎨', '🔧', '🎁', '💄', '🧴', '🌟'
]

// 可用颜色
const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#95A5A6', '#E17055', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E',
  '#6C5CE7', '#00B894', '#E84393', '#2D3436', '#636E72', '#00CEC9'
]

// ============================================================================
// Computed Properties
// ============================================================================

const isNewCategoryValid = computed(() => {
  return newCategory.value.name.trim().length > 0 &&
         newCategory.value.icon &&
         newCategory.value.color
})

// ============================================================================
// Methods
// ============================================================================

const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId
  emit('update:modelValue', categoryId)
  emit('change', categoryId)
}

const closeAddCategory = () => {
  showAddCategory.value = false
  resetNewCategory()
}

const resetNewCategory = () => {
  newCategory.value = {
    name: '',
    icon: '📝',
    color: '#95A5A6'
  }
}

const handleAddCategory = async () => {
  if (!isNewCategoryValid.value) return

  try {
    const category = await addCategory(newCategory.value)
    
    // 自动选择新添加的分类
    selectCategory(category.id)
    
    // 关闭模态框
    closeAddCategory()
  } catch (err) {
    console.error('Failed to add category:', err)
    // 错误处理已在 useExpense 中完成
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.modelValue, (newValue) => {
  selectedCategoryId.value = newValue || ''
})
</script>

<style lang="scss" scoped>
.category-picker {
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ios-gray-dark, #1c1c1e);
      margin: 0;
    }
    
    .add-category-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--ios-blue, #007AFF);
      color: white;
      border: none;
      border-radius: var(--ios-radius-small, 8px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      .icon {
        font-size: 16px;
        font-weight: 600;
      }
      
      &:hover {
        background: #0056CC;
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
    
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      background: white;
      border: 2px solid transparent;
      border-radius: var(--ios-radius-medium, 12px);
      cursor: pointer;
      transition: all 0.2s ease;
      
      .category-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .category-name {
        font-size: 12px;
        font-weight: 500;
        color: var(--ios-gray-dark, #1c1c1e);
        text-align: center;
        line-height: 1.2;
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--ios-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &.active {
        border-color: var(--ios-blue, #007AFF);
        background: rgba(0, 122, 255, 0.05);
      }
    }
  }
}

// 模态框样式
.modal-overlay {
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

.add-category-modal {
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
    padding: 20px 20px 0;
    
    h4 {
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
  
  .add-category-form {
    padding: 20px;
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--ios-gray-dark, #1c1c1e);
        margin-bottom: 8px;
      }
      
      input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #E5E5EA;
        border-radius: var(--ios-radius-medium, 12px);
        font-size: 16px;
        background: white;
        
        &:focus {
          outline: none;
          border-color: var(--ios-blue, #007AFF);
        }
      }
    }
    
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      
      .icon-option {
        width: 40px;
        height: 40px;
        border: 2px solid transparent;
        border-radius: var(--ios-radius-small, 8px);
        background: var(--ios-gray-light, #f2f2f7);
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        
        &:hover {
          background: #E5E5EA;
        }
        
        &.active {
          border-color: var(--ios-blue, #007AFF);
          background: rgba(0, 122, 255, 0.1);
        }
      }
    }
    
    .color-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      
      .color-option {
        width: 32px;
        height: 32px;
        border: 3px solid transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.1);
        }
        
        &.active {
          border-color: var(--ios-gray-dark, #1c1c1e);
        }
      }
    }
    
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      
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
        
        &:hover:not(:disabled) {
          background: #0056CC;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>