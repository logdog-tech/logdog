import { describe, expect, it } from 'vitest'
import { markdownFor, pages, renderPage, searchDocs } from '@/docs/content'

describe('documentation content', () => {
  it('provides content and unique section anchors for every navigation entry', () => {
    expect(new Set(pages.map(page => page.slug)).size).toBe(pages.length)
    for (const page of pages) {
      expect(markdownFor(page.slug).length).toBeGreaterThan(100)
      const rendered = renderPage(page.slug)
      expect(rendered.headings.length).toBeGreaterThan(0)
      expect(new Set(rendered.headings.map(heading => heading.id)).size).toBe(rendered.headings.length)
      for (const heading of rendered.headings) expect(rendered.html).toContain(`id="${heading.id}"`)
    }
  })
  it('only links to existing internal documentation pages', () => {
    const slugs = new Set(pages.map(page => page.slug))
    for (const page of pages) {
      for (const match of markdownFor(page.slug).matchAll(/\]\(#\/([^\s)#]+)\)/g)) {
        expect(slugs.has(match[1]), `${page.slug} links to ${match[1]}`).toBe(true)
      }
    }
  })
  it('finds topics in both page titles and body text', () => {
    expect(searchDocs('复制')[0].page.slug).toBe('export')
    expect(searchDocs('zst').some(result => result.page.slug === 'importing')).toBe(true)
    expect(searchDocs('rustup').some(result => result.page.slug === 'deployment')).toBe(true)
    expect(searchDocs('no-such-topic-xyz')).toEqual([])
  })
  it('preserves code for clipboard copying while escaping HTML', () => {
    const html = renderPage('rules').html
    expect(html).toContain('data-code="')
    expect(html).toContain('aria-label="复制代码"')
    const code = html.match(/data-code="([^"]+)"/)?.[1]
    expect(code).toBeDefined()
    expect(decodeURIComponent(code!)).toContain('timeout|ECONNRESET')
  })
})
