<template>
      <div class="log-panel" v-bind="containerProps">
        <div v-bind="wrapperProps">
          <div v-for="item in list" :key="item.index" class="log-item"  v-html="highlight(item.data)">
          </div>
        </div>
      </div>
      
      <div class="input-group mb-3">
        <input type="text" v-model="searchTerm" @keyup.enter="searchLogs" class="form-control" placeholder="输入搜索关键词">
        <button @click="searchLogs" class="btn btn-primary">搜索</button>
      </div>
      <div  class="log-panel" v-bind="searchContainerProps">
        <div v-bind="searchWrapperProps">
          <div v-for="item in searchList" :key="item.index" class="log-item" v-html="highlight(item.data)">
          </div>
        </div>
      </div>
  </template>
  
  <script setup>
    import { ref, computed } from 'vue'
    import { useVirtualList } from '@vueuse/core'
  
    const props = defineProps({
      fileContent: {
        type: String,
        required: true
      },
      rules: {
        type: Array,
        required: true
      },
      highlight: {
        type: Function,
        required: true
      }
    })
  
    const searchTerm = ref('')
    const searchResult = ref('')
  
    const searchLogs = () => {
        console.log("searchLogs")
      const regex = new RegExp(searchTerm.value, 'gi')

      console.log("searchLogs regex" , regex)
      const matches = props.fileContent.split('\n').filter(line => line.match(regex))

      console.log("searchLogs matches" , matches.length)
      searchResult.value = matches.join('\n')
    }
  
    const mylines = computed(() => {
      const items = props.fileContent.split('\n')
      return items
    })
    const { list, containerProps, wrapperProps } = useVirtualList(mylines, { itemHeight: 24 })
  

    const mysearchlines = computed(() => {
      const items = searchResult.value .split('\n')
      return items
    })
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
        margin-bottom: 20px;
        white-space: pre-wrap;
    }
  
    .log-item {
      font-size: small;
      word-break: break-all; 
      white-space: nowrap;
      /* white-space: pre-wrap; */
      border-bottom: 1px dashed #ccc;
    }
    .log-item:hover {
        background-color: cornsilk;
    }
  </style>