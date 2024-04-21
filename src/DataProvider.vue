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
        <!-- {{ file.webkitRelativePath + "/" + file.name }} -->
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

const readFolder = (event) => {
  files.value = Array.from(event.target.files)
  if (files.value.length > 0) {
    readFile(files.value[0])
  }
}

const readFiles = (event) => {
  const selectedFiles = Array.from(event.target.files)
  files.value = []
  
  selectedFiles.forEach(file => {
    if (file.name.endsWith('.zip')) {
      // 处理 zip 文件
      readZip(file)
      files.value.push(file)
    } else {
      // 其他文件类型，直接添加
      files.value.push(file)
    }
  })

  if (files.value.length > 0) {
    readFile(files.value[0])
  }
}

const readFile = (file) => {
  if (file.zip) {
    // 提取ZIP文件内的文件内容
    const [zipFileName, innerFileName] = file.path.split('@')
    const zipFile = files.value.find(f => f.name === zipFileName && !f.zip)
    console.log('files:', files)
    console.log('click target file4:', zipFile, zipFileName, innerFileName)
    if (zipFile) {
      console.log('found zipFile:', zipFile)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const zip = new JSZip()
        try {
          const contents = await zip.loadAsync(e.target.result)
          const fileData = await contents.file(innerFileName).async("string")
          emit('fileLoaded', fileData)
        } catch (err) {
          console.error('Error extracting file:', err)
        }
      }
      reader.readAsArrayBuffer(zipFile)
    }
  } else {
    // 处理普通文件
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('fileLoaded', e.target.result)
    }
    reader.readAsText(file)
  }
}

const readZip = (zipFile) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const zip = new JSZip()
    try {
      const contents = await zip.loadAsync(e.target.result)
      for (const fileName in contents.files) {
        const file = contents.files[fileName];
        if (!file.dir) { // 确保不是目录
          files.value.push({
            path: `${zipFile.name}@${fileName}`, // 包含zip文件名和内部路径
            name: fileName, // 文件名
            size: file._data.uncompressedSize, // 文件未压缩大小
            zip: true // 标记为zip内的文件
          })
        }
      }
    } catch (err) {
      console.error('Error reading zip:', err)
    }
  }
  console.error("readZip readAsArrayBuffer=",zipFile)
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