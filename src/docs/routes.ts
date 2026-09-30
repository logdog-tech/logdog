import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'

export const docsBase = import.meta.env.DEV ? `${import.meta.env.BASE_URL}docs/` : import.meta.env.BASE_URL
export const docPath = (slug: string) => slug === 'introduction' ? '/' : `/${slug}/`
export function makeDocsRouter(server = false) {
  return createRouter({
    history: server ? createMemoryHistory(docsBase) : createWebHistory(docsBase),
    routes: [{ path: '/:slug?', component: { render: () => null } }],
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      if (to.hash) return { el: to.hash, top: window.innerWidth <= 700 ? 126 : 96, behavior: 'instant' }
      if (to.path !== from.path) return { top: 0 }
    },
  })
}
