<template>
  <div class="log-item-container">
    <!-- Loaded row -->
    <div
      v-if="stateItem"
      class="log-item"
      :class="rootClasses"
      @click="handleRootClick"
    >
    <div
      v-if="stateItem.line === selectedLine"
      :key="animationKey"
        class="border-animation"
      />
      <div
        class="line-number-cell"
        :style="{ color: hashColorLineIndex(stateItem.filename) }"
        :class="{
          'filtered-line': stateItem.isSearched
        }"
        contenteditable="false"
        @click.stop="toggleMark"
      >
        <span v-html="(stateItem.line + 1)"></span>
        <div class="filename-tooltip">
          <p>{{ stateItem.filename }}</p>
          <p v-if="!tooltipTextCustom">{{ defaultTooltipText }}</p>
          <p v-else v-html="tooltipTextCustom" />
        </div>
      </div>
      <div class="content-cell">
        <div
          class="content"
          v-html="contentHtml"
          @mouseup="$emit('text-mouseup', $event, stateItem)"
        />
      </div>
    </div>

    <!-- Skeleton while loading -->
    <div v-else class="log-item-skeleton" :class="{ 'auto-wrap': isAutoWrap }">
      <div class="line-number-cell skeleton-block" />
      <div class="content-cell">
        <div class="content skeleton-line" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  type PropType,
  watch,
  ref,
  computed,
  onMounted,
  onBeforeUnmount
} from 'vue'
import type { BaseLine } from '../modules/base'

export default defineComponent({
  name: 'AsyncLogLineItem',
  props: {
    index: { type: Number, required: true },
    selectedLine: { type: Number, required: true },
    animationKey: { type: Number, required: true },
    isAutoWrap: { type: Boolean, default: false },
    clickable: { type: Boolean, default: false },
    hashColorLineIndex: {
      type: Function as PropType<(filename: string) => string>,
      required: true
    },
    getItemAsync: {
      type: Function as PropType<(index: number) => Promise<BaseLine>>,
      required: true
    },
    renderLineHtml: {
      type: Function as PropType<(line: BaseLine) => string>,
      required: true
    },
    tooltipTextCustom: { type: String, default: '' },
    defaultTooltipText: { type: String, default: '点击标记该行' },
    dataVersion: { type: Number, default: 0 }
  },
  emits: ['toggle-mark', 'item-click', 'text-mouseup'],
  setup(props, { emit }) {
    const stateItem = ref<BaseLine | null>(null)
    let currentReqId = 0
    let unmounted = false

    const contentHtml = computed(() =>
      stateItem.value ? props.renderLineHtml(stateItem.value) : ''
    )

    const load = async () => {
      const reqId = ++currentReqId
      stateItem.value = null
      try {
        const item = await props.getItemAsync(props.index)
        if (unmounted) return
        if (reqId === currentReqId) {
          stateItem.value = item
        }
      } catch {
        if (reqId === currentReqId) {
          stateItem.value = null
        }
      }
    }

    watch(
      () => [props.index, props.dataVersion],
      () => {
        load()
      },
      { immediate: true }
    )

    onMounted(load)
    onBeforeUnmount(() => {
      unmounted = true
    })

    const rootClasses = computed(() => ({
      'glow-border': stateItem.value?.line === props.selectedLine,
      'even-row': props.index % 2 === 0,
      'odd-row': props.index % 2 === 1,
      'auto-wrap': props.isAutoWrap,
      'marked-line': stateItem.value?.isMarked,
      'semi-marked-line': !stateItem.value?.isMarked, // 只在未标记时添加半标记hover效果
      'selected-line': stateItem.value?.line === props.selectedLine, // 选中行样式
    }))

    const toggleMark = () => {
      if (stateItem.value) emit('toggle-mark', stateItem.value)
    }

    const handleRootClick = () => {
      if (props.clickable && stateItem.value) {
        emit('item-click', stateItem.value)
      }
    }

    return {
      stateItem,
      contentHtml,
      rootClasses,
      toggleMark,
      handleRootClick
    }
  }
})
</script>

