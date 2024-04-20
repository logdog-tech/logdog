<template>
  <div>
    <p>Showing {{ isEven ? 'even' : 'odd' }} items</p>
    <button @click="toggle">
      Toggle Even/Odd
    </button>
    <input type="file" @change="handleFileChange">
    <div v-bind="containerProps" style="height: 300px; width: 500%">
      <div v-bind="wrapperProps">
        <div v-for="item in list" :key="item.index" style="height: 24px; line-height: 24px; font-size: small; display: flex">
          <div v-html="highlight(item.data)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList, useToggle } from '@vueuse/core'
import { computed, ref } from 'vue'

const fileContent = ref<string>('')

const highlight = (text) => {
  let rules = [
      { id: 1, name: '错误', regex: /^.*? E /gi, foreColor: '#ffffff', backColor: 'red' },
      { id: 2, name: '警告', regex: /^.*? W /gi, foreColor: '#ffffff', backColor: 'yellow' },
      { id: 3, name: '信息', regex: /^.*? I /gi, foreColor: '#ffffff', backColor: 'blue' },
      { id: 4, name: '信息', regex: /^.*? D /gi, foreColor: '#ffffff', backColor: 'gray' },
  ];
  let formatted = text;
  rules.forEach(rule => {
      formatted = formatted.replace(
          new RegExp(rule.regex, 'gi'), 
          match => `<span style="color: ${rule.foreColor}; background-color: ${rule.backColor};">${match}</span>`
      );
  });
  return formatted;
}

// 处理文件改变事件
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    const reader = new FileReader()

    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target) {
        fileContent.value = event.target.result as string
      }
    }

    reader.readAsText(file)
  }
}

const [isEven, toggle] = useToggle()

// 使用文件内容作为数据源
const filteredList = computed(() => {
  const items = fileContent.value.split('\n')
  return items.filter((_, index) => isEven.value ? index % 2 === 0 : index % 2 === 1)
})

const { list, containerProps, wrapperProps } = useVirtualList(
  filteredList,
  {
    itemHeight: 22,
  },
)
</script>
