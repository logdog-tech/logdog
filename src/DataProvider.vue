<!-- DataProvider.vue -->
<template>
  <div class="file-input-container">
    <h5>文本文件输入</h5>
    <div class="button-group">
      <label for="folderInput" class="custom-button">按文件夹分析
        <input type="file" id="folderInput" @change="handleFolderSelection" webkitdirectory directory class="hidden-input">
      </label>
      <label for="fileInput" class="custom-button">按文件分析
        <input type="file" id="fileInput" @change="handleFileSelection" multiple class="hidden-input">
      </label>
    </div>
    <ul v-if="files.length > 0" class="file-list">
      <li v-for="file in files" :key="file.path" @click="handleFileRead(file)" class="file-item" :title="file.path">
        {{ file.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import JSZip from 'jszip'

const emit = defineEmits(['fileLoaded'])
const files = ref([])
const zipFiles = ref([])

function handleFolderSelection(event) {
  const selectedFiles = Array.from(event.target.files)
  processFiles(selectedFiles)
}

function handleFileSelection(event) {
  const selectedFiles = Array.from(event.target.files)
  processFiles(selectedFiles)
}

function processFiles(selectedFiles) {
  files.value = []
  zipFiles.value = []

  console.log("选中文件数量:", selectedFiles.length)
  selectedFiles.forEach(file => {
    if (file.name.endsWith('.zip')) {
      processZipFile(file)
      zipFiles.value.push(file)
    } else {
      files.value.push(file)
    }
  })

  if (files.value.length > 0) {
    handleFileRead(files.value[0])
  }
}

function handleFileRead(file) {
  if (file.zip) {
    extractFileFromZip(file)
  } else {
    readFile(file)
  }
}

function extractFileFromZip(file) {
  const [zipFileName, innerFileName] = file.path.split('@')
  const zipFile = zipFiles.value.find(f => f.name === zipFileName && !f.zip)
  if (zipFile) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const zip = new JSZip()
      try {
        const contents = await zip.loadAsync(e.target.result)
        const fileData = await contents.file(innerFileName).async("string")
        emit('fileLoaded', fileData)
      } catch (err) {
        console.error('解压文件时出错:', err)
      }
    }
    reader.readAsArrayBuffer(zipFile)
  }
}

function readFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    emit('fileLoaded', e.target.result)
  }
  reader.readAsText(file)
}

function processZipFile(zipFile) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const zip = new JSZip()
    try {
      const contents = await zip.loadAsync(e.target.result)
      for (const fileName in contents.files) {
        const file = contents.files[fileName];
        if (!file.dir) {
          files.value.push({
            path: `${zipFile.name}@${fileName}`,
            name: `${zipFile.name}@${fileName}`,
            size: file._data.uncompressedSize,
            zip: true
          })
        }
      }
    } catch (err) {
      console.error('读取ZIP文件时出错:', err)
    }
  }
  console.log("读取ZIP文件为ArrayBuffer:", zipFile)
  reader.readAsArrayBuffer(zipFile)
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