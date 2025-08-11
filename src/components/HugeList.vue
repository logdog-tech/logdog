<template>
  <div
    ref="root"
    class="huge-list"
    :class="{ 'is-wrap': !!props.wrap }"
    @pointerdown="onContentPointerDown"
    @pointermove="onContentPointerMove"
    @pointerup="onContentPointerUp"
    @pointercancel="onContentPointerUp"
  >
    <div class="hl-viewport">
      <!-- 横向原生滚动容器：wrap 时禁用横向滚动 -->
      <div class="hl-hscroll">
        <!-- 内容层 -->
        <div class="hl-layer">
          <div
            v-for="it in visibleItems"
            :key="it.index"
            class="hl-row"
            :style="{ transform: `translateY(${Math.round(it.y)}px)` }"
            :data-index="it.index"
            :ref="(el) => setRowEl(el as Element, it.index)"
          >
            <!-- 软刷新：用 versionKey 触发插槽重渲染，不重挂节点 -->
            <slot :index="it.index" :__v="versionKey" />
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义纵向滚动条 -->
    <div class="hl-scrollbar" @pointerdown="onTrackPointerDown">
      <div
        class="hl-thumb"
        :style="thumbStyle"
        @pointerdown.stop="onThumbPointerDown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineExpose,
  defineProps,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'

type Align = 'start' | 'center' | 'end'

const props = withDefaults(
  defineProps<{
    rowCount: number
    rowHeight?: number
    overscanRowCount?: number
    scrollToIndex?: number | null | undefined
    version?: number
    wrap?: boolean
  }>(),
  {
    rowHeight: 32,
    overscanRowCount: 6,
    scrollToIndex: null,
    version: 0,
    wrap: false,
  }
)

const root = ref<HTMLDivElement | null>(null)
const viewportHeight = ref(0)
let ro: ResizeObserver | null = null

// 非原生纵向滚动状态
const logicalScrollY = ref(0)
const firstIndex = ref(0)
const firstOffset = ref(0)

// 动态行高缓存
const heights = reactive(new Map<number, number>())
const heightsVersion = ref(0)

const estimatedRowHeight = computed(() => Math.max(1, +props.rowHeight || 1))
const overscan = computed(() => Math.max(0, Math.floor(props.overscanRowCount || 0)))
const rowCount = computed(() => Math.max(0, Math.floor(props.rowCount || 0)))
const versionKey = computed(() => String(props.version ?? 0))

// 估算总高度（含已测行的误差修正）
const totalEstimatedHeight = computed(() => {
  const N = rowCount.value
  const H = estimatedRowHeight.value
  if (N <= 0) return 0
  let corr = 0
  heights.forEach((h, i) => {
    if (i >= 0 && i < N) corr += (h - H)
  })
  return Math.max(0, N * H + corr)
})

const maxLogicalScroll = computed(() =>
  Math.max(0, totalEstimatedHeight.value - viewportHeight.value)
)

function heightOf(index: number): number {
  if (index < 0 || index >= rowCount.value) return 0
  return heights.get(index) ?? estimatedRowHeight.value
}

function estimatePrefixBefore(index: number): number {
  const H = estimatedRowHeight.value
  let sum = index * H
  heights.forEach((h, i) => {
    if (i < index) sum += (h - H)
  })
  return sum
}

function setLogicalScroll(y: number) {
  const clamped = Math.min(Math.max(0, y), maxLogicalScroll.value)
  logicalScrollY.value = clamped

  // 先按估算行高定位，再用实测值修正
  let i = Math.min(
    rowCount.value - 1,
    Math.max(0, Math.floor(clamped / estimatedRowHeight.value))
  )
  let prefix = estimatePrefixBefore(i)
  let offset = clamped - prefix

  while (offset < 0 && i > 0) {
    i--
    offset += heightOf(i)
  }
  while (i < rowCount.value - 1 && offset >= heightOf(i)) {
    offset -= heightOf(i)
    i++
  }

  firstIndex.value = i
  firstOffset.value = Math.max(0, Math.min(offset, Math.max(0, heightOf(i) - 1)))
}

function scrollBy(deltaY: number) {
  setLogicalScroll(logicalScrollY.value + deltaY)
}

const visibleItems = computed(() => {
  heightsVersion.value
  const H = viewportHeight.value
  const N = rowCount.value
  if (N === 0 || H <= 0) return [] as { index: number; y: number }[]

  const topIndex = firstIndex.value
  let yTop = -firstOffset.value

  const startIndex = Math.max(0, topIndex - overscan.value)
  for (let i = topIndex - 1; i >= startIndex; i--) {
    yTop -= heightOf(i)
  }

  const items: { index: number; y: number }[] = []
  let y = yTop
  let idx = startIndex
  const lowerBound = H + overscan.value * estimatedRowHeight.value
  while (y < lowerBound && idx < N) {
    items.push({ index: idx, y })
    y += heightOf(idx)
    idx++
  }
  if (items.length === 0 && N > 0) items.push({ index: 0, y: 0 })
  return items
})

