<!-- DataProvider.vue -->
<template>
  <div
    class="file-input-container h-full w-full relative"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 拖拽覆盖层 - 移到最外层，这样在任何模式下都会显示 -->
    <div 
      v-if="isDragging"
      class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
             flex items-center justify-center z-10 transition-all duration-300"
    >
      <div 
        class="w-[90%] h-[90%] rounded-xl border-2 border-dashed border-blue-500 
               bg-blue-50 dark:bg-blue-900/20 
               flex flex-col items-center justify-center"
      >
        <div class="w-12 h-12 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 
                    flex items-center justify-center text-blue-500">
          <i class="fas fa-file-import text-xl"></i>
        </div>
        <p class="text-sm mb-2 text-blue-600 dark:text-blue-400">
          松开以分析文件
        </p>
      </div>
    </div>

    <!-- 文件列表模式 -->
    <div v-if="!isSelectedFileMode" class="h-full flex flex-col">
      <!-- 标题行 -->
      <div class="px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between space-x-2">
          <span class="text-gray-500 dark:text-gray-400">文件列表</span>
          <div class="relative flex-1 min-w-[36px] max-w-[200px]">
            <input
              v-model="filterText"
              type="text"
              placeholder="输入正则过滤..."
              class="w-full pl-2 pr-7 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800 
                     text-gray-700 dark:text-gray-300
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-blue-500 dark:focus:border-blue-500 
                     focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500
                     outline-none transition-colors duration-200"
            />
            <i class="fas fa-search absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs"></i>
          </div>
        </div>
      </div>
      
      <!-- 文件列表 -->
      <ul class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        <li
          v-for="file in filteredFiles"
          :key="file.path"
          @click="handleFileRead(file)"
          class="px-3 py-2 cursor-pointer group flex items-center space-x-2 transition-colors duration-200"
          :class="[
            file.name === currentFile?.name && file.path === currentFile?.path
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
          ]"
          :title="file.path"
        >
          <i class="fas fa-file-alt" 
             :class="[
               file.path === currentFile?.path
                 ? 'text-blue-500'
                 : 'text-gray-400 group-hover:text-blue-500'
             ]"
          ></i>
          <span class="text-sm truncate">
            <HighlightText 
              :text="file.name" 
              :highlight="filterText"
            />
          </span>
        </li>
      </ul>
    </div>

    <!-- 选择文件模式 -->
    <div v-else class="h-full">
      <!-- 选择文件界面 -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div 
          class="w-[90%] h-[90%] rounded-xl border-2 border-dashed transition-all duration-300 
                 flex flex-col items-center justify-center cursor-pointer relative group"
          :class="[
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-500/50'
          ]"
        >
          <!-- 图标 -->
          <div 
            class="w-12 h-12 mb-4 mt-4 rounded-full flex items-center justify-center transition-all duration-300"
            :class="[
              isDragging 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            ]"
          >
            <i class="pi pi-file-import text-xl"></i>
          </div>

          <!-- 提示文本 -->
          <p 
            class="text-sm mb-2 transition-all duration-300"
            :class="[
              isDragging 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            ]"
          >
            {{ isDragging ? '松开以分析文件' : '点击或拖拽文件到此处' }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
            支持 .log、.txt、.zip、.gz、.zst 等格式
          </p>

          <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
          </p>

          <!-- 快捷操作按钮 -->
          <div class="flex space-x-2 mb-12" @click.stop>
            <label 
              class="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-300"
            >
              <input
                type="file"
                @change="handleFileSelection"
                multiple
                class="hidden"
              />
              <i class="fas fa-file-alt mr-2"></i>
              选择文件
            </label>

            <label 
              class="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-300"
            >
              <input
                type="file"
                @change="handleFolderSelection"
                webkitdirectory
                directory
                class="hidden"
              />
              <i class="fas fa-folder mr-2"></i>
              选择文件夹
            </label>
          </div>

          <!-- 底部醒目提示 -->
          <div 
            class="absolute -bottom-2 left-0 right-0 text-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
          >
            <p 
              class="text-sm font-medium tracking-wide px-4 py-2
                     text-blue-500 dark:text-blue-400 inline-block"
            >
              <i class="fas fa-lightbulb mr-2 opacity-75"></i>
              拖拽文件到此处即可快速分析日志
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import JSZip, { type JSZipObject } from 'jszip'
import HighlightText from './HighlightText.vue'
import { logdog_decompress } from '../utils/compress'

// 定义文件接口
interface AppFile {
  name: string;
  path: string;
  size: number;
  zip?: boolean;
  file?: File; // 原始的 File 对象
}

const emit = defineEmits(['fileLoaded', 'switchToListMode'])
const files = ref<AppFile[]>([])
const zipFiles = ref<File[]>([])
const isDragging = ref(false)
let dragCounter = 0
defineProps({
  isSelectedFileMode: {
    type: Boolean,
    required: true
  }
})

// 添加当前文件的响应式引用
const currentFile = ref<AppFile | null>(null)

// 初始化 Zstd 解压库
let zstdSimple = {} as {
    decompress: (inputBuffer: Uint8Array) => Uint8Array
}

// 添加搜索相关的响应式变量
const filterText = ref('')

// 添加过滤后的文件列表计算属性
const filteredFiles = computed(() => {
  if (!filterText.value) return files.value

  try {
    const regex = new RegExp(filterText.value, 'i')
    return files.value.filter(file => regex.test(file.name))
  } catch (e) {
    // 如果正则表达式无效，返回所有文件
    return files.value
  }
})

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragCounter++
  isDragging.value = true
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  dragCounter = 0
  const items = Array.from(event.dataTransfer!.items)
  const processedFiles: AppFile[] = []
  const promises = items.map((item) => {
    if (item.kind === 'file') {
      const entry = (item as any).webkitGetAsEntry()
      if (entry) {
        return processEntry(entry, processedFiles)
      }
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

function shouldIncludeFile(fileName: string): boolean {
  return !fileName.startsWith('__MACOSX/') && 
         !fileName.startsWith('.') && 
         !fileName.includes('/.') && 
         !fileName.includes('DS_Store')
}

function processEntry(entry: any, processedFiles: AppFile[]): Promise<void> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file: File) => {
        const existingFile = files.value.find(
          (f) => f.name === file.name && f.size === file.size
        )
        if (!existingFile && shouldIncludeFile(file.name)) {
          if (file.name.endsWith('.zip')) {
            processZipFile(file)
            zipFiles.value.push(file)
          } else {
            const appFile: AppFile = {
              name: file.name,
              path: file.name,
              size: file.size,
              zip: false,
              file: file
            }
            processedFiles.push(appFile)
          }
        }
        resolve()
      })
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader()
      dirReader.readEntries(async (entries: any[]) => {
        // 过滤掉不需要的目录
        const validEntries = entries.filter((entry) => shouldIncludeFile(entry.name))
        for (const innerEntry of validEntries) {
          await processEntry(innerEntry, processedFiles)
        }
        resolve()
      })
    } else {
      resolve()
    }
  })
}

