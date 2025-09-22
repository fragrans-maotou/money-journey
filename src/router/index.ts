import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { 
        title: '预算概览', 
        showTabBar: true,
        transition: 'slide-left'
      }
    },
    {
      path: '/budget-settings',
      name: 'BudgetSettings',
      component: () => import('../views/BudgetSettings.vue'),
      meta: { 
        title: '预算设置', 
        showTabBar: true,
        transition: 'slide-left'
      }
    },
    {
      path: '/expense-record',
      name: 'ExpenseRecord',
      component: () => import('../views/ExpenseRecord.vue'),
      meta: { 
        title: '记录消费', 
        showTabBar: true,
        transition: 'slide-left'
      }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: () => import('../views/Statistics.vue'),
      meta: { 
        title: '统计分析', 
        showTabBar: true,
        transition: 'slide-left'
      }
    },
    {
      path: '/expense-history',
      name: 'ExpenseHistory',
      component: () => import('../views/ExpenseHistory.vue'),
      meta: { 
        title: '消费历史', 
        showTabBar: true,
        transition: 'slide-left'
      }
    },
    // Redirect old home route to dashboard
    {
      path: '/home',
      redirect: '/'
    }
  ]
})

export default router