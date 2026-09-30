import MarkdownIt from 'markdown-it'

export interface DocPage {
  slug: string
  title: string
  description: string
  group: string
  icon: string
}

export const pages: DocPage[] = [
  { slug: 'introduction', title: '认识 LogDog', description: '从海量日志中，找到真正有用的信息。', group: '开始使用', icon: 'pi-compass' },
  { slug: 'quick-start', title: '快速开始', description: '打开一份日志，完成第一次搜索与导出。', group: '开始使用', icon: 'pi-bolt' },
  { slug: 'importing', title: '导入文件与压缩包', description: '文件、目录、压缩包，以及字符编码。', group: '开始使用', icon: 'pi-folder-open' },
  { slug: 'search', title: '搜索与筛选', description: '用关键词和正则表达式缩小排查范围。', group: '分析日志', icon: 'pi-search' },
  { slug: 'bookmarks', title: '标记与高亮', description: '留下关键证据，建立可读的上下文。', group: '分析日志', icon: 'pi-bookmark' },
  { slug: 'export', title: '选择、复制与导出', description: '在独立视图内选择，并准确导出需要的日志。', group: '分析日志', icon: 'pi-download' },
  { slug: 'rules', title: '自定义规则与函数', description: '把重复的筛选和显示处理保存为规则。', group: '进阶指南', icon: 'pi-sliders-h' },
  { slug: 'pipeline', title: '实时管道与 Logcat', description: '将终端输出接入本地日志分析视图。', group: '进阶指南', icon: 'pi-desktop' },
  { slug: 'workspaces', title: '工作区与数据边界', description: '了解本地处理、规则保存与共享工作区。', group: '进阶指南', icon: 'pi-shield' },
  { slug: 'deployment', title: '开发与部署', description: '从源码运行，构建并托管静态站点。', group: '开发与维护', icon: 'pi-code' },
  { slug: 'troubleshooting', title: '常见问题', description: '从乱码到构建失败，按现象定位问题。', group: '开发与维护', icon: 'pi-question-circle' },
  { slug: 'contributing', title: '反馈与贡献', description: '提交可复现的问题，或参与项目改进。', group: '开发与维护', icon: 'pi-github' },
]

const files = import.meta.glob('./pages/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
export const markdownFor = (slug: string) => files[`./pages/${slug}.md`] || ''
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false })
markdown.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index]
  const label = markdown.utils.escapeHtml(token.info.trim() || 'text')
  const code = markdown.utils.escapeHtml(token.content)
  const encoded = markdown.utils.escapeHtml(encodeURIComponent(token.content))
  return `<div class="code-block"><div class="code-header"><span>${label}</span><button type="button" data-code="${encoded}" title="复制代码" aria-label="复制代码"><i class="pi pi-copy" aria-hidden="true"></i></button></div><pre tabindex="0"><code>${code}</code></pre></div>`
}
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const href = String(tokens[index].attrGet('href') || '')
  if (href.startsWith('https://') || href === '/') {
    tokens[index].attrSet('target', '_blank')
    tokens[index].attrSet('rel', 'noopener noreferrer')
  }
  if (href.startsWith('/docs-assets/')) tokens[index].attrSet('href', `${import.meta.env.BASE_URL}${href.slice(1)}`)
  if (href.endsWith('.log')) tokens[index].attrSet('download', '')
  return self.renderToken(tokens, index, options)
}
export interface Heading { id: string; text: string }

export function renderPage(slug: string) {
  const tokens = markdown.parse(markdownFor(slug), {})
  const headings: Heading[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h2') {
      const text = tokens[i + 1].content
      const id = `section-${headings.length + 1}`
      tokens[i].attrSet('id', id)
      headings.push({ id, text })
    }
  }
  return { html: markdown.renderer.render(tokens, markdown.options, {}), headings }
}

export function searchDocs(query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return pages.slice(0, 5).map(page => ({ page, snippet: page.description }))
  return pages.map(page => {
    const body = markdownFor(page.slug).replace(/[#*`>|]/g, '').replace(/\s+/g, ' ')
    const haystack = `${page.title} ${page.description} ${body}`.toLocaleLowerCase()
    const score = words.every(word => haystack.includes(word))
      ? words.reduce((sum, word) => sum + (page.title.toLocaleLowerCase().includes(word) ? 10 : 1), 0) : 0
    const at = body.toLocaleLowerCase().indexOf(words[0])
    return { page, score, snippet: at < 0 ? page.description : `${at > 20 ? '…' : ''}${body.slice(Math.max(0, at - 20), Math.max(0, at - 20) + 95)}…` }
  }).filter(result => result.score).sort((a, b) => b.score - a.score)
}
