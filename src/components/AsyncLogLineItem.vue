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
        <span v-html="stateItem.line + 1"></span>
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
      'bg-surface-100 dark:bg-surface-700': props.index % 2 === 0,
      'auto-wrap': props.isAutoWrap,
      'marked-line': stateItem.value?.isMarked,
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
}
.log-item,
.log-item-skeleton {
  white-space: pre;
  font-family: monospace;
  position: relative;
  width: 100%;
  display: table;
  table-layout: fixed;
}
.auto-wrap {
  white-space: break-spaces;
  word-wrap: break-word;
  word-break: break-all;
}
.log-item:hover:not(.glow-border)::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9;
  mix-blend-mode: multiply;
  background-color: rgba(0, 0, 0, 0.1);
}
.border-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  mix-blend-mode: multiply;
  background-color: rgba(0, 0, 0, 0.1);
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
  width: 60px;
  text-align: right;
  padding-right: 4px;
  padding-left: 8px;
  color: gray;
  font-family: monospace;
  background-color: #f3f3f3;
  user-select: none;
  z-index: 10;
  cursor: pointer;
  vertical-align: top;
  border-left: 3px solid transparent;
}
.line-number-cell .filename-tooltip {
  display: none;
  position: absolute;
  left: 30%;
  top: -120%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  text-align: left;
  color: white;
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
  padding: 0 8px;
}
.filtered-line {
  font-weight: 700;
  color: #333;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.1);
}
.log-item.marked-line {
  background-color: #f3e5f5;
  box-shadow: inset 0 0 3px rgba(156, 39, 176, 0.2);
}
.log-item.marked-line .line-number-cell {
  background-color: #f3e5f5;
  border-left: 3px solid #9c27b0;
}
/* Skeleton */
.log-item-skeleton .line-number-cell {
  display: table-cell;
  width: 60px;
  background: #ececec;
  position: sticky;
  left: 0;
  z-index: 10;
  vertical-align: top;
  border-left: 3px solid transparent;
}
.log-item-skeleton .content-cell {
  display: table-cell;
  width: 100%;
  vertical-align: top;
}
.skeleton-block {
  width: 60px;
  height: 1em;
  background: linear-gradient(90deg, #eee, #ddd, #eee);
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}
.skeleton-line {
  width: 80%;
  height: 1em;
  margin-left: 8px;
  background: linear-gradient(90deg, #eee, #ddd, #eee);
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