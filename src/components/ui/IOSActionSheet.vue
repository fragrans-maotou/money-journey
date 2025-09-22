<template>
  <Teleport to="body">
    <Transition
      name="ios-action-sheet"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="visible"
        class="ios-action-sheet-overlay"
        @click="handleOverlayClick"
        @touchmove.prevent
      >
        <div
          ref="actionSheetRef"
          class="ios-action-sheet"
          @click.stop
        >
          <!-- 标题区域 -->
          <div v-if="title || message" class="ios-action-sheet__header">
            <h3 v-if="title" class="ios-action-sheet__title">{{ title }}</h3>
            <p v-if="message" class="ios-action-sheet__message">{{ message }}</p>
          </div>
          
          <!-- 操作按钮组 -->
          <div class="ios-action-sheet__actions">
            <button
              v-for="(action, index) in actions"
              :key="index"
              :class="getActionClasses(action)"
              @click="handleActionClick(action)"
            >
              <span v-if="action.icon" class="ios-action-sheet__action-icon">
                {{ action.icon }}
              </span>
              <span class="ios-action-sheet__action-text">{{ action.text }}</span>
            </button>
          </div>
          
          <!-- 取消按钮 -->
          <div v-if="showCancel" class="ios-action-sheet__cancel">
            <button
              class="ios-action-sheet__cancel-button"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface ActionSheetAction {
  text: string
  icon?: string
  type?: 'default' | 'destructive' | 'disabled'
  handler?: () => void | Promise<void>
}

interface Props {
  visible: boolean
  title?: string
  message?: string
  actions: ActionSheetAction[]
  showCancel?: boolean
  cancelText?: string
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCancel: true,
  cancelText: '取消',
  closeOnOverlay: true
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  cancel: []
  action: [action: ActionSheetAction, index: number]
}>()

const actionSheetRef = ref<HTMLElement>()

const getActionClasses = (action: ActionSheetAction) => [
  'ios-action-sheet__action',
  {
    'ios-action-sheet__action--destructive': action.type === 'destructive',
    'ios-action-sheet__action--disabled': action.type === 'disabled'
  }
]

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

const handleActionClick = async (action: ActionSheetAction) => {
  if (action.type === 'disabled') return
  
  const index = props.actions.indexOf(action)
  emit('action', action, index)
  
  if (action.handler) {
    await action.handler()
  }
  
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const close = () => {
  emit('update:visible', false)
}

const onEnter = async (el: Element) => {
  await nextTick()
  const actionSheet = el.querySelector('.ios-action-sheet') as HTMLElement
  if (actionSheet) {
    actionSheet.style.transform = 'translateY(0)'
  }
}

const onLeave = (el: Element) => {
  const actionSheet = el.querySelector('.ios-action-sheet') as HTMLElement
  if (actionSheet) {
    actionSheet.style.transform = 'translateY(100%)'
  }
}

// 阻止背景滚动
const preventScroll = (e: TouchEvent) => {
  e.preventDefault()
}

// 监听键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

// 组件挂载时添加事件监听
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', handleKeydown)
}
</script>

<style lang="scss" scoped>
.ios-action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.ios-action-sheet {
  width: 100%;
  max-width: 400px;
  margin: var(--ios-spacing-lg);
  margin-bottom: calc(var(--ios-spacing-lg) + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform var(--ios-duration-normal) var(--ios-ease-out);
}

.ios-action-sheet__header {
  background-color: var(--ios-secondary-grouped-background);
  border-radius: var(--ios-radius-large) var(--ios-radius-large) 0 0;
  padding: var(--ios-spacing-lg);
  text-align: center;
  border-bottom: 1px solid var(--ios-separator);
}

.ios-action-sheet__title {
  font-size: var(--ios-font-size-footnote);
  font-weight: var(--ios-font-weight-semibold);
  color: var(--ios-secondary-label);
  margin: 0 0 var(--ios-spacing-xs) 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ios-action-sheet__message {
  font-size: var(--ios-font-size-subheadline);
  color: var(--ios-label);
  margin: 0;
  line-height: 1.4;
}

.ios-action-sheet__actions {
  background-color: var(--ios-secondary-grouped-background);
  border-radius: var(--ios-radius-large);
  overflow: hidden;
  
  .ios-action-sheet__header + & {
    border-radius: 0 0 var(--ios-radius-large) var(--ios-radius-large);
  }
}

.ios-action-sheet__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 56px;
  padding: var(--ios-spacing-lg);
  border: none;
  background: transparent;
  font-family: var(--ios-font-family);
  font-size: var(--ios-font-size-body);
  font-weight: var(--ios-font-weight-regular);
  color: var(--ios-blue);
  cursor: pointer;
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--ios-separator);
  }
  
  &:active {
    background-color: var(--ios-gray-6);
  }
  
  &--destructive {
    color: var(--ios-red);
  }
  
  &--disabled {
    color: var(--ios-tertiary-label);
    cursor: not-allowed;
    
    &:active {
      background: transparent;
    }
  }
}

.ios-action-sheet__action-icon {
  margin-right: var(--ios-spacing-sm);
  font-size: var(--ios-font-size-title3);
}

.ios-action-sheet__action-text {
  flex: 1;
}

.ios-action-sheet__cancel {
  margin-top: var(--ios-spacing-sm);
}

.ios-action-sheet__cancel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 56px;
  padding: var(--ios-spacing-lg);
  border: none;
  border-radius: var(--ios-radius-large);
  background-color: var(--ios-secondary-grouped-background);
  font-family: var(--ios-font-family);
  font-size: var(--ios-font-size-body);
  font-weight: var(--ios-font-weight-semibold);
  color: var(--ios-blue);
  cursor: pointer;
  transition: all var(--ios-duration-fast) var(--ios-ease-out);
  
  &:active {
    background-color: var(--ios-gray-6);
  }
}

// 动画
.ios-action-sheet-enter-active,
.ios-action-sheet-leave-active {
  transition: opacity var(--ios-duration-normal) var(--ios-ease-out);
}

.ios-action-sheet-enter-from,
.ios-action-sheet-leave-to {
  opacity: 0;
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .ios-action-sheet-overlay {
    background-color: rgba(0, 0, 0, 0.6);
  }
  
  .ios-action-sheet__action:active,
  .ios-action-sheet__cancel-button:active {
    background-color: var(--ios-tertiary-system-background);
  }
}
</style>