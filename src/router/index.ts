import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'
import { PRIVATE_PREFIX } from '@/config'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'accueil',
      component: IndexView,
    },
    {
      path: `${PRIVATE_PREFIX}/codex`,
      name: 'codex',
      component: () => import('@/views/CodexView.vue'),
    },
    {
      path: '/:chemin(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
