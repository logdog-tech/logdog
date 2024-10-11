<template>
    <div>
      <div v-for="preprocessor in displayPreprocessors" :key="preprocessor.id" 
           class="preprocessor-item" 
           :class="{ 'preprocessor-active': preprocessor.active }">
        <div v-if="editingId === preprocessor.id || (isAdding && preprocessor.id === null)" class="preprocessor-edit">
          <input v-model="editedPreprocessor.name" placeholder="预处理器名称" class="edit-input"
                 :style="{ backgroundColor: editedPreprocessor.active ? '#d4edda' : '#f8f9fa' }">
          <input v-model="editedPreprocessor.description" placeholder="预处理器描述" class="edit-input"
                 :style="{ backgroundColor: editedPreprocessor.active ? '#d4edda' : '#f8f9fa' }">
          <textarea v-model="editedPreprocessor.function" placeholder="输入JavaScript函数 (参数: fileName, lineNumber, content)" 
                    class="edit-input function-input"
                    :style="{ backgroundColor: editedPreprocessor.active ? '#d4edda' : '#f8f9fa' }"></textarea>
          <div class="action-buttons">
            <button @click="savePreprocessor" class="save-btn">保存</button>
            <button @click="cancelEdit" class="cancel-btn">取消</button>
          </div>
        </div>
        <div v-else class="preprocessor-info">
          <div class="preprocessor-content" @click="togglePreprocessor(preprocessor)">
            <p class="preprocessor-name">{{ preprocessor.name || '未命名预处理器' }}</p>
            <p class="preprocessor-description" :title="preprocessor.description">
              {{ truncateDescription(preprocessor.description) }}
            </p>
          </div>
          <div class="preprocessor-actions">
            <div class="action-icons">
              <span @click.stop="startEdit(preprocessor)" class="edit-btn" title="编辑">✎</span>
              <span @click.stop="deletePreprocessor(preprocessor)" class="delete-btn" title="删除">&times;</span>
            </div>
            <div class="toggle-wrapper">
              <input type="checkbox" :checked="preprocessor.active" @click.stop="togglePreprocessor(preprocessor)">
              <span class="toggle-slider"></span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!isAdding" class="new-preprocessor" @click="startAdding">
        <span class="add-icon">+</span>
        <span>添加新预处理器</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  
  const STORAGE_KEY = 'logdog_preprocessors'
  
  const preprocessors = ref([])
  const editedPreprocessor = ref({ id: null, name: '', description: '', function: '', active: false })
  const editingId = ref(null)
  const isAdding = ref(false)
  
  const displayPreprocessors = computed(() => {
    return isAdding.value ? [...preprocessors.value, editedPreprocessor.value] : preprocessors.value
  })
  
  // 从 localStorage 加载预处理器
  const loadPreprocessors = () => {
    const savedPreprocessors = localStorage.getItem(STORAGE_KEY)
    if (savedPreprocessors) {
      preprocessors.value = JSON.parse(savedPreprocessors).map(preprocessor => ({
        ...preprocessor,
        active: false
      }))
    }
  }
  
  // 保存预处理器到 localStorage，但不保存 active 状态
  const savePreprocessors = () => {
    const preprocessorsToSave = preprocessors.value.map(({ id, name, description, function: func }) => ({ id, name, description, function: func }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preprocessorsToSave))
  }
  
  const startEdit = (preprocessor) => {
    editedPreprocessor.value = { ...preprocessor }
    editingId.value = preprocessor.id
    isAdding.value = false
  }
  
  const deletePreprocessor = (preprocessor) => {
    const index = preprocessors.value.findIndex(p => p.id === preprocessor.id)
    if (index !== -1) {
      preprocessors.value.splice(index, 1)
      emitPreprocessorUpdate()
      savePreprocessors()
    }
  }
  
  const savePreprocessor = () => {
    if (editingId.value !== null) {
      const index = preprocessors.value.findIndex(p => p.id === editingId.value)
      if (index !== -1) {
        preprocessors.value[index] = { ...editedPreprocessor.value }
      }
    } else if (isAdding.value) {
      editedPreprocessor.value.id = Date.now()
      preprocessors.value.push({ ...editedPreprocessor.value })
    }
    emitPreprocessorUpdate()
    savePreprocessors()
    resetForm()
  }
  
  const cancelEdit = () => {
    resetForm()
  }
  
  const resetForm = () => {
    editedPreprocessor.value = { id: null, name: '', description: '', function: getExampleCode(), active: false }
    editingId.value = null
    isAdding.value = false
  }
  
  const togglePreprocessor = (preprocessor) => {
    preprocessor.active = !preprocessor.active
    emitPreprocessorUpdate()
  }
  
  const emitPreprocessorUpdate = () => {
    emits('preprocessorUpdated', preprocessors.value)
    const activePreprocessors = preprocessors.value.filter(p => p.active)
    const combinedFunction = (fileName, lineNumber, content) => {
      return activePreprocessors.reduce((result, p) => {
        try {
          const func = new Function('return ' + p.function)()
          return func(fileName, lineNumber, result)
        } catch (error) {
          console.error(`Error in preprocessor "${p.name}":`, error)
          return result
        }
      }, content)
    }
    const toggledPreprocessor = preprocessors.value.find(p => p.active !== p.prevActive)
    if (toggledPreprocessor) {
      emits('preprocessorApplied', { 
        function: combinedFunction, 
        action: 'toggle', 
        preprocessor: {
          active: toggledPreprocessor.active,
          function: toggledPreprocessor.function
        }
      })
    }
  }
  
  const emits = defineEmits(['preprocessorUpdated', 'preprocessorApplied'])
  
  watch(preprocessors, () => {
    preprocessors.value.forEach(p => p.prevActive = p.active)
    emitPreprocessorUpdate()
  }, { deep: true, immediate: true })
  
  onMounted(() => {
    loadPreprocessors()
  })
  
  const startAdding = () => {
    editedPreprocessor.value = { id: null, name: '', description: '', function: getExampleCode(), active: false }
    editingId.value = null
    isAdding.value = true
  }
  
  const getExampleCode = () => {
    return `function(fileName, lineNumber, content) {
    // 示例：在行首添加文件名和行号
    return \`[\${fileName}:\${lineNumber}] \${content}\`;

    // 示例：将时间戳转换为可读格式
    // return content.replace(/\\b\\d{10}\\b/g, (timestamp) => {
    //   const date = new Date(timestamp * 1000);
    //   return date.toLocaleString();
    // });

    // 示例：高亮特定关键词
    // const keywords = ['error', 'warning', 'critical'];
    // return keywords.reduce((result, keyword) => {
    //   const regex = new RegExp(keyword, 'gi');
    //   return result.replace(regex, match => \`<span style="background-color: yellow;">\${match}</span>\`);
    // }, content);

    // 示例：提取并格式化 JSON 数据
    // const jsonRegex = /{.*}/;
    // const match = content.match(jsonRegex);
    // if (match) {
    //   try {
    //     const jsonData = JSON.parse(match[0]);
    //     const formattedJson = JSON.stringify(jsonData, null, 2);
    //     return content.replace(jsonRegex, formattedJson);
    //   } catch (e) {
    //     // JSON 解析失败，返回原始内容
    //     return content;
    //   }
    // }
    // return content;
  }`
  }
  
  // 新增：截断描述的函数
  const truncateDescription = (description) => {
    if (!description) return '无描述'
    return description.length > 15 ? description.slice(0, 15) + '...' : description
  }
  </script>
  
  <style scoped>
  /* 样式保持不变，可以根据需要调整 */
  .preprocessor-item {
    margin-bottom: 10px;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    background-color: #f8f9fa;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .preprocessor-active {
    background-color: #d4edda;
    border-left: 4px solid #28a745;
  }
  
  .preprocessor-info {
    display: flex;
    align-items: center;
    padding: 10px 15px;
  }
  
  .preprocessor-content {
    flex-grow: 1;
    cursor: pointer;
  }
  
  .preprocessor-name {
    margin: 0;
    font-weight: bold;
    font-size: 16px;
  }
  
  .preprocessor-description {
    margin: 5px 0 0;
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: help; /* 添加这行，表示鼠标悬停时会显示更多信息 */
  }
  
  .preprocessor-actions {
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
  
  .preprocessor-edit {
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
  
  .function-input {
    height: 100px;
    resize: vertical;
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
  
  .new-preprocessor {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    background-color: #e9ecef;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .new-preprocessor:hover {
    background-color: #dee2e6;
  }
  
  .add-icon {
    font-size: 24px;
    margin-right: 10px;
    color: #28a745;
  }
  </style>