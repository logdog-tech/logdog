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
  <div class="log-panel" v-bind="searchContainerProps">
    <div v-bind="searchWrapperProps">
      <div v-for="item in searchList" :key="item.index" class="log-item" v-html="showIt(item.data)"
        @click="jumpToLine(item.data.line)" :class="{ highlighted: item.data.line === selectedLine }"></div>
    </div>
  </div>
  <div style="font-size: small; padding-left: 0px; color: gray;">检索到{{ searchResult.length }}行</div>

</template>

<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
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

// 监听 props.fileContent 的变化
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

// 处理应用预过滤器
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
  font-size: 12px;
  word-break: break-all;
  white-space: pre;
  min-width: 1200px;
  /* line-height: 18px; */
  /* white-space: pre-wrap; */
  /* border-bottom: 1px dashed #ccc; */
}

.log-item:hover {
  background-color: cornsilk;
  position: relative;
  z-index: 0;
}

::v-deep .line-number {
  user-select: none;
  /* Prevent selection */
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
</style>