// 视口尺寸观测
function updateViewportHeight() {
  viewportHeight.value = root.value ? root.value.clientHeight : 0
  setLogicalScroll(logicalScrollY.value)
}

// 自定义纵向滚动条外观
const minThumbSize = 20
const thumbStyle = computed(() => {
  const trackH = viewportHeight.value
  const total = totalEstimatedHeight.value
  const view = viewportHeight.value
  if (trackH <= 0 || total <= 0 || view <= 0) {
    return { height: `${minThumbSize}px`, transform: 'translateY(0px)' }
  }
  const ratio = view / total
  const size = Math.max(minThumbSize, Math.round(trackH * ratio))
  const maxTop = Math.max(0, trackH - size)
  const maxScroll = Math.max(0, total - view)
  const top = maxScroll === 0 ? 0 : Math.round((logicalScrollY.value / maxScroll) * maxTop)
  return { height: `${size}px`, transform: `translateY(${top}px)` }
})

function currentThumbTop(): number {
  const trackH = viewportHeight.value
  const size = parseInt((thumbStyle.value.height as string) || '0', 10)
  const maxTop = Math.max(0, trackH - size)
  const maxScroll = Math.max(0, totalEstimatedHeight.value - viewportHeight.value)
  if (maxScroll === 0) return 0
  return Math.round((logicalScrollY.value / maxScroll) * maxTop)
}

let draggingThumb = false
let thumbPointerId: number | null = null
let dragStartClientY = 0
let dragStartTop = 0

function onThumbPointerDown(e: PointerEvent) {
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  draggingThumb = true
  thumbPointerId = e.pointerId
  dragStartClientY = e.clientY
  dragStartTop = currentThumbTop()
}
function onTrackPointerDown(e: PointerEvent) {
  const trackEl = e.currentTarget as HTMLElement
  const rect = trackEl.getBoundingClientRect()
  const clickY = e.clientY - rect.top
  const thumbH = parseInt((thumbStyle.value.height as string) || '0', 10)
  const targetTop = Math.max(0, Math.min(clickY - thumbH / 2, rect.height - thumbH))
  jumpThumbToTop(targetTop)
}
function onRootPointerMove(e: PointerEvent) {
  if (draggingThumb && thumbPointerId === e.pointerId) {
    const trackH = viewportHeight.value
    const thumbH = parseInt((thumbStyle.value.height as string) || '0', 10)
    const maxTop = Math.max(0, trackH - thumbH)
    const dy = e.clientY - dragStartClientY
    const newTop = Math.max(0, Math.min(dragStartTop + dy, maxTop))
    jumpThumbToTop(newTop)
  }
}
function onRootPointerUp(e: PointerEvent) {
  if (thumbPointerId !== e.pointerId) return
  draggingThumb = false
  thumbPointerId = null
}
function jumpThumbToTop(top: number) {
  const trackH = viewportHeight.value
  const thumbH = parseInt((thumbStyle.value.height as string) || '0', 10)
  const maxTop = Math.max(0, trackH - thumbH)
  const maxScroll = Math.max(0, totalEstimatedHeight.value - viewportHeight.value)
  const ratio = maxTop === 0 ? 0 : top / maxTop
  const target = ratio * maxScroll
  setLogicalScroll(target)
}

// 滚轮：纵向自绘；非 wrap 时放行横向滚动（触控板横滑/Shift+滚轮）
function onWheel(e: WheelEvent) {
  const dx = Number.isFinite(e.deltaX) ? e.deltaX : 0
  const dy = Number.isFinite(e.deltaY) ? e.deltaY : 0

  const intendHorizontal =
    !props.wrap && (Math.abs(dx) > Math.abs(dy) || (e.shiftKey && Math.abs(dy) >= Math.abs(dx)))

  if (intendHorizontal) {
    // 放行给 .hl-hscroll 的原生水平滚动
    return
  }

  e.preventDefault()
  const clampedDy = Math.max(-2000, Math.min(2000, dy))
  scrollBy(clampedDy)
}

// 仅中键或触摸启用“拖拽纵向滚动”，左键保留文本选择
let panActive = false
let panPointerId: number | null = null
let panLastY = 0
function onContentPointerDown(e: PointerEvent) {
  const isTouch = e.pointerType === 'touch'
  const isMiddleMouse = e.pointerType === 'mouse' && e.button === 1
  if (!isTouch && !isMiddleMouse) return

  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  panActive = true
  panPointerId = e.pointerId
  panLastY = e.clientY
}
function onContentPointerMove(e: PointerEvent) {
  if (!panActive || panPointerId !== e.pointerId) return
  const dy = panLastY - e.clientY
  panLastY = e.clientY
  if (dy !== 0) scrollBy(dy)
}
function onContentPointerUp(e: PointerEvent) {
  if (panPointerId !== e.pointerId) return
  panActive = false
  panPointerId = null
}

