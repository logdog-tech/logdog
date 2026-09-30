import type { DocPage } from './content'
import { docPath, docsBase } from './routes'

export const siteOrigin = (import.meta.env.VITE_SITE_ORIGIN || 'https://logdog.tech').replace(/\/$/, '')
export function metadata(page?: DocPage) {
  const path = page ? docPath(page.slug).slice(1) : '404.html'
  return {
    title: page ? `${page.title} · LogDog 日志分析文档` : '页面未找到 · LogDog 文档',
    description: page?.description || '这篇文档不存在，请从目录继续阅读。',
    canonical: `${siteOrigin}${docsBase}${path}`,
  }
}
export function updateMetadata(page?: DocPage) {
  const data = metadata(page)
  document.title = data.title
  const set = (selector: string, attribute: string, value: string) => document.querySelector(selector)?.setAttribute(attribute, value)
  set('meta[name="description"]', 'content', data.description)
  set('link[rel="canonical"]', 'href', data.canonical)
  set('meta[property="og:title"]', 'content', data.title)
  set('meta[property="og:description"]', 'content', data.description)
  set('meta[property="og:url"]', 'content', data.canonical)
  set('meta[name="robots"]', 'content', page ? 'index,follow' : 'noindex,follow')
  const schema = document.getElementById('docs-structured-data')
  if (schema) schema.textContent = JSON.stringify(structuredData(page))
}

export function structuredData(page?: DocPage) {
  if (!page) return []
  const data = metadata(page)
  return [
    { '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title, description: page.description, url: data.canonical, inLanguage: 'zh-CN', publisher: { '@type': 'Organization', name: 'LogDog', url: 'https://logdog.tech/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LogDog 文档', item: `${siteOrigin}${docsBase}` },
      ...(page.slug === 'introduction' ? [] : [{ '@type': 'ListItem', position: 2, name: page.title, item: data.canonical }]),
    ] },
  ]
}