<style scoped>
.log-item-container {
  position: relative;
  --log-row-bg: #ffffff;
  --log-row-alt: #e2e8f0;
  --log-row-alt-transparent: rgba(255, 255, 255, 0);
  --log-content-color: #1f2937;
  --log-line-number-bg: #f3f3f3;
  --log-line-number-border: rgba(0, 0, 0, 0.1);
  --log-hover-bg: rgba(226, 232, 240, 0.8);
  --log-hover-line-bg: rgba(226, 232, 240, 1);
  --log-hover-shadow: rgba(100, 116, 139, 0.4);
  --log-hover-border: rgba(100, 116, 139, 0.7);
  --log-hover-overlay: rgba(0, 0, 0, 0.1);
  --log-selected-bg: #fde68a;
  --log-selected-line-bg: #fcd34d;
  --log-selected-border: #d97706;
  --log-selected-shadow: rgba(217, 119, 6, 0.42);
  --log-marked-bg: #bfdbfe;
  --log-marked-border: #2563eb;
  --log-marked-shadow: rgba(37, 99, 235, 0.34);
  --log-marked-selected-bg: #facc15;
  --log-marked-selected-line-bg: #f59e0b;
  --log-marked-selected-border: #b45309;
  --log-filtered-color: #333333;
  --log-filtered-shadow: rgba(0, 0, 0, 0.1);
  --log-skeleton-bg: #ececec;
  --log-skeleton-start: #eeeeee;
  --log-skeleton-mid: #dddddd;
  --log-tooltip-bg: rgba(0, 0, 0, 0.8);
  --log-tooltip-color: #ffffff;
}

:global(html.dark) .log-item-container {
  --log-row-bg: #0f172a;
  --log-row-alt: rgba(30, 41, 59, 0.72);
  --log-row-alt-transparent: rgba(15, 23, 42, 0);
  --log-content-color: #e5e7eb;
  --log-line-number-bg: #111827;
  --log-line-number-border: rgba(148, 163, 184, 0.22);
  --log-hover-bg: rgba(51, 65, 85, 0.82);
  --log-hover-line-bg: rgba(51, 65, 85, 0.95);
  --log-hover-shadow: rgba(148, 163, 184, 0.22);
  --log-hover-border: rgba(148, 163, 184, 0.62);
  --log-hover-overlay: rgba(255, 255, 255, 0.08);
  --log-selected-bg: rgba(146, 64, 14, 0.88);
  --log-selected-line-bg: rgba(180, 83, 9, 0.96);
  --log-selected-border: #fbbf24;
  --log-selected-shadow: rgba(251, 191, 36, 0.46);
  --log-marked-bg: rgba(29, 78, 216, 0.7);
  --log-marked-border: #93c5fd;
  --log-marked-shadow: rgba(147, 197, 253, 0.36);
  --log-marked-selected-bg: rgba(161, 98, 7, 0.95);
  --log-marked-selected-line-bg: rgba(202, 138, 4, 0.98);
  --log-marked-selected-border: #fde047;
  --log-filtered-color: #f8fafc;
  --log-filtered-shadow: rgba(255, 255, 255, 0.18);
  --log-skeleton-bg: #1f2937;
  --log-skeleton-start: #1f2937;
  --log-skeleton-mid: #334155;
  --log-tooltip-bg: rgba(15, 23, 42, 0.96);
  --log-tooltip-color: #f8fafc;
}

