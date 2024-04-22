<!-- DataProvider.vue -->
<template>
  <div class="file-input-container">
    <div class="logo">
      <h1>LogDog</h1>
      <p>一款强大的日志分析工具</p>
    </div>
    <div class="button-group"> <label for="folderInput" class="custom-button left-button"> <i class="fas fa-folder"></i>
        文件夹 <input type="file" id="folderInput" @change="handleFolderSelection" webkitdirectory directory
          class="hidden-input"> </label> <label for="fileInput" class="custom-button right-button"> <i
          class="fas fa-file"></i> 文件 <input type="file" id="fileInput" @change="handleFileSelection" multiple
          class="hidden-input"> </label> </div>
    <p class="file-label">打开日志文件或文件夹进行分析</p>
    <ul v-if="files.length > 0" class="file-list">
      <li v-for="file in files" :key="file.path" @click="handleFileRead(file)" class="file-item" :title="file.path"> {{
        file.name }} </li>
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
<style
  scoped>
  .file-input-container {
    margin: auto;
    width: 100%;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .logo {
    text-align: center;
    margin-bottom: 1rem;
  }

  .logo h1 {
    font-size: 24px;
    font-weight: bold;
    color: #1a1a1a;
    margin: 0;
  }

  .logo p {
    font-size: 14px;
    color: #666;
    margin: 3px 0 0;
  }

  .button-group {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .custom-button {
    background-color: #007aff;
    color: #fff;
    border: none;
    padding: 8px 16px;
    text-align: center;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .left-button {
    border-top-left-radius: 32px;
    border-bottom-left-radius: 32px;
    margin:0.02rem;
    width: 80px;
  }

  .right-button {
    border-top-right-radius: 32px;
    border-bottom-right-radius: 32px;
    margin:0.02rem;
    width: 80px;
  }

  .custom-button:hover {
    background-color: #005ad5;
  }

  .custom-button i {
    margin-right: 6px;
    font-size: 16px;
  }

  .hidden-input {
    display: none;
  }

  .file-label {
    font-size: 12px;
    color: #888;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .file-list {
    max-height: 30vh;
    overflow-y: auto;
    background-color: #f8f9fa;
    border: 1px solid #e5e5e5;
    padding: 0;
    list-style: none;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .file-item {
    padding: 8px 12px;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .file-item:hover {
    background-color: #e5e5e5;
  }
</style>