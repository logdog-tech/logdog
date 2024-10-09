<template>
  <div>
    <!-- 持久化规则 -->
    <div v-for="rule in displayRules" :key="rule.id" 
         class="rule-item" 
         :class="{ 'new-rule': rule.id === 'new' }"
         :style="rule.id !== 'new' ? { color: rule.foreColor, backgroundColor: rule.backColor } : {}">
      <div v-if="isEditing(rule)" class="rule-edit">
        <input v-model="editingRule.name" placeholder="规则名称" class="edit-input"
               :style="{ backgroundColor: editingRule.backColor, color: editingRule.foreColor }">
        <input ref="regexInput" v-model="editingRule.regex" placeholder="正则表达式" class="edit-input color-preview"
               :style="{ backgroundColor: editingRule.backColor, color: editingRule.foreColor }">
        <div class="color-presets">
          <div v-for="(preset, index) in colorPresets" :key="index" 
               class="color-preset" 
               @click.stop="applyPreset(preset)"
               :style="{ backgroundColor: preset.backColor, color: preset.foreColor }">
            Aa
          </div>
          <div class="color-preset refresh-preset" @click.stop="refreshPresets">
            &#x21bb;
          </div>
        </div>
        <div class="action-buttons">
          <button @click="saveRule" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
      <div v-else class="rule-info" @click="startEdit(rule)">
        <p class="rule-name">{{ rule.name || '未命名规则' }}</p>
        <p class="rule-regex" v-if="rule.id !== 'new'">{{ rule.regex }}</p>
        <p class="rule-regex new-rule-hint" v-else>点击添加新规则</p>
      </div>
      <span v-if="rule.id !== 'new' && !isEditing(rule)" 
            @click.stop="handleActionClick(rule)" 
            class="action-btn"
            :title="isEditing(rule) ? '保存' : '删除'">
        {{ isEditing(rule) ? '' : '×' }} <!-- 仅在非编辑状态下显示删除按钮 -->
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  sessionRules: {
    type: Array,
    default: () => []
  }
})

const STORAGE_KEY = 'highlightRules'

function loadInitialRules() {
    console.log('加载初始规则')
    const storedRules = localStorage.getItem(STORAGE_KEY)
    const rules = storedRules ? JSON.parse(storedRules) : [
        { id: 1, name: '错误', regex: '^.*? E .*$', foreColor: '#FF0000', backColor: '#FFEBEE' }, // 红色文字，浅红色背景
        { id: 2, name: '警告', regex: '^.*? W .*$', foreColor: '#FFA000', backColor: '#FFF3E0' }, // 橙色文字，浅橙色背景
        { id: 3, name: '信息', regex: '^.*? I .*$', foreColor: '#2196F3', backColor: '#E3F2FD' }, // 蓝色文字，浅蓝色背景
        { id: 4, name: '调试', regex: '^.*? D .*$', foreColor: '#4CAF50', backColor: '#E8F5E9' }, // 绿色文字，浅绿色背景
        { id: 5, name: '详细', regex: '^.*? V .*$', foreColor: '#757575', backColor: '#FAFAFA' }  // 灰色文字，浅灰色背景
    ]
    console.log('初始规则:', rules)
    return rules
}

const rules = ref(loadInitialRules())
const editingRule = ref(null)

const displayRules = computed(() => {
  console.log('计算显示规则')
  return [...rules.value, { id: 'new', name: '新建规则', regex: '点击编辑', foreColor: '#000000', backColor: '#ffffff' }]
})

const isEditing = (rule) => {
  return editingRule.value && (editingRule.value.id === rule.id || (rule.id === 'new' && editingRule.value.id === null))
}

const regexInput = ref(null) // 创建一个 ref 来引用正则输入框

const startEdit = (rule) => {
  console.log('开始编辑规则:', rule)
  if (rule.id === 'new') {
    editingRule.value = { id: null, name: '', regex: '', foreColor: '#000000', backColor: '#ffffff' }
    refreshColors()
  } else {
    editingRule.value = { ...rule }
  }
  console.log('当前编辑的规则:', editingRule.value)

  // 在进入编辑状态后，聚焦到正则输入框
  nextTick(() => {
    regexInput.value.focus()
  })
}

const handleActionClick = (rule) => {
  console.log('处理动作点击:', rule)
  if (isEditing(rule)) {
    saveRule()
  } else {
    deleteRule(rule)
  }
}

const saveRule = () => {
  console.log('保存规则')
  if (!editingRule.value || !editingRule.value.regex.trim()) {
    console.log('无效的规则，取消保存')
    return
  }

  if (editingRule.value.id === null) {
    // 新规则
    const newRule = {
      id: Date.now(),
      name: editingRule.value.name || '未命名规则',
      regex: editingRule.value.regex,
      foreColor: editingRule.value.foreColor,
      backColor: editingRule.value.backColor
    }
    console.log('添加规则:', newRule)
    rules.value.push(newRule)
  } else {
    // 更新现有规则
    const index = rules.value.findIndex(r => r.id === editingRule.value.id)
    if (index !== -1) {
      console.log('更新现有规则:', editingRule.value)
      rules.value[index] = { ...editingRule.value }
    }
  }
  emits('rulesUpdated', rules.value)
  editingRule.value = null
  console.log('规则保存后的状态:', rules.value)
}

