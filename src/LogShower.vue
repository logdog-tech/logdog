<template>
    <div class="log-container">
        <div class="log-panel original-log" v-bind="containerProps" :style="{ height: originalLogHeight }" @mouseup="handleLogTextSelection">
            <div v-bind="wrapperProps">
                <div v-for="item in list" :key="item.index" class="log-item" v-html="showIt(item.data)"
                    :class="{ highlighted: item.data.line === selectedLine }"></div>
            </div>
        </div>

        <div class="resizer" @mousedown="startResize">
            <div class="resizer-handle"></div>
        </div>

        <div class="search-and-results">
            <div class="input-group mb-3">
                <input type="text" v-model="searchTerm" @input="handleSearchInput" @keyup.enter="searchLogs"
                    class="form-control custom-input" placeholder="输入搜索关键词" />
                <button @click="searchLogs" class="btn btn-primary custom-button">搜索</button>
            </div>

            <div class="log-panel search-results" v-bind="searchContainerProps" @mouseup="handleLogTextSelection">
                <div v-bind="searchWrapperProps">
                    <div v-for="item in searchList" :key="item.index" class="log-item" v-html="showIt(item.data)"
                        @click="jumpToLine(item.data.line)" :class="{ highlighted: item.data.line === selectedLine }">
                    </div>
                </div>
            </div>
            <div class="flex flex-row items-center w-full">
                

                <div v-if="selectedText" class="text-[12px] text-gray-600 select-none">点击色块染色</div>
                <button v-if="selectedText"  v-for="(scheme, index) in colorSchemes" :key="index" 
                        class="w-6 h-4 mx-1 flex items-center justify-center text-xs cursor-pointer transition-transform duration-100 hover:scale-110"
                        :style="{ backgroundColor: scheme.backColor, color: scheme.foreColor }"
                        @click="applyColorScheme(scheme)">
                    {{ scheme.isClear ? 'x' : 'Aa' }}
                </button>
                <div class="flex-grow"></div>
                <div class="text-[12px] text-gray-600 select-none">检索到{{ searchResult.length }}行</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted } from 'vue'
import { useVirtualList } from '@vueuse/core'

const props = defineProps({
    fileContent: { type: Array, required: true },
    rules: { type: Array, required: true },
    prefilters: { type: Array, required: true },
    highlight: { type: Function, required: true },
    sessionRules: { type: Array, required: true }
})

const selectedLine = ref(null)
const searchTerm = ref('')
const searchResult = ref([])

// 用于存储原始文件内容的引用
const originalFileContent = shallowRef([])

const originalLogHeight = ref('50%')
const containerHeight = ref(0)

const emit = defineEmits(['updateSessionRules'])

const selectedText = ref('')

const colorSchemes = [
  { foreColor: '#FFFFFF', backColor: '#FF0000' }, // 白字红底
  { foreColor: '#000000', backColor: '#FFA500' }, // 黑字橙底
  { foreColor: '#000000', backColor: '#FFFF00' }, // 黑字黄底
  { foreColor: '#FFFFFF', backColor: '#008000' }, // 白字绿底
  { foreColor: '#FFFFFF', backColor: '#0000FF' }, // 白字蓝底
  { foreColor: '#FFFF00', backColor: '#800080' }, // 黄字紫底
  { foreColor: '#FFFFFF', backColor: '#A52A2A' }, // 白字棕底
  { foreColor: '#FF00FF', backColor: '#00FFFF' }, // 粉字青底
  { foreColor: 'auto', backColor: 'lightgray', isClear: true }, // 清除染色
]

