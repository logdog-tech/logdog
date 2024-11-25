import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import JoinWorkspace from '../views/JoinWorkspace.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/join/:code',
      name: 'join-workspace',
      component: () => import('../views/JoinWorkspace.vue'),
      props: true
    }
  ],
})

export default router
