import { build } from 'vite'
import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const base = process.env.DOCS_BASE_PATH || '/docs/'
const origin = (process.env.VITE_SITE_ORIGIN || 'https://logdog.tech').replace(/\/$/, '')
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('DOCS_BASE_PATH must be an absolute directory path ending with /')
const parsedOrigin = new URL(origin)
if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.pathname !== '/') throw new Error('VITE_SITE_ORIGIN must be an HTTP(S) origin')
process.env.DOCS_BASE_PATH = base
process.env.VITE_SITE_ORIGIN = origin
const output = resolve('dist-docs')
const serverOutput = resolve('node_modules/.cache/logdog-docs-ssr')
const configFile = resolve('vite.docs.config.ts')
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
await build({ configFile })
await build({ configFile, build: { ssr: resolve('src/docs/entry-server.ts'), outDir: serverOutput, rollupOptions: { input: resolve('src/docs/entry-server.ts'), output: { entryFileNames: 'entry-server.mjs' } } } })
const { render, pages, docPath, metadata, structuredData, markdownFor } = await import(pathToFileURL(join(serverOutput, 'entry-server.mjs')).href)
const template = await readFile(join(output, 'docs/index.html'), 'utf8')
async function generate(page, path, destination) {
  const seo = metadata(page)
  const body = await render(path)
  if (page && (!body.includes('<h1>') || !body.includes('class="prose"'))) throw new Error(`Missing static content for ${path}`)
  const canonical = page ? `<link rel="canonical" href="${escape(seo.canonical)}">` : ''
  const structured = structuredData(page)
  const html = template.replace(/<title>.*?<\/title>/s, `<title>${escape(seo.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(seo.description)}">`)
    .replace('</head>', `${canonical}\n<meta name="robots" content="${page ? 'index,follow' : 'noindex,follow'}">\n<meta property="og:type" content="article">\n<meta property="og:title" content="${escape(seo.title)}">\n<meta property="og:description" content="${escape(seo.description)}">\n<meta property="og:url" content="${escape(seo.canonical)}">\n<script id="docs-structured-data" type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>\n</head>`)
    .replace('<div id="docs-app"></div>', `<div id="docs-app">${body}</div>`)
  await mkdir(resolve(destination, '..'), { recursive: true })
  await writeFile(destination, html)
}
if (new Set(pages.map(page => page.slug)).size !== pages.length) throw new Error('Duplicate documentation slug')
for (const page of pages) {
  if (markdownFor(page.slug).trim().length < 100) throw new Error(`Missing documentation body: ${page.slug}`)
  for (const match of markdownFor(page.slug).matchAll(/\]\(#\/([^\s)#]+)\)/g)) {
    if (!pages.some(target => target.slug === match[1])) throw new Error(`Broken documentation link in ${page.slug}: ${match[1]}`)
  }
  const path = docPath(page.slug)
  await generate(page, path, join(output, path.slice(1), 'index.html'))
}
await generate(undefined, '/not-found/', join(output, '404.html'))
// Legacy introduction URLs keep a readable page and canonicalize to the docs root.
await generate(pages[0], '/introduction/', join(output, 'introduction/index.html'))
await cp('public/logo-fill.svg', join(output, 'logo-fill.svg'))
await cp('public/docs-assets', join(output, 'docs-assets'), { recursive: true })
const urls = pages.map(page => `${origin}${base}${docPath(page.slug).slice(1)}`)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile(join(output, 'sitemap.xml'), sitemap)
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`)
await rm(join(output, 'docs'), { recursive: true })
await rm(serverOutput, { recursive: true })
console.log(`Generated ${pages.length} static documentation pages at ${origin}${base}`)
