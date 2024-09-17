<template>
  <div class="log-panel" v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.index" class="log-item" v-html="showIt(item.data)"
        :class="{ highlighted: item.data.line === selectedLine }"></div>
    </div>
  </div>

  <div class="input-group mb-3">
    <input 
      type="text" 
      v-model="searchTerm" 
      @input="handleSearchInput" 
      @keyup.enter="searchLogs"
      class="form-control" 
      placeholder="输入搜索关键词" 
    />
    <button @click="searchLogs" class="btn btn-primary">搜索</button>
  </div>
  <div>搜索结果: {{ searchResult.length }} 条</div>
  <div v-if="searchError" class="alert alert-danger">{{ searchError }}</div>
  <div class="log-panel" v-bind="searchContainerProps">
    <div v-bind="searchWrapperProps">
      <div v-for="item in searchList" :key="item.index" class="log-item" v-html="showIt(item.data)"
        @dblclick="jumpToLine(item.data.line)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
const searchError = ref('')

// 新增：用于存储原始文件内容的引用
const originalFileContent = ref([])

// 修改：计算属性，用于获取当前显示的内容（经过预过滤器处理后的内容）
const filteredContent = computed(() => {
  const activePrefilters = props.prefilters.filter(p => p.active)
  console.log('Active prefilters:', activePrefilters)
  if (activePrefilters.length === 0) {
    console.log('No active prefilters, returning original content')
    return originalFileContent.value
  }
  const combinedRegex = new RegExp(activePrefilters.map(p => `(${p.regex})`).join('|'), 'gi')
  console.log('Combined regex:', combinedRegex)
  const filtered = originalFileContent.value.filter(item => item.content.match(combinedRegex))
  console.log('Filtered content length:', filtered.length)
  return filtered
})

const handleSearchInput = () => {
  // 当用户手动编辑搜索框时，更新 prefilters 的 active 状态
  props.prefilters.forEach(prefilter => {
    prefilter.active = searchTerm.value.includes(prefilter.regex)
  })
}

const searchLogs = () => {
  console.log('Searching logs with term:', searchTerm.value)
  searchError.value = ''  // 重置错误消息
  if (!searchTerm.value.trim()) {
    searchResult.value = []
    console.log('Empty search term, clearing results')
    return
  }

  try {
    const searchRegex = new RegExp(searchTerm.value, 'gi');
    console.log('Search regex:', searchRegex)
    
    const matches = originalFileContent.value.filter(item => {
      return item.content.match(searchRegex)
    })
    
    console.log('Search matches:', matches.length)
    searchResult.value = matches
  } catch (error) {
    console.error('搜索出错:', error)
    searchError.value = '无效的搜索表达式。请检查您的输入并重试。'
    searchResult.value = []
  }
}

const showIt = (item) => {
  const lineData = `<span class="line-number">${item.line}</span>`
  return lineData + props.highlight(item.content)
}

// 修改：使用 filteredContent 计算属性
const mylines = computed(() => filteredContent.value)
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(mylines, { itemHeight: 24 })

// 修改：使用 searchResult 而不是 mysearchlines
const { list: searchList, containerProps: searchContainerProps, wrapperProps: searchWrapperProps, scrollTo: scrollToSearch } = useVirtualList(
  searchResult,
  { itemHeight: 24 }
)

// 修改：监听 props.fileContent 的变化
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
  { immediate: true, deep: true }
)

// 新增：监听 filteredContent 的变化
watch(
  filteredContent,
  () => {
    console.log('Filtered content changed, re-running search')
    searchLogs()
  },
  { deep: true }
)

const jumpToLine = (lineNum) => {
  scrollTo(lineNum - 5)
  selectedLine.value = lineNum
}

// Add this method to handle the applied prefilter
const applyPrefilter = ({ regex, action, prefilter }) => {
  console.log('Applying prefilter:', { regex, action, prefilter })
  if (action === 'toggle' && prefilter) {
    if (prefilter.active) {
      if (!searchTerm.value.includes(prefilter.regex)) {
        searchTerm.value = searchTerm.value ? `${searchTerm.value}|${prefilter.regex}` : prefilter.regex
        console.log('Added prefilter to search term:', searchTerm.value)
      }
    } else {
      searchTerm.value = searchTerm.value.replace(new RegExp(`\\|?${prefilter.regex}\\|?`), '')
      searchTerm.value = searchTerm.value.replace(/^\||\|$/g, '')
      console.log('Removed prefilter from search term:', searchTerm.value)
    }
  } else {
    searchTerm.value = regex
    console.log('Set search term to regex:', regex)
  }
  searchLogs()
}

// Expose the applyPrefilter method
defineExpose({ applyPrefilter })
</script>

<style scoped>
.log-panel {

  height: 50%;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  white-space: pre-wrap;
}

.input-group {
  margin: .6rem 0px .6rem 0px !important;
  font-size: small;
}

.log-item {
  font-size: small;
  word-break: break-all;
  white-space: pre;
  /* white-space: pre-wrap; */
  border-bottom: 1px dashed #ccc;
}

.log-item:hover {
  background-color: cornsilk;
}

::v-deep .line-number {
  user-select: none;
  /* Prevent selection */
  min-width: 24px;
  display: inline-block;
  color: gray;
  text-align: right;
  margin-right: 10px;
}

@keyframes flash {

  0%,
  50%,
  100% {
    background-color: yellow;
    font-size: large;
  }

  25%,
  75% {
    background-color: red;
  }
}

.highlighted {
  background-color: yellow;
  color: red;

  animation: flash 0.5s ease;
}
</style>