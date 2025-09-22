<template>
  <div class="tab-bar">
    <div class="tab-bar-background"></div>
    <div class="tab-bar-content">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="['tab-item', { active: currentRoute === tab.name }]"
        @click="navigateToTab(tab.name)"
      >
        <div class="tab-icon">
          <component :is="tab.icon" />
        </div>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Tab icons (using simple SVG icons for now)
const DashboardIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
    </svg>
  `
}

const ExpenseIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
    </svg>
  `
}

const StatsIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" fill="currentColor"/>
    </svg>
  `
}

const HistoryIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3M12,8V13L16.28,15.54L17.5,13.33L14.5,11.5V8H12Z" fill="currentColor"/>
    </svg>
  `
}

const SettingsIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor"/>
    </svg>
  `
}

const tabs = [
  {
    name: 'Dashboard',
    label: '概览',
    icon: DashboardIcon
  },
  {
    name: 'ExpenseRecord',
    label: '记录',
    icon: ExpenseIcon
  },
  {
    name: 'ExpenseHistory',
    label: '历史',
    icon: HistoryIcon
  },
  {
    name: 'Statistics',
    label: '统计',
    icon: StatsIcon
  },
  {
    name: 'BudgetSettings',
    label: '设置',
    icon: SettingsIcon
  }
]

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.name as string)

const navigateToTab = (tabName: string) => {
  if (currentRoute.value !== tabName) {
    router.push({ name: tabName })
  }
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  .tab-bar-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .tab-bar-content {
    position: relative;
    display: flex;
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
    
    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 4px;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      
      .tab-icon {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
        color: var(--ios-gray, #8e8e93);
        transition: color 0.2s ease;
      }
      
      .tab-label {
        font-size: 10px;
        font-weight: 500;
        color: var(--ios-gray, #8e8e93);
        transition: color 0.2s ease;
      }
      
      &.active {
        .tab-icon {
          color: var(--ios-blue, #007aff);
        }
        
        .tab-label {
          color: var(--ios-blue, #007aff);
        }
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// Add padding to body to account for tab bar
:global(body) {
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}
</style>