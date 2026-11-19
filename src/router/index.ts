import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'

export const PRIVATE_PREFIX = '/_'

/** Matches the scroll-padding-top the stylesheet uses for anchor jumps. */
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
  /*
   * In-page clicks are plain anchors the browser handles with the
   * scroll-padding-top in style.css. This branch is for the other case: a
   * shared or bookmarked /#work that arrives as a cross-document load.
   * scrollBehavior runs while the hash is still on the URL — IndexView only
   * strips it afterwards — so without this the visitor landed on the hero with
   * no sign the link had pointed at a section.
   */
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash && document.querySelector(to.hash)) {
      return { el: to.hash, top: HEADER_OFFSET }
    }
    return { top: 0 }
  },
})
