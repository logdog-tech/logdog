<template>
  <div class="log-panel" v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.index" class="log-item" :class="{ 'highlighted': item.data.line === selectedLine }">
        <span class="line-number" v-html="item.data.line"></span><span v-html="showIt(item.data)"></span>
      </div>
    </div>
  </div>

  <div class="input-group mb-3">
    <input type="text" v-model="searchTerm" @keyup.enter="searchLogs" class="form-control" placeholder="输入搜索关键词">
    <button @click="searchLogs" class="btn btn-primary">搜索</button>
  </div>
  <div class="log-panel" v-bind="searchContainerProps">
    <div v-for="item in searchList" :key="item.index" class="log-item" @dblclick="jumpToLine(item.data.line)">
      <span class="line-number" v-html="item.data.line"></span><span v-html="showIt(item.data)"></span>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import { useVirtualList } from '@vueuse/core';

const props = defineProps({
  fileContent: { type: Array, required: true },
  rules: { type: Array, required: true },
  highlight: { type: Function, required: true }
})

const selectedLine = ref(null);
const searchTerm = ref('')
const searchResult = ref([])

const searchLogs = () => {
  console.log("searchLogs")
  const regex = new RegExp(searchTerm.value, 'gi')

  console.log("searchLogs regex", regex)
  const matches = props.fileContent.filter(item => item.content.match(regex))

  console.log("searchLogs matches", matches.length)
  searchResult.value = matches
}

const showIt = (item) => {
  return props.highlight(item.content)
}

const mylines = computed(() => props.fileContent)
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(mylines, { itemHeight: 24 });



const mysearchlines = computed(() => { return searchResult.value })
const { list: searchList, containerProps: searchContainerProps, wrapperProps: searchWrapperProps, scrollTo: scrollToSearch } = useVirtualList(
  mysearchlines,
  { itemHeight: 24 },
);

// 更新 watch 监听器
watch(() => props.fileContent, (newFileContent) => {
  scrollTo(0);         // 滚动主日志列表到顶部
  scrollToSearch(0);   // 滚动搜索结果列表到顶部
  searchResult.value = [];
  searchTerm.value = '';
}, { deep: true });

const jumpToLine = (lineNum) => {
  scrollTo(lineNum - 5);
  selectedLine.value = lineNum;  // 设置当前选中的行号
};
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

.line-number {
  user-select: none;
  /* Prevent selection */
  min-width: 24px;
  display: inline-block;
  color: gray;
  text-align: right;
  margin-right: 10px;
}

@keyframes flash {
  0%, 50%, 100% {
    background-color: yellow;
    font-size: large;
  }
  25%, 75% {
    background-color: red;
  }
}
.highlighted {
  background-color: yellow;
  color: red;

  animation: flash 0.5s ease;
}
</style>