@media (prefers-color-scheme: dark) {
  .log-item-container {
    --log-row-bg: #0f172a;
    --log-row-alt: rgba(30, 41, 59, 0.72);
    --log-row-alt-transparent: rgba(15, 23, 42, 0);
    --log-content-color: #e5e7eb;
    --log-line-number-bg: #111827;
    --log-line-number-border: rgba(148, 163, 184, 0.22);
    --log-hover-bg: rgba(51, 65, 85, 0.82);
    --log-hover-line-bg: rgba(51, 65, 85, 0.95);
    --log-hover-shadow: rgba(148, 163, 184, 0.22);
    --log-hover-border: rgba(148, 163, 184, 0.62);
    --log-hover-overlay: rgba(255, 255, 255, 0.08);
    --log-selected-bg: rgba(146, 64, 14, 0.88);
    --log-selected-line-bg: rgba(180, 83, 9, 0.96);
    --log-selected-border: #fbbf24;
    --log-selected-shadow: rgba(251, 191, 36, 0.46);
    --log-marked-bg: rgba(29, 78, 216, 0.7);
    --log-marked-border: #93c5fd;
    --log-marked-shadow: rgba(147, 197, 253, 0.36);
    --log-marked-selected-bg: rgba(161, 98, 7, 0.95);
    --log-marked-selected-line-bg: rgba(202, 138, 4, 0.98);
    --log-marked-selected-border: #fde047;
    --log-filtered-color: #f8fafc;
    --log-filtered-shadow: rgba(255, 255, 255, 0.18);
    --log-skeleton-bg: #1f2937;
    --log-skeleton-start: #1f2937;
    --log-skeleton-mid: #334155;
    --log-tooltip-bg: rgba(15, 23, 42, 0.96);
    --log-tooltip-color: #f8fafc;
  }
}
.log-item,
.log-item-skeleton {
  white-space: pre;
  font-family: monospace;
  position: relative;
  width: 100%;
  display: table;
  table-layout: fixed;
  color: var(--log-content-color);
}
.auto-wrap {
  white-space: break-spaces;
  word-wrap: break-word;
  word-break: break-all;
}

/* 奇偶行样式 - 增强对比度，行号部分不使用渐变 */
.log-item.even-row {
  background: linear-gradient(
    45deg,
    var(--log-row-alt) 25%,
    var(--log-row-alt-transparent) 25%,
    var(--log-row-alt-transparent) 50%,
    var(--log-row-alt) 50%,
    var(--log-row-alt) 75%,
    var(--log-row-alt-transparent) 75%,
    var(--log-row-alt-transparent)
  );
  background-size: 3px 3px;
}

.log-item.odd-row {
  background-color: var(--log-row-bg);
}

.log-item.even-row .line-number-cell {
  background-image: none !important;
}

.log-item.odd-row .line-number-cell {
  background-image: none !important;
}
.log-item:hover::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9;
  mix-blend-mode: multiply;
  background-color: var(--log-hover-overlay);
}

:global(html.dark) .log-item:hover::before {
  mix-blend-mode: screen;
}

@media (prefers-color-scheme: dark) {
  .log-item:hover::before {
    mix-blend-mode: screen;
  }
}

/* 半标记状态的 hover 效果 - 增强可见性，使用更明显的灰蓝色 */
.log-item.semi-marked-line:hover:not(.glow-border):not(.marked-line) {
  background-color: var(--log-hover-bg) !important;
  box-shadow: inset 0 0 4px var(--log-hover-shadow);
}

.log-item.semi-marked-line:hover:not(.glow-border):not(.marked-line) .line-number-cell {
  background-color: var(--log-hover-line-bg) !important;
  border-left: 3px solid var(--log-hover-border);
}

.log-item:hover .line-number-cell {
  box-shadow: inset 0 0 0 999px var(--log-hover-overlay);
}

:global(html.dark) .log-item:hover .line-number-cell {
  box-shadow: inset 0 0 0 999px var(--log-hover-overlay);
}

/* 覆盖默认的 hover 效果，避免冲突 */
.log-item.semi-marked-line:hover:not(.glow-border)::before {
  display: none;
}

/* 选中行样式 - 使用黄色系表示当前选中 */
.log-item.selected-line {
  background: var(--log-selected-bg) !important;
  box-shadow:
    inset 0 0 0 1px var(--log-selected-shadow),
    inset 5px 0 0 var(--log-selected-border);
}

.log-item.selected-line .line-number-cell {
  background-color: var(--log-selected-line-bg) !important;
  border-left: 6px solid var(--log-selected-border);
  color: var(--log-filtered-color) !important;
  font-weight: 700;
}

