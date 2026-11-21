import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'

export const PRIVATE_PREFIX = '/_'

const HEADER_OFFSET = 96

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'portfolio',
      component: IndexView,
    },
    {
      path: `${PRIVATE_PREFIX}/budget`,
      name: 'budget',
      component: () => import('@/views/BudgetView.vue'),
    },
    {
      path: '/:chemin(.*)*',
      redirect: '/',
    },
  ],

  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash && document.querySelector(to.hash)) {
      return { el: to.hash, top: HEADER_OFFSET }
    }
    return { top: 0 }
  },
})
