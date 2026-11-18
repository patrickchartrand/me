import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'

export const PRIVATE_PREFIX = '/_'

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
  // IndexView clears the hash on mount (it keeps the URL clean), so a hash
  // branch here would be dead code. In-page jumps are plain anchors, handled by
  // the browser with the scroll-padding-top set in style.css.
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    return { top: 0 }
  },
})
