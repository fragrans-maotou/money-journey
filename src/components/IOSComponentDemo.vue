<template>
  <div class="ios-demo">
    <div class="ios-demo__section">
      <h2 class="ios-demo__title">iOS 风格按钮</h2>
      <div class="ios-demo__buttons">
        <IOSButton variant="primary">主要按钮</IOSButton>
        <IOSButton variant="secondary">次要按钮</IOSButton>
        <IOSButton variant="destructive">危险按钮</IOSButton>
        <IOSButton variant="plain">纯文本按钮</IOSButton>
      </div>
      
      <div class="ios-demo__buttons">
        <IOSButton size="small">小按钮</IOSButton>
        <IOSButton size="medium">中按钮</IOSButton>
        <IOSButton size="large">大按钮</IOSButton>
      </div>
      
      <div class="ios-demo__buttons">
        <IOSButton :loading="true">加载中</IOSButton>
        <IOSButton :disabled="true">禁用按钮</IOSButton>
        <IOSButton full-width>全宽按钮</IOSButton>
      </div>
    </div>

    <div class="ios-demo__section">
      <h2 class="ios-demo__title">iOS 风格输入框</h2>
      <div class="ios-demo__inputs">
        <IOSInput
          v-model="textValue"
          label="文本输入"
          placeholder="请输入文本"
          clearable
        />
        
        <IOSInput
          v-model="numberValue"
          type="number"
          label="数字输入"
          placeholder="请输入数字"
          :min="0"
          :max="1000"
        />
        
        <IOSInput
          v-model="emailValue"
          type="email"
          label="邮箱输入"
          placeholder="请输入邮箱"
          :error="emailError"
        />
        
        <IOSInput
          v-model="passwordValue"
          type="password"
          label="密码输入"
          placeholder="请输入密码"
          hint="密码长度至少6位"
        />
      </div>
    </div>

    <div class="ios-demo__section">
      <h2 class="ios-demo__title">iOS 风格卡片</h2>
      <div class="ios-demo__cards">
        <IOSCard variant="default">
          <template #header>
            <h3>默认卡片</h3>
          </template>
          <p>这是一个默认样式的卡片内容。</p>
          <template #footer>
            <IOSButton size="small">操作</IOSButton>
          </template>
        </IOSCard>
        
        <IOSCard variant="elevated" clickable @click="handleCardClick">
          <h3>可点击卡片</h3>
          <p>这是一个带阴影且可点击的卡片。</p>
        </IOSCard>
        
        <IOSCard variant="outlined" padding="large">
          <h3>边框卡片</h3>
          <p>这是一个带边框的卡片，使用大内边距。</p>
        </IOSCard>
      </div>
    </div>

    <div class="ios-demo__section">
      <h2 class="ios-demo__title">iOS 风格操作表单</h2>
      <IOSButton @click="showActionSheet = true">显示操作表单</IOSButton>
      
      <IOSActionSheet
        v-model:visible="showActionSheet"
        title="选择操作"
        message="请选择你要执行的操作"
        :actions="actionSheetActions"
        @action="handleActionSheetAction"
        @cancel="handleActionSheetCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IOSButton, IOSInput, IOSCard, IOSActionSheet, type ActionSheetAction } from './ui'

// 响应式数据
const textValue = ref('')
const numberValue = ref<number>()
const emailValue = ref('')
const passwordValue = ref('')
const showActionSheet = ref(false)

// 邮箱验证错误
const emailError = computed(() => {
  if (!emailValue.value) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(emailValue.value) ? '' : '请输入有效的邮箱地址'
})

// 操作表单配置
const actionSheetActions: ActionSheetAction[] = [
  {
    text: '拍照',
    icon: '📷',
    handler: () => console.log('拍照')
  },
  {
    text: '从相册选择',
    icon: '🖼️',
    handler: () => console.log('从相册选择')
  },
  {
    text: '删除',
    icon: '🗑️',
    type: 'destructive',
    handler: () => console.log('删除')
  },
  {
    text: '禁用选项',
    icon: '🚫',
    type: 'disabled'
  }
]

// 事件处理
const handleCardClick = () => {
  console.log('卡片被点击')
}

const handleActionSheetAction = (action: ActionSheetAction, index: number) => {
  console.log('选择了操作:', action.text, '索引:', index)
}

const handleActionSheetCancel = () => {
  console.log('取消操作表单')
}
</script>

<style lang="scss" scoped>
.ios-demo {
  padding: var(--ios-spacing-xl);
  max-width: 600px;
  margin: 0 auto;
}

.ios-demo__section {
  margin-bottom: var(--ios-spacing-3xl);
}

.ios-demo__title {
  font-size: var(--ios-font-size-title2);
  font-weight: var(--ios-font-weight-bold);
  color: var(--ios-label);
  margin-bottom: var(--ios-spacing-lg);
}

.ios-demo__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ios-spacing-md);
  margin-bottom: var(--ios-spacing-lg);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.ios-demo__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg);
}

.ios-demo__cards {
  display: flex;
  flex-direction: column;
  gap: var(--ios-spacing-lg);
}
</style>