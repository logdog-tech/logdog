import { createApp, createSSRApp } from 'vue'
import 'primeicons/primeicons.css'
import './style.css'
import DocsApp from './DocsApp.vue'
import { makeDocsRouter, docPath, docsBase } from './routes'
import { pages } from './content'

let redirecting = false
// Keep links shared before static generation working, including heading anchors.
if (location.hash.startsWith('#/')) {
  const [slug, ...anchor] = location.hash.slice(2).split('#')
  if (!slug || pages.some(page => page.slug === slug)) {
    redirecting = true
    location.replace(`${docsBase}${docPath(slug || 'introduction').slice(1)}${anchor.length ? `#${anchor.join('#')}` : ''}`)
  }
}
if (!redirecting) {
  const router = makeDocsRouter()
  const mount = document.getElementById('docs-app')
  const app = (mount?.hasChildNodes() ? createSSRApp : createApp)(DocsApp).use(router)
  router.isReady().then(() => app.mount('#docs-app'))
}
