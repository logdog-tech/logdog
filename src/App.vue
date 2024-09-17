<template>
  <div id="root" style="display: flex; flex-direction: row;">
    <div class="sidebar">
      <DataProvider @fileLoaded="handleFileLoaded" />
      <div class="sidebar-tabs">
        <div class="tab-buttons">
          <button @click="activeTab = 'rules'" :class="{ active: activeTab === 'rules' }">高亮规则</button>
          <button @click="activeTab = 'prefilters'" :class="{ active: activeTab === 'prefilters' }">预过滤器</button>
        </div>
        <div class="tab-content">
          <RulesManager v-if="activeTab === 'rules'" @rulesUpdated="handleRulesUpdated" />
          <PrefilterManager 
            v-if="activeTab === 'prefilters'"
            @prefilterUpdated="handlePrefilterUpdated" 
            @prefilterApplied="applyPrefilterToLogShower" 
          />
        </div>
      </div>
    </div>
    <div class="main">
      <LogShower ref="logShowerRef" :fileContent="fileContent" :rules="rules" :prefilters="prefilters" :highlight="highlight" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import RulesManager from './RulesManager.vue'
import PrefilterManager from './PrefilterManager.vue'
import DataProvider from './DataProvider.vue'
import LogShower from './LogShower.vue'

const fileContent = ref([])
const rules = ref([])
const prefilters = ref([])

const handleFileLoaded = (content) => {
  fileContent.value = content.split('\n').map((content, index) => {
    return { line: index + 1, content: content }
  })
}

const handleRulesUpdated = (updatedRules) => {
  rules.value = updatedRules
}

const handlePrefilterUpdated = (updatedPrefilters) => {
  prefilters.value = updatedPrefilters
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

const logShowerRef = ref(null)

const applyPrefilterToLogShower = (prefilterData) => {
  nextTick(() => {
    if (logShowerRef.value && logShowerRef.value.applyPrefilter) {
      logShowerRef.value.applyPrefilter(prefilterData)
    } else {
      console.error('LogShower component or applyPrefilter method not available')
    }
  })
}

const activeTab = ref('rules')
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

.sidebar-tabs {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #dee2e6;
}

.tab-buttons button {
  padding: 10px 20px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  flex: 1;
}

.tab-buttons button.active {
  background-color: #e9ecef;
  border-bottom: 2px solid #007bff;
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
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