<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pages, renderPage, searchDocs } from './content'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug || 'introduction'))
const page = computed(() => pages.find(item => item.slug === slug.value))
const rendered = computed(() => page.value ? renderPage(page.value.slug) : { html: '', headings: [] })
const pageIndex = computed(() => pages.findIndex(item => item.slug === slug.value))
const previous = computed(() => pages[pageIndex.value - 1])
const following = computed(() => pages[pageIndex.value + 1])
const groups = [...new Set(pages.map(item => item.group))]
const sidebarOpen = ref(false)
const activeSection = ref('')
const theme = ref('light')
const query = ref('')
const selectedResult = ref(0)
const searchResults = computed(() => searchDocs(query.value))
const dialog = ref<HTMLDialogElement>()
const searchInput = ref<HTMLInputElement>()
const searchTrigger = ref<HTMLButtonElement>()
const notice = ref('')
const errorsOnly = ref(false)
const demo = [
  { line: '01', time: '10:42:01.120', level: 'INFO', content: 'request=req-1042 accepted GET /api/orders' },
  { line: '02', time: '10:42:01.146', level: 'DEBUG', content: 'request=req-1042 cache miss' },
  { line: '03', time: '10:42:04.152', level: 'WARN', content: 'request=req-1042 upstream slow duration=3006ms' },
  { line: '04', time: '10:42:06.154', level: 'ERROR', content: 'request=req-1042 timeout duration=5008ms' },
  { line: '05', time: '10:42:06.156', level: 'INFO', content: 'request=req-1042 completed status=504' },
]
const visibleDemo = computed(() => errorsOnly.value ? demo.filter(line => ['WARN', 'ERROR'].includes(line.level)) : demo)
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let frameId = 0

function notify(message: string) {
  clearTimeout(noticeTimer)
  notice.value = message
  noticeTimer = setTimeout(() => { notice.value = '' }, 2600)
}
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  try { localStorage.setItem('logdog-docs-theme', theme.value) } catch { /* Storage may be unavailable in private mode. */ }
}
watch(theme, value => { document.documentElement.dataset.docsTheme = value })

async function openSearch() {
  query.value = ''
  selectedResult.value = 0
  sidebarOpen.value = false
  dialog.value?.showModal()
  await nextTick()
  searchInput.value?.focus()
}
function closeSearch() {
  dialog.value?.close()
  searchTrigger.value?.focus()
}
function moveResult(delta: number) {
  const length = searchResults.value.length
  if (!length) return
  selectedResult.value = (selectedResult.value + delta + length) % length
  dialog.value?.querySelector(`[data-result="${selectedResult.value}"]`)?.scrollIntoView({ block: 'nearest' })
}
function chooseResult(index: number) {
  const result = searchResults.value[index]
  if (!result) return
  closeSearch()
  void router.push(`/${result.page.slug}`)
}
watch(query, () => { selectedResult.value = 0 })

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify('已复制到剪贴板')
  } catch { notify('无法访问剪贴板，请选择文本手动复制') }
}
function onArticleClick(event: MouseEvent) {
  const target = event.target as Element
  const copy = target.closest<HTMLButtonElement>('button[data-code]')
  if (copy?.dataset.code) void copyText(decodeURIComponent(copy.dataset.code))
}
function focusMain() {
  const main = document.getElementById('main-content')
  main?.focus()
  main?.scrollIntoView({ block: 'start' })
}
function updateActiveSection() {
  cancelAnimationFrame(frameId)
  frameId = requestAnimationFrame(() => {
    let id = rendered.value.headings[0]?.id || ''
    for (const heading of rendered.value.headings) {
      if ((document.getElementById(heading.id)?.getBoundingClientRect().top ?? Infinity) <= 150) id = heading.id
    }
    activeSection.value = id
  })
}
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (dialog.value?.open) closeSearch()
    else void openSearch()
  }
  if (event.key === 'Escape') sidebarOpen.value = false
}
watch(() => route.path, async () => {
  sidebarOpen.value = false
  document.title = `${page.value?.title || '页面未找到'} · LogDog 文档`
  await nextTick()
  updateActiveSection()
}, { immediate: true })