/* 隐藏选中行的动画边框，使用新的背景样式替代 */
.log-item.selected-line .border-animation {
  display: none;
}
.border-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  mix-blend-mode: multiply;
  background-color: var(--log-hover-overlay);
}

:global(html.dark) .border-animation {
  mix-blend-mode: screen;
}

@media (prefers-color-scheme: dark) {
  .border-animation {
    mix-blend-mode: screen;
  }
}
@keyframes borderPulse {
  0% {
    border-color: #10a37f;
    box-shadow: 0 0 8px rgba(16, 163, 127, 0.6);
  }
  33% {
    border-color: #0ea5e9;
    box-shadow: 0 0 8px rgba(14, 165, 233, 0.6);
  }
  66% {
    border-color: #8b5cf6;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
  }
  100% {
    border-color: darkgray;
    box-shadow: none;
  }
}
.line-number-cell {
  display: table-cell;
  position: sticky;
  left: 0;
  width: 66px;
  text-align: right;
  padding-right: 4px;
  padding-left: 8px;
  color: gray;
  font-family: monospace;
  background-color: var(--log-line-number-bg);
  user-select: none;
  z-index: 10;
  cursor: pointer;
  vertical-align: top;
  border-left: 3px solid transparent;
  border-right: 1px solid var(--log-line-number-border);
}
.line-number-cell .filename-tooltip {
  display: none;
  position: absolute;
  left: 30%;
  top: -120%;
  transform: translateY(-50%);
  background: var(--log-tooltip-bg);
  text-align: left;
  color: var(--log-tooltip-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-left: 8px;
  z-index: 1000;
  pointer-events: none;
}
.line-number-cell:hover .filename-tooltip {
  display: block;
}
.content-cell {
  display: table-cell;
  width: 100%;
  position: relative;
  overflow: visible;
  vertical-align: top;
}
.content {
  padding: 0 2px;
}
.filtered-line {
  font-weight: 700;
  color: var(--log-filtered-color);
  text-shadow: 0 0 0.5px var(--log-filtered-shadow);
}
.log-item.marked-line {
  background: var(--log-marked-bg) !important;
  box-shadow:
    inset 0 0 0 1px var(--log-marked-shadow),
    inset 4px 0 0 var(--log-marked-border);
}
.log-item.marked-line .line-number-cell {
  background-color: var(--log-marked-bg) !important;
  border-left: 6px solid var(--log-marked-border);
  color: var(--log-filtered-color) !important;
  font-weight: 700;
}

.log-item.marked-line.selected-line {
  background: var(--log-marked-selected-bg) !important;
  box-shadow:
    inset 0 0 0 1px var(--log-selected-shadow),
    inset 6px 0 0 var(--log-marked-selected-border);
}

.log-item.marked-line.selected-line .line-number-cell {
  background-color: var(--log-marked-selected-line-bg) !important;
  border-left: 6px solid var(--log-marked-selected-border);
}
/* Skeleton */
.log-item-skeleton .line-number-cell {
  display: table-cell;
  width: 66px;
  background: var(--log-skeleton-bg);
  position: sticky;
  left: 0;
  z-index: 10;
  vertical-align: top;
  border-left: 3px solid transparent;
  border-right: 1px solid var(--log-line-number-border);
}
.log-item-skeleton .content-cell {
  display: table-cell;
  width: 100%;
  vertical-align: top;
}
.skeleton-block {
  width: 66px;
  height: 1em;
  background: linear-gradient(90deg, var(--log-skeleton-start), var(--log-skeleton-mid), var(--log-skeleton-start));
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}
.skeleton-line {
  width: 80%;
  height: 1em;
  margin-left: 8px;
  background: linear-gradient(90deg, var(--log-skeleton-start), var(--log-skeleton-mid), var(--log-skeleton-start));
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}
@keyframes pulse {
  0% {
    background-position: 0%;
  }
  100% {
    background-position: 100%;
  }
}
</style>
