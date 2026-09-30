import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import DocsApp from './DocsApp.vue'
import { makeDocsRouter, docPath } from './routes'
import { pages, markdownFor } from './content'
import { metadata, structuredData } from './seo'

export { pages, docPath, metadata, structuredData, markdownFor }
export async function render(path: string) {
  const router = makeDocsRouter(true)
  const app = createSSRApp(DocsApp).use(router)
  await router.push(path)
  await router.isReady()
  return renderToString(app)
}
