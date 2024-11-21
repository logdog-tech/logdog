<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <span
        :class="{
          'bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-gray-100': part.highlight
        }"
      >{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  highlight: string
}>()

const parts = computed(() => {
  if (!props.highlight) {
    return [{ text: props.text, highlight: false }]
  }

  try {
    const regex = new RegExp(props.highlight, 'gi')
    const matches = Array.from(props.text.matchAll(regex))
    const result = []
    let lastIndex = 0

    for (const match of matches) {
      if (match.index! > lastIndex) {
        result.push({
          text: props.text.slice(lastIndex, match.index),
          highlight: false
        })
      }
      result.push({
        text: match[0],
        highlight: true
      })
      lastIndex = match.index! + match[0].length
    }

    if (lastIndex < props.text.length) {
      result.push({
        text: props.text.slice(lastIndex),
        highlight: false
      })
    }

    return result
  } catch (e) {
    // 如果正则表达式无效，返回原始文本
    return [{ text: props.text, highlight: false }]
  }
})
</script> 