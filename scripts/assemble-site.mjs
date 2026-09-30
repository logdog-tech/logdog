import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Copy only the independently generated documentation and crawler files.
// The application's dist/index.html and asset directory are never rewritten.
const docs = resolve('dist-docs')
const origin = (process.env.VITE_SITE_ORIGIN || 'https://logdog.tech').replace(/\/$/, '')
const sitemap = await readFile(`${docs}/sitemap.xml`, 'utf8')
if (!sitemap.includes(`${origin}/docs/`)) throw new Error('Build docs with DOCS_BASE_PATH=/docs/ before assembling the main site')
await mkdir('dist/docs', { recursive: true })
await cp(docs, 'dist/docs', { recursive: true })
await writeFile('dist/sitemap.xml', sitemap.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${origin}/</loc></url>`))
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
console.log('Added static docs and crawler files to the existing app build')
