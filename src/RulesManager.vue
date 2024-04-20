<template>
    <div>
      <h5>高亮规则</h5>
      <div v-for="rule in rules" :key="rule.id" class="rule-item" 
           @dblclick="editRule(rule)"
           :style="{ color: rule.foreColor, backgroundColor: rule.backColor }">
        <p class="rule-name">{{ rule.name }}</p>
        <span @click.stop="deleteRule(rule)" class="delete-btn">&times;</span>
      </div>
      <h5>{{ isEditing ? '编辑' : '新增' }}</h5>
      <div class="mb-3">
        <label class="form-label">规则名称</label>
        <input v-model="editedRule.name" placeholder="规则名称" class="form-control">
      </div>
      <div class="mb-3">
        <label class="form-label">过滤条件（正则表达式）</label>  
        <input v-model="editedRule.regex" placeholder="正则表达式" class="form-control">
      </div>
      <div class="mb-3">
        <label class="form-label">前景色</label>
        <input v-model="editedRule.foreColor" type="color" class="form-control form-control-color">
      </div>
      <div class="mb-3">
        <label class="form-label">背景色</label>
        <input v-model="editedRule.backColor" type="color" class="form-control form-control-color">
      </div>
      <button @click="saveRule" :disabled="!isValidRule" class="btn btn-primary me-2">
        {{ isEditing ? '保存' : '添加' }}
      </button>
      <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">取消</button>
    </div>
  </template>
  
  <script setup>
import { ref, computed, watch, onMounted } from 'vue'

// 定义用于存储和读取的 localStorage 键名
const STORAGE_KEY = 'highlightRules'

// 初始数据现在从 localStorage 中加载
function loadInitialRules() {
    const storedRules = localStorage.getItem(STORAGE_KEY)
    return storedRules ? JSON.parse(storedRules) : [
        { id: 1, name: '错误', regex: '^.*? E .*$', foreColor: '#ff0000', backColor: '#ffe0e0' },
        { id: 2, name: '警告', regex: '^.*? W .*$', foreColor: '#ffa500', backColor: '#ffffd0' },
        { id: 3, name: '信息', regex: '^.*? I .*$', foreColor: '#008000', backColor: '#e0ffe0' },
        { id: 4, name: '调试', regex: '^.*? D .*$', foreColor: '#0000ff', backColor: '#e0e0ff' }
    ]
}

const rules = ref(loadInitialRules())
const editedRule = ref({ id: null, name: '', regex: '', foreColor: '#000000', backColor: '#ffffff' })
const isEditing = ref(false)

const isValidRule = computed(() => {
    return editedRule.value.name && editedRule.value.regex
})
  
    const editRule = (rule) => {
      editedRule.value = { ...rule }
      isEditing.value = true
    }
  
    const deleteRule = (rule) => {
      const index = rules.value.findIndex(r => r.id === rule.id)
      if (index !== -1) {
        rules.value.splice(index, 1)
        emits('rulesUpdated', rules.value)
      }
    }
  
    const saveRule = () => {
      if (isEditing.value) {
        const index = rules.value.findIndex(r => r.id === editedRule.value.id)
        if (index !== -1) {
          rules.value[index] = { ...editedRule.value }
        }
      } else {
        editedRule.value.id = Date.now()
        rules.value.push({ ...editedRule.value })
      }
      emits('rulesUpdated', rules.value)
      resetForm()
    }
  
    const cancelEdit = () => {
      resetForm()  
    }
  
    const resetForm = () => {
      editedRule.value = { id: null, name: '', regex: '', foreColor: '#000000', backColor: '#ffffff' }
      isEditing.value = false
    }

    watch(rules, (newRules) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules))
}, { deep: true })

    const emits = defineEmits(['rulesUpdated'])
    onMounted(() => {
        emits('rulesUpdated', rules.value)
    })
  </script>
  
  <style scoped>
    .rule-item {
      margin-bottom: 10px;
      padding:4px 8px;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
  
    .rule-name {
      margin: 0;
    }
  
    .delete-btn {
      float: right;
      color: #dc3545;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
    }
  
    .delete-btn:hover {
      color: #b02a37;
      float: right;
      color: #dc3545;
      font-size: 14px;
      cursor: pointer;
      vertical-align: bottom;
    }
  </style>