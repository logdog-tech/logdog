<template>
  <div>
    <h5>预过滤器</h5>
    <div v-for="prefilter in prefilters" :key="prefilter.id" 
         class="prefilter-item" 
         :class="{ 'prefilter-active': prefilter.active }"
         @click="togglePrefilter(prefilter)">
      <span>{{ prefilter.name }}</span>
      <span @click.stop="deletePrefilter(prefilter)" class="delete-btn">&times;</span>
    </div>
    <h5>{{ isEditing ? '编辑' : '新增' }}</h5>
    <div class="mb-3">
      <label class="form-label">过滤器名称</label>
      <input v-model="editedPrefilter.name" placeholder="过滤器名称" class="form-control">
    </div>
    <div class="mb-3">
      <label class="form-label">过滤条件（正则表达式）</label>
      <input v-model="editedPrefilter.regex" placeholder="正则表达式" class="form-control">
    </div>
    <button @click="savePrefilter" :disabled="!isValidPrefilter" class="btn btn-primary me-2">
      {{ isEditing ? '保存' : '添加' }}
    </button>
    <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">取消</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const STORAGE_KEY = 'logdog_prefilters'

const prefilters = ref([])
const editedPrefilter = ref({ id: null, name: '', regex: '', active: false })
const isEditing = ref(false)

const isValidPrefilter = computed(() => {
  return editedPrefilter.value.name && editedPrefilter.value.regex
})

// 从 localStorage 加载预过滤器
const loadPrefilters = () => {
  const savedPrefilters = localStorage.getItem(STORAGE_KEY)
  if (savedPrefilters) {
    // 加载预过滤器，但重置所有 active 状态为 false
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

const editPrefilter = (prefilter) => {
  editedPrefilter.value = { ...prefilter }
  isEditing.value = true
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
  if (isEditing.value) {
    const index = prefilters.value.findIndex(p => p.id === editedPrefilter.value.id)
    if (index !== -1) {
      prefilters.value[index] = { ...editedPrefilter.value }
    }
  } else {
    editedPrefilter.value.id = Date.now()
    editedPrefilter.value.active = false
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
  isEditing.value = false
}

const togglePrefilter = (prefilter) => {
  prefilter.active = !prefilter.active
  emitPrefilterUpdate()
  // 移除这里的 savePrefilters() 调用，因为我们不想保存 active 状态
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

// 监听 prefilters 的变化，以便在初始化时触发更新
watch(prefilters, () => {
  prefilters.value.forEach(p => p.prevActive = p.active)
  emitPrefilterUpdate()
}, { deep: true, immediate: true })

// 组件挂载时加载保存的预过滤器
onMounted(() => {
  loadPrefilters()
})
</script>

<style scoped>
.prefilter-item {
  margin-bottom: 10px;
  padding: 8px 12px 8px 36px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  background-color: #f0f0f0;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  position: relative;
}

.prefilter-item:hover {
  background-color: #e0e0e0;
  transform: translateX(2px);
}

.prefilter-active {
  background-color: #d4edda;
  border-color: #28a745;
  border-left: 4px solid #28a745;
  font-weight: bold;
}

.prefilter-active:hover {
  background-color: #c3e6cb;
}

.prefilter-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid #adb5bd;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.prefilter-active::before {
  background-color: #28a745;
  border-color: #28a745;
}

.prefilter-active::after {
  content: '';
  position: absolute;
  left: 15px; /* 调整这个值来居中勾选标记 */
  top: 50%;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: translateX(30%) translateY(-56%) rotate(45deg);
}

.delete-btn {
  color: #dc3545;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.delete-btn:hover {
  color: #b02a37;
  opacity: 1;
}

.prefilter-item span:first-child {
  flex-grow: 1;
  padding-right: 10px;
}
</style>