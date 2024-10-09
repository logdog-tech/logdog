<template>
    <div class="log-container">
        <div class="log-panel original-log" v-bind="containerProps" :style="{ height: originalLogHeight }">
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

            <div class="log-panel search-results" v-bind="searchContainerProps">
                <div v-bind="searchWrapperProps">
                    <div v-for="item in searchList" :key="item.index" class="log-item" v-html="showIt(item.data)"
                        @click="jumpToLine(item.data.line)" :class="{ highlighted: item.data.line === selectedLine }">
                    </div>
                </div>
            </div>
            <div class="search-result-count">检索到{{ searchResult.length }}行</div>
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
    highlight: { type: Function, required: true }
})

const selectedLine = ref(null)
const searchTerm = ref('')
const searchResult = ref([])

// 用于存储原始文件内容的引用
const originalFileContent = shallowRef([])

const originalLogHeight = ref('50%')
const containerHeight = ref(0)

onMounted(() => {
    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
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

.search-result-count {
    font-size: small;
    padding-left: 0px;
    color: gray;
    flex-shrink: 0;
}

.custom-input {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.custom-button {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}
</style>