onMounted(() => {
  try { theme.value = localStorage.getItem('logdog-docs-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') } catch { theme.value = 'light' }
  document.documentElement.dataset.docsTheme = theme.value
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  updateActiveSection()
})
onBeforeUnmount(() => {
  clearTimeout(noticeTimer)
  cancelAnimationFrame(frameId)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', updateActiveSection)
})
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMain">跳至正文</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/docs/" aria-label="LogDog 文档首页">
        <img src="/logo-fill.svg" alt="" width="30" height="30" />
        <span>LogDog</span><span class="brand-divider">/</span><span class="brand-docs">文档</span>
      </a>
      <nav class="header-nav" aria-label="主导航">
        <RouterLink to="/introduction" :class="{ 'header-current': page?.group !== '开发与维护' }">使用指南</RouterLink>
        <RouterLink to="/deployment" :class="{ 'header-current': page?.group === '开发与维护' }">开发与部署</RouterLink>
      </nav>
      <div class="header-tools">
        <button ref="searchTrigger" class="search-trigger" aria-label="搜索文档" @click="openSearch"><i class="pi pi-search" aria-hidden="true" /><span>搜索文档…</span><kbd>⌘ K</kbd></button>
        <a class="icon-button github-link" href="https://github.com/logdog-tech/logdog" target="_blank" rel="noopener noreferrer" aria-label="GitHub 源码" title="GitHub 源码"><i class="pi pi-github" aria-hidden="true" /></a>
        <button class="icon-button" :aria-label="theme === 'light' ? '切换为深色主题' : '切换为浅色主题'" :title="theme === 'light' ? '切换为深色主题' : '切换为浅色主题'" @click="toggleTheme"><i :class="['pi', theme === 'light' ? 'pi-moon' : 'pi-sun']" aria-hidden="true" /></button>
        <a class="open-app" href="/" target="_blank" rel="noopener">打开 LogDog<i class="pi pi-arrow-up-right" aria-hidden="true" /></a>
      </div>
    </div>
  </header>

  <div class="mobile-bar">
    <button :aria-expanded="sidebarOpen" aria-controls="docs-sidebar" @click="sidebarOpen = !sidebarOpen"><i :class="['pi', sidebarOpen ? 'pi-times' : 'pi-bars']" aria-hidden="true" />文档目录</button>
    <span>{{ page?.title || '页面未找到' }}</span>
  </div>
  <button v-if="sidebarOpen" class="sidebar-backdrop" aria-label="关闭文档目录" @click="sidebarOpen = false" />

  <div class="docs-layout">
    <aside id="docs-sidebar" :class="['sidebar', { 'sidebar-open': sidebarOpen }]" aria-label="文档目录">
      <div class="sidebar-content">
        <span class="sidebar-label">DOCUMENTATION</span>
        <nav v-for="group in groups" :key="group" class="nav-group" :aria-label="group">
          <h2>{{ group }}</h2>
          <RouterLink v-for="item in pages.filter(item => item.group === group)" :key="item.slug" :to="`/${item.slug}`" :class="{ active: slug === item.slug }" :aria-current="slug === item.slug ? 'page' : undefined">
            <i :class="['pi', item.icon]" aria-hidden="true" /><span>{{ item.title }}</span><span v-if="slug === item.slug" class="active-dot" />
          </RouterLink>
        </nav>
        <a class="sidebar-github" href="https://github.com/logdog-tech/logdog" target="_blank" rel="noopener noreferrer"><i class="pi pi-github" aria-hidden="true" /><span>开源，让分析更透明<small>Apache-2.0 License</small></span><i class="pi pi-arrow-up-right" aria-hidden="true" /></a>
      </div>
    </aside>

    <main id="main-content" class="main-content" tabindex="-1">
      <template v-if="page">
        <div class="breadcrumb"><span>文档</span><i class="pi pi-angle-right" aria-hidden="true" /><span>{{ page.group }}</span></div>
        <div class="article-heading">
          <span v-if="slug === 'introduction'" class="intro-eyebrow"><span /> LOGDOG / OPEN SOURCE</span>
          <h1>{{ slug === 'introduction' ? 'LogDog 文档' : page.title }}</h1>
          <p>{{ page.description }}</p>
        </div>

        <template v-if="slug === 'introduction'">
          <p class="intro-description">让每一次排查都有迹可循。了解如何在浏览器中浏览、搜索和整理日志，从第一条线索到完整的上下文。</p>
          <div class="intro-actions">
            <RouterLink class="primary-link" to="/quick-start">快速开始<i class="pi pi-arrow-right" aria-hidden="true" /></RouterLink>
            <RouterLink class="text-link" to="/deployment"><i class="pi pi-code" aria-hidden="true" />独立部署</RouterLink>
          </div>
          <div class="log-example" aria-label="可筛选的演示日志">
            <div class="example-header"><span><i class="pi pi-file" aria-hidden="true" />application.log</span><span class="example-caption">示例数据</span></div>
            <div class="example-toolbar"><div role="tablist" aria-label="演示日志显示模式"><button id="demo-all" role="tab" :aria-selected="!errorsOnly" aria-controls="demo-log" @click="errorsOnly = false">全部日志</button><button id="demo-errors" role="tab" :aria-selected="errorsOnly" aria-controls="demo-log" @click="errorsOnly = true">只看异常<span class="error-count">2</span></button></div><span class="example-expression">{{ errorsOnly ? 'ERROR|WARN' : 'request=req-1042' }}</span></div>
            <div id="demo-log" class="example-lines" role="tabpanel" :aria-labelledby="errorsOnly ? 'demo-errors' : 'demo-all'" tabindex="0">
              <div v-for="line in visibleDemo" :key="line.line" :class="['example-line', line.level.toLowerCase()]"><span class="example-number">{{ line.line }}</span><span class="example-time">{{ line.time }}</span><span class="example-level">{{ line.level }}</span><span>{{ line.content }}</span></div>
            </div>
            <div class="example-footer"><span><span class="status-dot" />本地文件 · 浏览器内解析</span><span aria-live="polite">{{ visibleDemo.length }} 条记录</span></div>
          </div>
        </template>

        <article class="prose" @click="onArticleClick" v-html="rendered.html" />
        <div class="article-meta"><a :href="`https://github.com/logdog-tech/logdog/blob/main/src/docs/pages/${slug}.md`" target="_blank" rel="noopener noreferrer"><i class="pi pi-pencil" aria-hidden="true" />在 GitHub 上编辑此页</a><span>LogDog 开源文档</span></div>
        <nav class="page-pagination" aria-label="相邻文档">
          <RouterLink v-if="previous" :to="`/${previous.slug}`" class="previous-page"><i class="pi pi-arrow-left" aria-hidden="true" /><span><small>上一篇</small>{{ previous.title }}</span></RouterLink><span v-else />
          <RouterLink v-if="following" :to="`/${following.slug}`" class="next-page"><span><small>下一篇</small>{{ following.title }}</span><i class="pi pi-arrow-right" aria-hidden="true" /></RouterLink>
        </nav>
        <footer class="article-footer"><span>LogDog<span class="footer-separator">/</span>读懂日志，找到线索。</span><a href="https://github.com/logdog-tech/logdog" target="_blank" rel="noopener noreferrer">GitHub<i class="pi pi-arrow-up-right" aria-hidden="true" /></a></footer>
      </template>
      <div v-else class="not-found"><span class="intro-eyebrow">404 / DOCUMENT NOT FOUND</span><h1>这篇文档不存在</h1><p>链接可能已更改。你可以搜索文档，或从目录继续阅读。</p><RouterLink class="primary-link" to="/introduction">返回文档首页<i class="pi pi-arrow-right" aria-hidden="true" /></RouterLink></div>
    </main>

    <aside v-if="page" class="toc" aria-label="本页目录"><div class="toc-inner"><p><i class="pi pi-list" aria-hidden="true" />本页内容</p><nav><RouterLink v-for="heading in rendered.headings" :key="heading.id" :to="{ path: `/${slug}`, hash: `#${heading.id}` }" :class="{ active: activeSection === heading.id }" :aria-current="activeSection === heading.id ? 'location' : undefined">{{ heading.text }}</RouterLink></nav><div class="toc-support"><i class="pi pi-comments" aria-hidden="true" /><strong>遇到问题？</strong><p>一起让 LogDog 更好用。</p><a href="https://github.com/logdog-tech/logdog/issues" target="_blank" rel="noopener noreferrer">反馈问题<i class="pi pi-arrow-up-right" aria-hidden="true" /></a></div></div></aside>
  </div>

  <dialog ref="dialog" class="search-dialog" aria-labelledby="search-title" @click="($event.target === dialog) && closeSearch()" @cancel="closeSearch">
    <div class="search-dialog-inner">
      <h2 id="search-title" class="sr-only">搜索 LogDog 文档</h2>
      <div class="search-input-row"><i class="pi pi-search" aria-hidden="true" /><input ref="searchInput" v-model="query" type="search" placeholder="搜索功能、命令或问题…" aria-label="搜索文档内容" role="combobox" aria-autocomplete="list" aria-controls="search-results" :aria-expanded="true" :aria-activedescendant="searchResults.length ? `result-${selectedResult}` : undefined" @keydown.down.prevent="moveResult(1)" @keydown.up.prevent="moveResult(-1)" @keydown.enter.prevent="chooseResult(selectedResult)" /><button class="icon-button" title="关闭搜索" aria-label="关闭搜索" @click="closeSearch"><i class="pi pi-times" aria-hidden="true" /></button></div>
      <div class="search-results-label" aria-live="polite">{{ query.trim() ? `${searchResults.length} 篇相关文档` : '推荐阅读' }}</div>
      <div id="search-results" class="search-results" role="listbox" aria-label="搜索结果">
        <button v-for="(result, index) in searchResults" :id="`result-${index}`" :key="result.page.slug" :data-result="index" role="option" :aria-selected="selectedResult === index" :class="['search-result', { selected: selectedResult === index }]" @click="chooseResult(index)" @mousemove="selectedResult = index"><i :class="['pi', result.page.icon]" aria-hidden="true" /><span><small>{{ result.page.group }}</small><strong>{{ result.page.title }}</strong><span class="result-snippet">{{ result.snippet }}</span></span><i class="pi pi-arrow-right" aria-hidden="true" /></button>
        <div v-if="!searchResults.length" class="empty-search"><i class="pi pi-search" aria-hidden="true" /><strong>没有找到相关文档</strong><p>试试“编码”“导出”或“部署”等关键词。</p></div>
      </div>
      <div class="search-footer"><span>LogDog 文档</span><span><kbd>↑</kbd><kbd>↓</kbd> 选择 <kbd>Enter</kbd> 打开</span></div>
    </div>
  </dialog>
  <div class="docs-toast" role="status" aria-live="polite" :class="{ visible: notice }"><i class="pi pi-info-circle" aria-hidden="true" />{{ notice }}</div>
</template>