// 外部受控跳转
watch(
  () => props.scrollToIndex,
  (val) => {
    if (val == null) return
    const idx = Math.max(0, Math.min(rowCount.value - 1, Math.floor(val)))
    scrollToIndex(idx, 'start')
  }
)

// 方法暴露
function scrollToIndex(index: number, align: Align = 'start') {
  const N = rowCount.value
  if (N <= 0) return
  const i = Math.max(0, Math.min(N - 1, Math.floor(index)))
  const top = estimatePrefixBefore(i)
  const rowH = heightOf(i)
  let target = top
  if (align === 'center') {
    target = top - (viewportHeight.value - rowH) / 2
  } else if (align === 'end') {
    target = top - (viewportHeight.value - rowH)
  }
  setLogicalScroll(target)
}
function scrollToOffset(offset: number) {
  setLogicalScroll(offset)
}
defineExpose({ scrollToIndex, scrollToOffset })

function bindWheelListener() {
  if (!root.value) return
  root.value.addEventListener('wheel', onWheel, { passive: false })
}
function unbindWheelListener() {
  if (!root.value) return
  root.value.removeEventListener('wheel', onWheel as any)
}

// 行高测量（含 delta 锚定修复）
const rowEls = new Map<number, Element>()
const rowObs = new Map<number, ResizeObserver>()
function setRowEl(el: Element | null, index: number) {
  const oldEl = rowEls.get(index)
  if (oldEl && (!el || oldEl !== el)) {
    const obs = rowObs.get(index)
    if (obs) {
      obs.disconnect()
      rowObs.delete(index)
    }
    rowEls.delete(index)
  }
  if (!el) return
  rowEls.set(index, el)
  const obs = new ResizeObserver((entries) => {
    const entry = entries[0]
    const measured = Math.max(0, Math.round(entry.contentRect.height || (el as HTMLElement).offsetHeight))
    const prev = heights.get(index)
    if (measured > 0 && prev !== measured) {
      const base = prev ?? estimatedRowHeight.value
      const delta = measured - base

      heights.set(index, measured)
      heightsVersion.value++

      if (delta !== 0 && index < firstIndex.value) {
        setLogicalScroll(logicalScrollY.value + delta)
      }
    }
  })
  obs.observe(el as HTMLElement)
  rowObs.set(index, obs)
}

onMounted(() => {
  if (!root.value) return
  ro = new ResizeObserver(updateViewportHeight)
  ro.observe(root.value)
  updateViewportHeight()

  bindWheelListener()
  window.addEventListener('pointermove', onRootPointerMove, { passive: true })
  window.addEventListener('pointerup', onRootPointerUp, { passive: true })
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  unbindWheelListener()
  window.removeEventListener('pointermove', onRootPointerMove as any)
  window.removeEventListener('pointerup', onRootPointerUp as any)
  rowObs.forEach((o) => o.disconnect())
  rowObs.clear()
  rowEls.clear()
})
</script>

<style scoped>
.huge-list {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;  /* 纵向自绘 + 内部横向容器 */
  user-select: text;
  /* 允许原生横向手势，禁止原生纵向手势，避免与自绘冲突 */
  touch-action: pan-x;
  background: transparent;
}

.hl-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden; /* 视口裁剪 */
}

/* 横向原生滚动容器：默认允许横向滚动；wrap 模式下禁用横向滚动 */
.hl-hscroll {
  position: absolute;
  inset: 0;
  overflow-x: auto;
  overflow-y: hidden; /* 纵向仍由自绘控制 */
}
.huge-list.is-wrap .hl-hscroll {
  overflow-x: hidden;
}

/* 内容层：非 wrap 用 max-content 由最宽行撑开；wrap 用 100% */
.hl-layer {
  position: relative;
  height: 100%;
  min-width: 100%;
  width: max-content;
  will-change: transform;
  user-select: text;
}
.huge-list.is-wrap .hl-layer {
  width: 100%;
}

/* 行：非 wrap 允许按内容撑宽；wrap 固定 100% 以触发换行 */
.hl-row {
  position: absolute;
  left: 0;
  min-width: 100%;
  width: max-content;
  will-change: transform, height;
  box-sizing: border-box;
}
.huge-list.is-wrap .hl-row {
  width: 100%;
}

/* 自定义纵向滚动条 */
.hl-scrollbar {
    position: absolute;
    right: 2px;
    top: 2px;
    bottom: 2px;
    width: 18px;
    background: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    background-color: rgba(0, 0, 0, 0.01);
    border-left-color: rgba(0, 0, 0, 0.1);
    border-left-width: 0.5px;
}
.hl-thumb {
    position: absolute;
    left: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background 0.15s ease;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}
.hl-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>