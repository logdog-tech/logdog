<!-- DataProvider.vue -->
<template>
    <div class="file-input-container" @dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave"
      @drop="handleDrop">
      <div class="logo">
        <h1>LogDog</h1>
        <p>一款强大的日志分析工具</p>
      </div>
      <div class="button-group">
        <label for="folderInput" class="custom-button left-button">
          <i class="fas fa-folder"></i>
          文件夹
          <input type="file" id="folderInput" @change="handleFolderSelection" webkitdirectory directory
            class="hidden-input">
        </label>
        <label for="fileInput" class="custom-button right-button">
          <i class="fas fa-file"></i>
          文件
          <input type="file" id="fileInput" @change="handleFileSelection" multiple class="hidden-input">
        </label>
      </div>
      <p class="file-label">打开日志文件或文件夹进行分析</p>
      <ul v-if="files.length > 0" class="file-list">
        <li v-for="file in files" :key="file.path" @click="handleFileRead(file)" class="file-item" :title="file.path">
          {{ file.name }}
        </li>
      </ul>
      <div v-if="isDragging" class="drag-overlay">
        <div class="drag-message">
          <i class="fas fa-file-import"></i>
          将文件或文件夹拖拽到此处进行分析
        </div>
      </div>
      <div v-if="!isDragging && files.length === 0" class="empty-overlay" @click="triggerFileInputClick">
        <div class="empty-message">
          <i class="fas fa-file-import"></i>
          将文件或文件夹拖拽到此处进行分析
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import JSZip from 'jszip'
  
  const emit = defineEmits(['fileLoaded'])
  const files = ref([])
  const zipFiles = ref([])
  const isDragging = ref(false)
  let dragCounter = 0
  
  function handleDragEnter(event) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter++
    isDragging.value = true
  }
  
  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter--
    if (dragCounter === 0) {
      isDragging.value = false
    }
  }
  
  async function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = false
    dragCounter = 0
    const items = Array.from(event.dataTransfer.items)
    const processedFiles = []
    const promises = items.map(item => {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        return processEntry(entry, processedFiles)
      }
    })
    await Promise.all(promises)
    // 将新拖拽的文件追加到 files.value 中
    files.value = [...files.value, ...processedFiles]
    // 将最后一个文件设置为当前选中的文件
    if (processedFiles.length > 0) {
      handleFileRead(processedFiles[processedFiles.length - 1])
    }
  }
  
  function processEntry(entry, processedFiles) {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file) => {
          // 检查文件是否已经存在于 files.value 中
          const existingFile = files.value.find(f => f.name === file.name && f.size === file.size)
          if (!existingFile) {
            if (file.name.endsWith('.zip')) {
              processZipFile(file)
              zipFiles.value.push(file)
            } else {
              processedFiles.push(file)
            }
          }
          resolve()
        })
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader()
        dirReader.readEntries(async (entries) => {
          for (const innerEntry of entries) {
            await processEntry(innerEntry, processedFiles)
          }
          resolve()
        })
      }
    })
  }
  
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
          const fileName = innerFileName.split('/').pop()
          emit('fileLoaded', fileData, fileName)
        } catch (err) {
          console.error('解压文件时出错:', err)
        }
      }
      reader.readAsArrayBuffer(zipFile)
    }
  }
  
  function readFile(file) {
    console.time('🕘加载文件');
    console.timeLog('🕘加载文件', 's1.1, 开始读取文件');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      console.timeLog('🕘加载文件', 's1.2, 文件二进制数据加载完成');
      
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(e.target.result);
      
      console.timeLog('🕘加载文件', 's1.3, 文件解码完成');
  
      emit('fileLoaded', text, file.name);
    };
    reader.readAsArrayBuffer(file);
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
    reader.readAsArrayBuffer(zipFile)
  }
  
  onMounted(() => {
    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
  })
  
  onUnmounted(() => {
    window.removeEventListener('dragenter', handleDragEnter)
    window.removeEventListener('dragover', handleDragOver)
    window.removeEventListener('dragleave', handleDragLeave)
    window.removeEventListener('drop', handleDrop)
  })
  
  function triggerFileInputClick() {
    // 这里假设你想要触发文件选择，如果是文件夹选择，可以改为 folderInput
    document.getElementById('fileInput').click();
  }
  
  </script>
  
  <style scoped>
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
    margin: 0.02rem;
    width: 80px;
  }
  
  .right-button {
    border-top-right-radius: 32px;
    border-bottom-right-radius: 32px;
    margin: 0.02rem;
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
  
  .drag-overlay,
  .empty-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .drag-message,
  .empty-message {
    justify-content: center;
    width: 80%;
    height: 70%;
    border-radius: 10px;
    font-size: 24px;
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 2px dashed #007aff;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  .drag-message:hover,
  .empty-message:hover {
    border-color: #005ad5;
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .drag-message i,
  .empty-message i {
    margin-right: 15px;
    font-size: 32px;
    color: #007aff;
  }
  
  .empty-message {
    background-color: #fcfcfc;
  }
  </style>