function handleFolderSelection(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  processFiles(selectedFiles)
}

function handleFileSelection(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  processFiles(selectedFiles)
}

function processFiles(selectedFiles: File[]) {
  files.value = []
  zipFiles.value = []
  currentFile.value = null  // 重置当前选中的文件

  selectedFiles.forEach((file) => {
    if (shouldIncludeFile(file.name)) {
      if (file.name.endsWith('.zip')) {
        processZipFile(file)
        zipFiles.value.push(file)
      } else {
        const appFile: AppFile = {
          name: file.name,
          path: file.name,
          size: file.size,
          zip: false,
          file: file
        }
        files.value.push(appFile)
      }
    }
  })

  if (files.value.length > 0) {
    handleFileRead(files.value[0])
  }
}

function handleFileRead(file: AppFile) {
  console.log('handleFileRead', file)
  currentFile.value = file  // 设置当前选中的文件
  if (file.zip) {
    extractFileFromZip(file)
  } else if (file.file) {
    readFile(file.file)
  } else {
    console.error('No file to read')
  }
}

async function extractFileFromZip(file: AppFile) {
  const [zipFileName, innerFileName] = file.path.split('@')
  const zipFile = zipFiles.value.find(
    (f) => f.name === zipFileName
  )
  if (zipFile) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const zip = new JSZip()
      try {
        const contents = await zip.loadAsync(e.target!.result as ArrayBuffer)
        const zipEntry = contents.file(innerFileName)
        if (!zipEntry) {
          console.error('无法找到文件：', innerFileName)
          return
        }

        if (innerFileName.endsWith('.zst')) {
          // 读取文件为 ArrayBuffer
          const compressedBuffer = await zipEntry.async('arraybuffer')
          const inputBuffer = new Uint8Array(compressedBuffer)
          try {
            // 解压缩 .zst 文件
            const outputBuffer = logdog_decompress(inputBuffer, 'zstd')
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(outputBuffer)
            const fileName = innerFileName.split('/').pop()
            emit('fileLoaded', text, fileName)
          } catch (error) {
            console.error('解压 .zst 文件时出错:', error)
          }
        } else if (innerFileName.endsWith('.gz')) {
          // 处理.gz文件
          const compressedBuffer = await zipEntry.async('arraybuffer')
          try {
            const compressed = new Uint8Array(compressedBuffer)
            const decompressed = logdog_decompress(compressed, 'gzip')
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(decompressed)
            const fileName = innerFileName.split('/').pop()
            emit('fileLoaded', text, fileName)
          } catch (error) {
            console.error('解压 .gz 文件时出错:', error)
          }
        } else {
          // 处理普通文件
          const fileData = await zipEntry.async('string')
          const fileName = innerFileName.split('/').pop()
          emit('fileLoaded', fileData, fileName)
        }
      } catch (err) {
        console.error('解压文件时出错:', err)
      }
    }
    reader.readAsArrayBuffer(zipFile)
  } else {
    console.error('无法找到对应的 zip 文件', zipFileName)
  }
}

