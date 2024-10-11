<template>
  <div id="root" style="display: flex; flex-direction: row;">
    <div class="sidebar">
      <DataProvider @fileLoaded="handleFileLoaded" />
      <div class="sidebar-tabs">
        <div class="tab-buttons">
          <button @click="activeTab = 'rules'" :class="{ active: activeTab === 'rules' }">高亮规则</button>
          <button @click="activeTab = 'prefilters'" :class="{ active: activeTab === 'prefilters' }">预过滤器</button>
          <button @click="activeTab = 'preprocessors'" :class="{ active: activeTab === 'preprocessors' }">预处理器</button>
        </div>
        <div class="tab-content">
          <RulesManager 
            v-if="activeTab === 'rules'" 
            @rulesUpdated="handleRulesUpdated"
            :sessionRules="sessionRules"
            @sessionRulesUpdated="handleSessionRulesUpdated"
          />
          <PrefilterManager 
            v-if="activeTab === 'prefilters'"
            @prefilterUpdated="handlePrefilterUpdated" 
            @prefilterApplied="applyPrefilterToLogShower" 
          />
          <PreprocessorManager 
            v-if="activeTab === 'preprocessors'"
            @preprocessorUpdated="handlePreprocessorUpdated"
            @preprocessorApplied="applyPreprocessorToLogShower"
          />
        </div>
      </div>
    </div>
    <div class="main">
      <LogShower 
        ref="logShowerRef" 
        :fileContent="fileContent" 
        :rules="rules" 
        :sessionRules="sessionRules"
        :prefilters="prefilters" 
        :preprocessors="preprocessors"
        :highlight="highlight" 
        :fileName="fileName"
        @updateSessionRules="handleUpdateSessionRules"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, nextTick } from 'vue'
import RulesManager from './RulesManager.vue'
import PrefilterManager from './PrefilterManager.vue'
import PreprocessorManager from './PreprocessorManager.vue'
import DataProvider from './DataProvider.vue'
import LogShower from './LogShower.vue'

const fileContent = shallowRef([])
const rules = ref([])
const sessionRules = ref([])
const prefilters = ref([])
const preprocessors = ref([])
const fileName = ref('') // 添加这一行来存储文件名

const handleFileLoaded = (content, name) => { // 修改这里，添加 name 参数
  console.timeLog('🕘加载文件', 's2.1, handleFileLoaded函数接收到任务，数据总长度' + content.length);

  const lines = content.split('\n');
  console.timeLog('🕘加载文件', 's2.2, 完成split风格，总行数' + lines.length);

  fileContent.value = lines.map((content, index) => {
    return { line: index + 1, content: content };
  });
  fileName.value = name; // 设置文件名
  console.timeLog('🕘加载文件', 's2.3, 完成映射为line+content的json结构');
  console.timeEnd('🕘加载文件');
}

const handleRulesUpdated = (updatedRules) => {
  rules.value = updatedRules
}

const handleSessionRulesUpdated = (updatedSessionRules) => {
  sessionRules.value = updatedSessionRules
}

const handlePrefilterUpdated = (updatedPrefilters) => {
  prefilters.value = updatedPrefilters
}

const handlePreprocessorUpdated = (updatedPreprocessors) => {
  preprocessors.value = updatedPreprocessors
}

const highlight = (text) => {
  let formatted = text.replace(/<br>/g, ' ') // TODO 改为默认就不允许显示内容中的标签
  // 先应用持久化规则
  rules.value.forEach(rule => {
    formatted = formatted.replace(
      new RegExp(rule.regex, 'gi'),
      match => `<span style="display: inline-block; color: ${rule.foreColor}; background-color: ${rule.backColor};">${match}</span>`
    )
  })
  // 然后应用会话规则
  sessionRules.value.forEach(rule => {
    formatted = formatted.replace(
      new RegExp(rule.regex, 'gi'),
      match => `<span style="display: inline-block; color: ${rule.foreColor}; background-color: ${rule.backColor};">${match}</span>`
    )
  })
  return formatted
}

const logShowerRef = ref(null)

const applyPrefilterToLogShower = (prefilterData) => {
  nextTick(() => {
    if (logShowerRef.value && logShowerRef.value.applyPrefilter) {
      logShowerRef.value.applyPrefilter(prefilterData)
      updatePrefilterState(prefilterData.prefilter)
    } else {
      console.error('LogShower component or applyPrefilter method not available')
    }
  })
}

const applyPreprocessorToLogShower = (preprocessorData) => {
  nextTick(() => {
    if (logShowerRef.value && logShowerRef.value.applyPreprocessor) {
      logShowerRef.value.applyPreprocessor(preprocessorData)
      updatePreprocessorState(preprocessorData.preprocessor)
    } else {
      console.error('LogShower component or applyPreprocessor method not available')
    }
  })
}

const activeTab = ref('rules')

const updatePrefilterState = (updatedPrefilter) => {
  const index = prefilters.value.findIndex(p => p.id === updatedPrefilter.id);
  if (index !== -1) {
    prefilters.value[index] = { ...updatedPrefilter };
  }
}

const updatePreprocessorState = (updatedPreprocessor) => {
  const index = preprocessors.value.findIndex(p => p.id === updatedPreprocessor.id);
  if (index !== -1) {
    preprocessors.value[index] = { ...updatedPreprocessor };
  }
}

const handleUpdateSessionRules = (newRule) => {
  if (newRule.isClear) {
    sessionRules.value = sessionRules.value.filter(rule => rule.regex !== newRule.regex)
  } else {
    sessionRules.value = [...sessionRules.value, newRule]
  }
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
  padding-bottom: 0px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  overflow-y: auto;
}
</style>