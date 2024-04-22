<!-- App.vue -->
<template>
  <div id="root" style="display: flex; flex-direction: row; ">
    <div class="sidebar">
      <DataProvider @fileLoaded="handleFileLoaded" />
      <div class="sidebar-rules">
        <RulesManager @rulesUpdated="handleRulesUpdated" />
      </div>
    </div>
    <div class="main">
      <LogShower :fileContent="fileContent" :rules="rules" :highlight="highlight" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RulesManager from './RulesManager.vue'
import DataProvider from './DataProvider.vue'
import LogShower from './LogShower.vue'

const fileContent = ref([])
const rules = ref([])

const handleFileLoaded = (content) => {
  fileContent.value = content.split('\n').map((content, index) => {
    return { line: index + 1, content: content };
  });
}

const handleRulesUpdated = (updatedRules) => {
  rules.value = updatedRules
}

const highlight = (text) => {
  let formatted = text
  rules.value.forEach(rule => {
    formatted = formatted.replace(
      new RegExp(rule.regex, 'gi'),
      match => `<span style="color: ${rule.foreColor}; background-color: ${rule.backColor};">${match}</span>`
    )
  })
  return formatted
}
</script>
<style scoped>
#root {
  display: flex;
  height: 100vh;
  font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
}


.sidebar {
  width: 300px;
  height: 100vh;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
}
.sidebar-rules {
  flex-grow: 1;
  overflow-y: scroll;
  padding: 14px;
}

.main {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  overflow-y: auto;
}
</style>