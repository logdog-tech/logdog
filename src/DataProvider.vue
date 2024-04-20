<!-- DataProvider.vue -->
<template>
  <div class="file-input-container">
    <h5>文本文件输入</h5>
    <div class="button-group">
      <label for="folderInput" class="custom-button">按文件夹分析
        <input type="file" id="folderInput" @change="readFolder" webkitdirectory directory class="hidden-input">
      </label>
      <label for="fileInput" class="custom-button">按文件分析
        <input type="file" id="fileInput" @change="readFiles" multiple class="hidden-input">
      </label>
    </div>
    <ul v-if="files.length > 0" class="file-list">
      <li v-for="file in files" :key="file.path" @click="readFile(file)" class="file-item" :title="file.path">
        {{ file.webkitRelativePath + "/" + file.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['fileLoaded'])

const files = ref([])

const readFolder = (event) => {
  files.value = Array.from(event.target.files)
}
const readFiles = (event) => {
  const selectedFiles = Array.from(event.target.files)
  selectedFiles.forEach(file => {
    files.value.push(file)
  })
}

const traverseDirectory = (entry) => {
  const reader = entry.createReader()
  reader.readEntries((entries) => {
    entries.forEach((entry) => {
      if (entry.isFile) {
        entry.file((file) => {
          file.path = entry.fullPath
          files.value.push(file)
        })
      } else if (entry.isDirectory) {
        traverseDirectory(entry)
      }
    })
  })
}

const readFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    emit('fileLoaded', e.target.result)
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.file-input-container {
  width: 280px;
  margin: auto;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.custom-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.custom-button:hover {
  background-color: #0056b3;
}

.hidden-input {
  display: none;
}

.file-list {
  max-height: 30vh;
  overflow-y: auto;
  background-color: #f8f9fa;
  border: 1px solid #ccc;
  padding: 0;
  list-style: none;
}

.file-item {
  padding: 8px 12px;
  font-size: 0.8rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.file-item:hover {
  background-color: #e9ecef;
}
</style>