const applyColorScheme = (scheme) => {
  if (selectedText.value) {
    const newRule = {
      id: Date.now(),
      name: `高亮: ${selectedText.value}`,
      regex: escapeRegExp(selectedText.value),
      foreColor: scheme.foreColor,
      backColor: scheme.backColor,
      isClear: scheme.isClear
    }
    emit('updateSessionRules', newRule)
    selectedText.value = ''
  }
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

onMounted(() => {
    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    // 移除全局的 mouseup 事件监听器
    // document.addEventListener('mouseup', handleTextSelection)
})

const updateContainerHeight = () => {
    const container = document.querySelector('.log-container')
    if (container) {
        containerHeight.value = container.clientHeight
        // 确保初始高度不超过容器高度的限制
        const initialHeight = Math.min(containerHeight.value * 0.5, containerHeight.value - 200)
        originalLogHeight.value = `${initialHeight}px`
    }
}

const isResizing = ref(false)
const startY = ref(0)
const startHeight = ref(0)

const handleSearchInput = () => {
    // 当用户手动编辑搜索框时，更新 prefilters 的 active 状态
    props.prefilters.forEach(prefilter => {
        prefilter.active = searchTerm.value.includes(prefilter.regex)
    })
}

const searchLogs = () => {

    console.log('开始日志检索: ', "搜索条件" + searchTerm.value + "搜索任务总行数=" + originalFileContent.value.length)
    console.time('🕘日志检索')

    const searchRegex = new RegExp(searchTerm.value, '');
    console.timeLog('🕘日志检索', 's2, 完成正则创建')
    if (!searchTerm.value.trim()) {
        searchResult.value = []
    } else {
        searchResult.value = originalFileContent.value.filter(item => {
            return searchRegex.test(item.content)
        })
    }

    console.timeLog('🕘日志检索', 's3, 完成过滤')
    console.timeEnd('🕘日志检索')
}

const showIt = (item) => {
    const lineData = `<span class="line-number">${item.line}</span>`
    return lineData + props.highlight(item.content)
}

// 使用 originalFileContent 而不是 filteredContent
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(originalFileContent, { itemHeight: 18 })

const { list: searchList, containerProps: searchContainerProps, wrapperProps: searchWrapperProps, scrollTo: scrollToSearch } = useVirtualList(
    searchResult,
    { itemHeight: 18 }
)

// 监听 props.fileContent 的变
watch(
    () => props.fileContent,
    (newFileContent) => {
        console.log('File content updated, length:', newFileContent.length)
        originalFileContent.value = newFileContent
        scrollTo(0)
        scrollToSearch(0)
        searchResult.value = []
        searchTerm.value = ''
    },
    { immediate: true, deep: false }
)

const jumpToLine = (lineNum) => {
    scrollTo(lineNum - 5)
    selectedLine.value = lineNum
}

// 处理应用过滤器
const applyPrefilter = ({ regex, action, prefilter }) => {
    console.log('Applying prefilter:', { regex, action, prefilter })
    if (action === 'toggle' && prefilter) {
        const currentFilters = searchTerm.value ? searchTerm.value.split('|') : [];
        if (prefilter.active) {
            // 添加预过滤器
            if (!currentFilters.includes(prefilter.regex)) {
                currentFilters.push(prefilter.regex);
                searchTerm.value = currentFilters.join('|');
                console.log('Added prefilter to search term:', searchTerm.value)
            }
        } else {
            // 移除预过滤器
            const index = currentFilters.indexOf(prefilter.regex);
            if (index !== -1) {
                currentFilters.splice(index, 1);
                searchTerm.value = currentFilters.join('|');
                console.log('Removed prefilter from search term:', searchTerm.value)
            } else {
                console.log('Prefilter not found in search term:', searchTerm.value)
            }
        }
    } else {
        searchTerm.value = regex
        console.log('Set search term to regex:', regex)
    }
    searchLogs()
}

// 暴露 applyPrefilter 方法
defineExpose({ applyPrefilter })

const startResize = (event) => {
    event.preventDefault()
    isResizing.value = true
    startY.value = event.clientY
    startHeight.value = parseInt(originalLogHeight.value)

    const resize = (moveEvent) => {
        const diff = moveEvent.clientY - startY.value
        const newHeight = Math.max(100, Math.min(containerHeight.value - 200, startHeight.value + diff))
        originalLogHeight.value = `${newHeight}px`
    }

    const stopResize = () => {
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
    }

    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
}

const resize = (moveEvent) => {
    if (isResizing.value) {
        const containerHeight = document.querySelector('.log-container').clientHeight
        const diff = moveEvent.clientY - startY.value
        const newHeight = Math.max(100, Math.min(containerHeight - 200, startHeight.value + diff))
        originalLogHeight.value = `${newHeight}px`
    }
}

const stopResize = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', resize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
}

// 新的处理日志文本选择的函数
const handleLogTextSelection = (event) => {
  const selection = window.getSelection()
  const selectedStr = selection.toString().trim()
  
  if (selectedStr) {
    // 检查选中文本是否在日志面板内
    let node = selection.anchorNode
    while (node != null) {
      if (node.classList && (node.classList.contains('original-log') || node.classList.contains('search-results'))) {
        selectedText.value = selectedStr
        return
      }
      node = node.parentNode
    }
  }
  
  // 如果不在日志面板内，或没有选中文本，则清空 selectedText
  selectedText.value = ''
}
</script>

<style scoped>
.log-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.log-panel {
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 10px;
    white-space: pre-wrap;
    border-radius: 5px;
}

.original-log {
    flex-shrink: 0;
}

.input-group {
    margin: .0rem 0px .6rem 0px !important;
    margin-bottom: 0px !important;
    font-size: small;
    flex-shrink: 0;
}

.log-item {
    font-size: 12px;
    word-break: break-all;
    white-space: pre;
    min-width: 1200px;
}

.log-item:hover {
    background-color: cornsilk;
    position: relative;
    z-index: 0;
}

::v-deep .line-number {
    user-select: none;
    min-width: 24px;
    display: inline-block;
    font-size: 12px;
    color: gray;
    text-align: right;
    margin-right: 10px;
}

.highlighted {
    position: relative;
    z-index: 1;
    background-color: rgba(255, 0, 0, 0.1);
    box-shadow: 0 0 5px red;
}

.resizer {
    height: 10px;
    background-color: transparent;
    cursor: ns-resize;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.resizer:hover {
    background-color: rgba(0, 0, 128, 0.063);
}

.resizer-handle {
    width: 40px;
    height: 5px;
    background-color: #ccc;
    transition: background-color 0.2s ease;
    border-radius: 15px;
}

.resizer:hover .resizer-handle {
    background-color: #666;
}

.search-and-results {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;
}

.search-results {
    flex-grow: 1;
    min-height: 100px;
    border-radius: 0px 0px 5px 5px;
    border-top: 0px solid #ccc;
}

.custom-input {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.custom-button {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}
.color-scheme {
    /* display: inline-block; */
    /* width: 16px; */
    /* height: 16px; */
    /* border: 1px solid #ccc; */
    /* border-radius: 3px; */
    cursor: pointer;
    margin: 0px 5px;
    padding: 0px 5px;
}

/* 确保没有其他样式覆盖了 flex 布局 */
.search-and-results {
    display: flex;
    flex-direction: column;
}

/* 如果有任何可能覆盖 Tailwind 类的自定义样式，请检查并移除或调整它们 */
</style>