async function readFile(file: File) {
  console.time('🕘加载文件')
  console.timeLog('🕘加载文件', 's1.1, 开始读取文件')

  // 检查是否为.tar.gz文件
  if (file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz')) {
    console.error('不支持 .tar.gz 格式文件')
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    console.timeLog('🕘加载文件', 's1.2, 文件二进制数据加载完成')

    if (file.name.endsWith('.zst')) {
      // 解压缩 .zst 文件
      const inputBuffer = new Uint8Array(e.target!.result as ArrayBuffer)
      try {
        const outputBuffer = zstdSimple.decompress(inputBuffer)
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(outputBuffer)
        console.timeLog('🕘加载文件', 's1.3, .zst 文件解压并解码完成')
        emit('fileLoaded', text, file.name)
      } catch (error) {
        console.error('解压 .zst 文件时出错:', error)
      }
    } else if (file.name.endsWith('.gz')) {
      // 解压缩 .gz 文件
      try {
        const compressed = new Uint8Array(e.target!.result as ArrayBuffer)
        const decompressed = logdog_decompress(compressed, 'gzip')
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(decompressed)
        console.timeLog('🕘加载文件', 's1.3, .gz 文件解压并解码完成')
        emit('fileLoaded', text, file.name)
      } catch (error) {
        console.error('解压 .gz 文件出错:', error)
      }
    } else {
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(e.target!.result as ArrayBuffer)
      console.timeLog('🕘加载文件', 's1.3, 文件解码完成')

      emit('fileLoaded', text, file.name)
    }
  }
  reader.readAsArrayBuffer(file)
}

function processZipFile(zipFile: File) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const zip = new JSZip()
    try {
      const contents = await zip.loadAsync(e.target!.result as ArrayBuffer)
      let hasValidFiles = false
      
      for (const fileName in contents.files) {
        const zipEntry = contents.files[fileName] as JSZipObject
        if (!zipEntry.dir && shouldIncludeFile(fileName)) {
          const appFile: AppFile = {
            path: `${zipFile.name}@${fileName}`,
            name: `${zipFile.name}@${fileName}`,
            size: 0, // 无法获取压缩包内文件的实际大小
            zip: true,
            // 无需 file 属性，因为它在 zip 中
          }
          files.value.push(appFile)
          hasValidFiles = true
        }
      }
      
      if (hasValidFiles) {
        emit('switchToListMode')
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
</script>

<style scoped>
.file-input-container {
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}

/* 添加一些动画效果 */
.file-input-container label:active {
  transform: scale(0.98);
}

/* 添加滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>