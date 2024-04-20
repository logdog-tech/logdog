<template>
    <div>
      <h5>文本文件输入</h5>
      <input type="file" @change="readFile" accept=".txt" class="form-control mb-4">
    </div>
  </template>
  
  <script setup>
    const emit = defineEmits(['fileLoaded'])
  
    const readFile = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          emit('fileLoaded', e.target.result)
        }
        reader.readAsText(file)
      }
    }
  </script>