import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import 'primeicons/primeicons.css'
import './style.css'
import DocsApp from './DocsApp.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.VITE_DOCS_STANDALONE === 'true' ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}docs/`),
  routes: [{ path: '/:slug?', component: { render: () => null } }],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: window.innerWidth <= 700 ? 126 : 96, behavior: 'instant' }
    if (to.path !== from.path) return { top: 0 }
  },
})

createApp(DocsApp).use(router).mount('#docs-app')