const deleteRule = (rule) => {
  console.log('删除规则:', rule)
  const index = rules.value.findIndex(r => r.id === rule.id)
  if (index !== -1) {
    rules.value.splice(index, 1)
    emits('rulesUpdated', rules.value)
  }
  console.log('删除后的规则列表:', rules.value)
}

const refreshColors = () => {
  console.log('刷新颜色')
  const { foreColor, backColor } = generateContrastingColors()
  editingRule.value.foreColor = foreColor
  editingRule.value.backColor = backColor
  console.log('新的颜色:', { foreColor, backColor })
}

const applyPreset = (preset) => {
  console.log('应用预设颜色:', preset)
  editingRule.value.foreColor = preset.foreColor
  editingRule.value.backColor = preset.backColor
}

const emits = defineEmits(['rulesUpdated', 'sessionRulesUpdated'])

watch(rules, (newRules) => {
    console.log('规则发生变化，更新本地存储')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules))
}, { deep: true })

onMounted(() => {
    console.log('组件挂载，发送初始规则')
    emits('rulesUpdated', rules.value)
})

// 修改预设配色方案为响应式
const colorPresets = ref([
    { foreColor: '#FFFFFF', backColor: '#FF0000' }, // 白字红底
    { foreColor: '#000000', backColor: '#FFFF00' }, // 黑字黄底
    { foreColor: '#FFFFFF', backColor: '#0000FF' }, // 白字蓝底
    { foreColor: '#000000', backColor: '#00FF00' }, // 黑字绿底
    { foreColor: '#FFFFFF', backColor: '#800080' }, // 白字紫底
    { foreColor: '#000000', backColor: '#FFA500' }, // 黑字橙底
])

// 刷新预设配色
const refreshPresets = () => {
    console.log('刷新预设配色')
    colorPresets.value = colorPresets.value.map(() => generateContrastingColors())
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function generateContrastingColors() {
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 120 + Math.floor(Math.random() * 120)) % 360; // 120-240度的色相差
    const saturation1 = 70 + Math.random() * 30; // 70-100
    const saturation2 = 70 + Math.random() * 30; // 70-100，独立于saturation1
    const lightness1 = Math.random() * 60 + 20; // 20-80 for background
    let lightness2;
    
    if (lightness1 > 50) {
        // 如果背景较亮，前景应该较暗
        lightness2 = Math.random() * 30 + 10; // 10-40
    } else {
        // 如果背景较暗，前景应该较亮
        lightness2 = Math.random() * 30 + 60; // 60-90
    }

    const backColor = hslToHex(hue1, saturation1, lightness1);
    const foreColor = hslToHex(hue2, saturation2, lightness2);

    return { foreColor, backColor };
}

const cancelEdit = () => {
  console.log('取消编辑')
  editingRule.value = null
}

const addNewSessionRule = () => {
  const newRule = {
    id: Date.now(),
    name: '新会话规则',
    regex: '',
    foreColor: '#000000',
    backColor: '#ffffff'
  }
  const updatedSessionRules = [...props.sessionRules, newRule]
  emits('sessionRulesUpdated', updatedSessionRules)
  startEdit(newRule)
}

const deleteSessionRule = (rule) => {
  const updatedSessionRules = props.sessionRules.filter(r => r.id !== rule.id)
  emits('sessionRulesUpdated', updatedSessionRules)
}
</script>

<style scoped>
.rule-item {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

.rule-info {
  flex-grow: 1;
  overflow: hidden;
}

.rule-name {
  margin: 0;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-regex {
  margin: 0;
  font-size: 0.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-preview {
  transition: all 0.3s ease;
}

.color-preview::placeholder {
  color: currentColor;
  opacity: 0.7;
}

.input-group-text, .btn-outline-secondary {
  cursor: pointer;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-preset {
  width: 24px; /* 调整宽度 */
  height: 24px; /* 调整高度 */
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.1s ease;
}

.color-preset:hover {
  transform: scale(1.1);
}

.refresh-preset {
  width: 24px; /* 确保刷新按钮与色块大小一致 */
  height: 24px; /* 确保刷新按钮与色块大小一致 */
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 18px; /* 调整大小以适应新的 Unicode 符号 */
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-preset:hover {
  background-color: #e9ecef;
}

.rule-edit {
  width: 100%;
}

.edit-input {
  width: 100%;
  margin-bottom: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.color-preview {
  transition: all 0.3s ease;
}

.action-btn {
  padding-left: 10px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.3s ease;
}

.action-btn:hover {
  color: #28a745; /* 绿色，表示保存 */
}

/* 当按钮表示删除时的样式 */
.rule-item:not(.editing) .action-btn {
  color: #dc3545;
}

.rule-item:not(.editing) .action-btn:hover {
  color: #b02a37;
}

/* 当按钮表示保存时的样式 */
.rule-item.editing .action-btn {
  color: #28a745;
}

.rule-item.editing .action-btn:hover {
  color: #218838;
}

.new-rule {
  border: 2px dashed #ccc;
  background-color: #f8f9fa !important;
  color: #6c757d !important;
}

.new-rule-hint {
  font-style: italic;
}

.action-buttons {
  margin-top: 10px;
}

.save-btn, .cancel-btn {
  margin-right: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background-color: #28a745; /* 绿色 */
  color: white;
}

.cancel-btn {
  background-color: #dc3545; /* 红色 */
  color: white;
}

.save-btn:hover {
  background-color: #218838; /* 深绿色 */
}

.cancel-btn:hover {
  background-color: #c82333; /* 深红色 */
}
</style>