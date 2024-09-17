<template>
  <div>
    <div v-for="prefilter in displayPrefilters" :key="prefilter.id" 
         class="prefilter-item" 
         :class="{ 'prefilter-active': prefilter.active }">
      <div v-if="editingId === prefilter.id || (isAdding && prefilter.id === null)" class="prefilter-edit">
        <input v-model="editedPrefilter.name" placeholder="过滤器名称" class="edit-input"
               :style="{ backgroundColor: editedPrefilter.active ? '#d4edda' : '#f8f9fa' }">
        <input v-model="editedPrefilter.regex" placeholder="正则表达式" class="edit-input"
               :style="{ backgroundColor: editedPrefilter.active ? '#d4edda' : '#f8f9fa' }">
        <div class="action-buttons">
          <button @click="savePrefilter" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
      <div v-else class="prefilter-info">
        <div class="prefilter-content" @click="togglePrefilter(prefilter)">
          <p class="prefilter-name">{{ prefilter.name || '未命名过滤器' }}</p>
          <p class="prefilter-regex">{{ prefilter.regex }}</p>
        </div>
        <div class="prefilter-actions">
          <div class="action-icons">
            <span @click.stop="startEdit(prefilter)" class="edit-btn" title="编辑">✎</span>
            <span @click.stop="deletePrefilter(prefilter)" class="delete-btn" title="删除">&times;</span>
          </div>
          <div class="toggle-wrapper">
            <input type="checkbox" :checked="prefilter.active" @click.stop="togglePrefilter(prefilter)">
            <span class="toggle-slider"></span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!isAdding" class="new-prefilter" @click="startAdding">
      <span class="add-icon">+</span>
      <span>添加新预过滤器</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const STORAGE_KEY = 'logdog_prefilters'

const prefilters = ref([])
const editedPrefilter = ref({ id: null, name: '', regex: '', active: false })
const editingId = ref(null)
const isAdding = ref(false)

const displayPrefilters = computed(() => {
  return isAdding.value ? [...prefilters.value, editedPrefilter.value] : prefilters.value
})

const isValidPrefilter = computed(() => {
  return editedPrefilter.value.name && editedPrefilter.value.regex
})

// 从 localStorage 加载预过滤器
const loadPrefilters = () => {
  const savedPrefilters = localStorage.getItem(STORAGE_KEY)
  if (savedPrefilters) {
    prefilters.value = JSON.parse(savedPrefilters).map(prefilter => ({
      ...prefilter,
      active: false
    }))
  }
}

// 保存预过滤器到 localStorage，但不保存 active 状态
const savePrefilters = () => {
  const prefiltersToSave = prefilters.value.map(({ id, name, regex }) => ({ id, name, regex }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefiltersToSave))
}

const startEdit = (prefilter) => {
  editedPrefilter.value = { ...prefilter }
  editingId.value = prefilter.id
}

const deletePrefilter = (prefilter) => {
  const index = prefilters.value.findIndex(p => p.id === prefilter.id)
  if (index !== -1) {
    prefilters.value.splice(index, 1)
    emitPrefilterUpdate()
    savePrefilters()
  }
}

const savePrefilter = () => {
  if (editingId.value !== null) {
    const index = prefilters.value.findIndex(p => p.id === editingId.value)
    if (index !== -1) {
      prefilters.value[index] = { ...editedPrefilter.value }
    }
  } else if (isAdding.value) {
    editedPrefilter.value.id = Date.now()
    prefilters.value.push({ ...editedPrefilter.value })
  }
  emitPrefilterUpdate()
  savePrefilters()
  resetForm()
}

const cancelEdit = () => {
  resetForm()
}

const resetForm = () => {
  editedPrefilter.value = { id: null, name: '', regex: '', active: false }
  editingId.value = null
  isAdding.value = false
}

const togglePrefilter = (prefilter) => {
  prefilter.active = !prefilter.active
  emitPrefilterUpdate()
}

const emitPrefilterUpdate = () => {
  emits('prefilterUpdated', prefilters.value)
  const activePrefilters = prefilters.value.filter(p => p.active)
  const combinedRegex = activePrefilters.map(p => p.regex).join('|')
  const toggledPrefilter = prefilters.value.find(p => p.active !== p.prevActive)
  if (toggledPrefilter) {
    emits('prefilterApplied', { 
      regex: combinedRegex, 
      action: 'toggle', 
      prefilter: {
        active: toggledPrefilter.active,
        regex: toggledPrefilter.regex
      }
    })
  }
}

const emits = defineEmits(['prefilterUpdated', 'prefilterApplied'])

watch(prefilters, () => {
  prefilters.value.forEach(p => p.prevActive = p.active)
  emitPrefilterUpdate()
}, { deep: true, immediate: true })

onMounted(() => {
  loadPrefilters()
})

const startAdding = () => {
  editedPrefilter.value = { id: null, name: '', regex: '', active: false }
  editingId.value = null
  isAdding.value = true
}
</script>

<style scoped>
.prefilter-item {
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  overflow: hidden;
}

.prefilter-active {
  background-color: #d4edda;
  border-left: 4px solid #28a745;
}

.prefilter-info {
  display: flex;
  align-items: center;
  padding: 10px 15px;
}

.prefilter-content {
  flex-grow: 1;
  cursor: pointer;
}

.prefilter-name {
  margin: 0;
  font-weight: bold;
  font-size: 16px;
}

.prefilter-regex {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}

.prefilter-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.action-icons {
  display: flex;
  margin-bottom: 5px;
}

.edit-btn, .delete-btn {
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 5px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.edit-btn {
  color: #007bff;
}

.delete-btn {
  color: #dc3545;
}

.edit-btn:hover, .delete-btn:hover {
  opacity: 1;
}

.toggle-wrapper {
  position: relative;
  width: 50px;
  height: 24px;
}

.toggle-wrapper input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2196F3;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.prefilter-edit {
  padding: 15px;
}

.edit-input {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.save-btn, .cancel-btn {
  padding: 5px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.save-btn {
  background-color: #28a745;
  color: white;
  margin-right: 10px;
}

.save-btn:hover {
  background-color: #218838;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background-color: #c82333;
}

.new-prefilter {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #e9ecef;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.new-prefilter:hover {
  background-color: #dee2e6;
}

.add-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #28a745;
}
</style>