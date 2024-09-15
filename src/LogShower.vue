<template>
  <div class="log-panel" v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.index" class="log-item" v-html="showIt(item.data)"
        :class="{ highlighted: item.data.line === selectedLine }"></div>
    </div>
  </div>

  <div class="input-group mb-3">
    <input type="text" v-model="searchTerm" @input="handleSearchInput" class="form-control" placeholder="输入搜索关键词" />
    <button @click="searchLogs" class="btn btn-primary">搜索</button>
  </div>
  <div class="log-panel" v-bind="searchContainerProps">
    <div v-for="item in searchList" :key="item.index" class="log-item" v-html="showIt(item.data)"
      @dblclick="jumpToLine(item.data.line)"></div>
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

const handleSearchInput = () => {
  // 当用户手动编辑搜索框时，更新 prefilters 的 active 状态
  props.prefilters.forEach(prefilter => {
    prefilter.active = searchTerm.value.includes(prefilter.regex)
  })
}

const searchLogs = () => {
  if (!searchTerm.value) {
    searchResult.value = []
    return
  }
  const regex = new RegExp(searchTerm.value, 'gi')
  const matches = props.fileContent.filter(item => item.content.match(regex))
  searchResult.value = matches
}

const showIt = (item) => {
  const lineData = `<span class="line-number">${item.line}</span>`
  return lineData + props.highlight(item.content)
}

const mylines = computed(() => props.fileContent)
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(mylines, { itemHeight: 24 })

const mysearchlines = computed(() => searchResult.value)
const { list: searchList, containerProps: searchContainerProps, wrapperProps: searchWrapperProps, scrollTo: scrollToSearch } = useVirtualList(
  mysearchlines,
  { itemHeight: 24 }
)

watch(
  () => props.prefilters,
  (newPrefilters) => {
    const activePrefilters = newPrefilters.filter(p => p.active)
    if (activePrefilters.length > 0) {
      const combinedRegex = activePrefilters.map(p => p.regex).join('|')
      const prefilterRegex = new RegExp(combinedRegex, 'gi')
      const filteredContent = props.fileContent.filter(item => item.content.match(prefilterRegex))
      mylines.value = filteredContent
    } else {
      mylines.value = props.fileContent
    }
  },
  { deep: true }
)

watch(
  () => props.fileContent,
  (newFileContent) => {
    scrollTo(0)
    scrollToSearch(0)
    searchResult.value = []
    searchTerm.value = ''
  },
  { deep: true }
)

const jumpToLine = (lineNum) => {
  scrollTo(lineNum - 5)
  selectedLine.value = lineNum
}

// Add this method to handle the applied prefilter
const applyPrefilter = ({ regex, action, prefilter }) => {
  if (action === 'toggle' && prefilter) {
    if (prefilter.active) {
      // 如果过滤器被激活，且搜索框中不存在该正则，则添加
      if (!searchTerm.value.includes(prefilter.regex)) {
        searchTerm.value = searchTerm.value ? `${searchTerm.value}|${prefilter.regex}` : prefilter.regex
      }
    } else {
      // 如果过滤器被取消激活，从搜索框中移除该正则
      searchTerm.value = searchTerm.value.replace(new RegExp(`\\|?${prefilter.regex}\\|?`), '')
      // 清理开头或结尾的 |
      searchTerm.value = searchTerm.value.replace(/^\||\|$/g, '')
    }
  } else {
    searchTerm.value = regex
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