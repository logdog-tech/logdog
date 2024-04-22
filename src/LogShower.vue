<template>
  <div class="log-panel" v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.index" class="log-item">
        <span class="line-number" v-html="item.data.line"></span><span v-html="showIt(item.data)"></span>
      </div>
    </div>
  </div>

  <div class="input-group mb-3">
    <input type="text" v-model="searchTerm" @keyup.enter="searchLogs" class="form-control" placeholder="输入搜索关键词">
    <button @click="searchLogs" class="btn btn-primary">搜索</button>
  </div>
  <div  class="log-panel" v-bind="searchContainerProps">
    <div v-bind="searchWrapperProps">
      <div v-for="item in searchList" :key="item.index" class="log-item">
        <span class="line-number" v-html="item.data.line"></span><span v-html="showIt(item.data)"></span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVirtualList } from '@vueuse/core';

const props = defineProps({
  fileContent: { type: Array, required: true },
  rules: { type: Array, required: true },
  highlight: { type: Function, required: true }
})

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

const mylines = computed(() =>props.fileContent)
const { list, containerProps, wrapperProps } = useVirtualList(mylines, { itemHeight: 24 });



const mysearchlines = computed(() =>{return searchResult.value})
const { list:searchList, containerProps:searchContainerProps, wrapperProps:searchWrapperProps } = useVirtualList(
  mysearchlines,
    {
      itemHeight: 24,
    },
  )

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
  width: 50px;
  display: inline-block;
  color: gray;
  text-align: right;
  margin-right: 10px;
}
</style>