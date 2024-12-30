<!-- DataProvider.vue -->
<template>
    <div class="file-input-container h-full w-full relative" @dragenter="handleDragEnter" @dragover="handleDragOver"
        @dragleave="handleDragLeave" @drop="handleDrop">
        <!-- 拖拽覆盖层 - 移到最外层，这样在任何模式下都会显示 -->
        <div v-if="isDragging" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
             flex items-center justify-center z-10 transition-all duration-300">
            <div class="w-[90%] h-[90%] rounded-xl border-2 border-dashed border-blue-500 
               bg-blue-50 dark:bg-blue-900/20 
               flex flex-col items-center justify-center">
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
            <div
                class="px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between space-x-2">
                    <span class="text-gray-500 dark:text-gray-400">文件列表</span>
                    <div class="relative flex-1 min-w-[36px] max-w-[200px]">
                        <input v-model="filterText" type="text" placeholder="输入正则过滤..." class="w-full pl-2 pr-7 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800 
                     text-gray-700 dark:text-gray-300
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-blue-500 dark:focus:border-blue-500 
                     focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500
                     outline-none transition-colors duration-200" />
                        <i
                            class="fas fa-search absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs"></i>
                    </div>
                </div>
            </div>

            <!-- 文件列表 -->
            <ul class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                <li v-for="file in filteredFiles" :key="file" @click="handleClickFile(file)"
                    class="px-3 py-2 cursor-pointer group flex items-center space-x-2 transition-colors duration-200"
                    :class="[
                        file === currentFile
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                    ]" :title="file">
                    <i class="fas fa-file-alt" :class="[
                        file === currentFile ? 'text-blue-500'
                            : 'text-gray-400 group-hover:text-blue-500'
                    ]"></i>
                    <span class="text-sm">
                        <HighlightText :text="file" :highlight="filterText" />
                    </span>
                </li>
            </ul>
        </div>

        <!-- 选择文件模式 -->
        <div v-else class="h-full">
            <!-- 选择文件界面 -->
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-[90%] h-[90%] rounded-xl border-2 border-dashed transition-all duration-300 
                 flex flex-col items-center justify-center cursor-pointer relative group" :class="[
    isDragging
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-500/50'
]">
                    <!-- 图标 -->
                    <div class="w-12 h-12 mb-4 mt-4 rounded-full flex items-center justify-center transition-all duration-300"
                        :class="[
                            isDragging
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        ]">
                        <i class="pi pi-file-import text-xl"></i>
                    </div>

                    <!-- 提示文本 -->
                    <p class="text-sm mb-2 transition-all duration-300" :class="[
                        isDragging
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                    ]">
                        {{ isDragging ? '松开以分析文件' : '点击或拖拽文件到此处' }}
                    </p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        支持 .log、.txt、.zip、.gz、.zst 等格式
                    </p>

                    <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    </p>

                    <!-- 快捷操作按钮 -->
                    <div class="flex space-x-2 mb-12" @click.stop>
                        <label class="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-300">
                            <input type="file" @change="handleFileSelection" multiple class="hidden" />
                            <i class="fas fa-file-alt mr-2"></i>
                            选择文件
                        </label>

                        <label class="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                     bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-300">
                            <input type="file" @change="handleFileSelection" webkitdirectory directory class="hidden" />
                            <i class="fas fa-folder mr-2"></i>
                            选择文件夹
                        </label>
                    </div>

                    <!-- 底部醒目提示 -->
                    <div
                        class="absolute -bottom-2 left-0 right-0 text-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-10">
                        <p class="text-sm font-medium tracking-wide px-4 py-2
                     text-blue-500 dark:text-blue-400 inline-block">
                            <i class="fas fa-lightbulb mr-2 opacity-75"></i>
                            拖拽文件到此处即可快速分析日志
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import HighlightText from './HighlightText.vue'
import { BrowserProvider } from '../utils/providers/BrowserProvider'
import { dataAdapter } from '../utils/dataAdapter'

export default defineComponent({
    components: {
        HighlightText
    },
    props: {
        isSelectedFileMode: {
            type: Boolean,
            required: true
        }
    },
    emits: ['fileLoaded', 'switchToListMode'],
    data() {
        return {
            browserProvider: new BrowserProvider(),
            files: [] as string[],
            isDragging: false,
            dragCounter: 0,
            currentFile: null as string | null,
            filterText: ''
        }
    },
    computed: {
        filteredFiles() {
            if (!this.filterText) return this.files

            try {
                const regex = new RegExp(this.filterText, 'i')
                return this.files.filter(file => regex.test(file))
            } catch (e) {
                return this.files
            }
        }
    },
    methods: {
        handleDragEnter(event: DragEvent) {
            event.preventDefault()
            event.stopPropagation()
            this.dragCounter++
            this.isDragging = true
        },
        handleDragOver(event: DragEvent) {
            event.preventDefault()
            event.stopPropagation()
        },
        handleDragLeave(event: DragEvent) {
            event.preventDefault()
            event.stopPropagation()
            this.dragCounter--
            if (this.dragCounter === 0) {
                this.isDragging = false
            }
        },
        async processEntry(entry: FileSystemEntry, processedFiles: File[]): Promise<void> {
            if (entry.isFile) {
                // 处理文件
                const file = await new Promise<File>((resolve, reject) => {
                    (entry as FileSystemFileEntry).file(resolve, reject);
                });
                processedFiles.push(file);
            } else if (entry.isDirectory) {
                // 处理目录
                const dirReader = (entry as FileSystemDirectoryEntry).createReader();
                const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
                    dirReader.readEntries(resolve, reject);
                });

                // 递归处理目录中的每个条目
                for (const innerEntry of entries) {
                    await this.processEntry(innerEntry, processedFiles);
                }
            }
        },
        async handleDrop(event: DragEvent) {
            event.preventDefault()
            event.stopPropagation()
            this.isDragging = false
            this.dragCounter = 0
            const items = Array.from(event.dataTransfer!.items)
            const processedFiles: File[] = []
            const promises = items.map((item) => {
                if (item.kind === 'file') {
                    const entry = (item as any).webkitGetAsEntry()
                    if (entry) {
                        return this.processEntry(entry, processedFiles)
                    }
                }
            })
            await Promise.all(promises)
            console.log('processedFiles=', processedFiles)

            if (processedFiles.length > 0) {
                this.processFiles(processedFiles)
            }
        },
        async handleFileSelection(event: Event) {
            const target = event.target as HTMLInputElement
            const selectedFiles = Array.from(target.files || [])
            this.processFiles(selectedFiles)
        },
        async processFiles(selectedFiles: File[]) {
            console.log('processFiles', selectedFiles)
            await this.browserProvider.setup(selectedFiles)
            const paths = this.browserProvider.getResources()
            console.log('paths=', paths)
            this.files = paths
            this.$emit('switchToListMode')

            await this.handleClickFile(paths[0])
        },
        async handleClickFile(uri: string) {
            this.currentFile = uri
            const lines = await this.browserProvider.getLines(uri)
            dataAdapter.clear()
            dataAdapter.reset(lines)
        }
    },
    mounted() {
        window.addEventListener('dragenter', this.handleDragEnter)
        window.addEventListener('dragover', this.handleDragOver)
        window.addEventListener('dragleave', this.handleDragLeave)
        window.addEventListener('drop', this.handleDrop)
    },
    unmounted() {
        window.removeEventListener('dragenter', this.handleDragEnter)
        window.removeEventListener('dragover', this.handleDragOver)
        window.removeEventListener('dragleave', this.handleDragLeave)
        window.removeEventListener('drop', this.handleDrop)
    }
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
