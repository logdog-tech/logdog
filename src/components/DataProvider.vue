<!-- DataProvider.vue -->
<template>
    <div class="file-input-container h-full w-full relative flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
        @dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <!-- 拖拽覆盖层 -->
        <div v-if="isDragging"
            class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-10 transition-all duration-300">
            <div
                class="w-[90%] h-[90%] rounded-xl border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center">
                <div
                    class="w-12 h-12 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-500">
                    <i class="pi pi-cloud-upload text-xl"></i>
                </div>
                <p class="text-sm mb-2 text-blue-600 dark:text-blue-400">
                    松开以分析文件
                </p>
            </div>
        </div>
        <!-- 标签栏 -->
        <div class="px-3">
            <div class="flex p-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm">
                <button v-for="provider in providers" :key="provider.name" @click="setActiveProvider(provider.name)"
                    :class="[
                        'flex-1 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 relative',
                        currentProviderName === provider.name
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]">
                    {{ provider.name }}
                    <div v-if="currentProviderName === provider.name"
                        class="absolute inset-0 bg-white dark:bg-gray-600 rounded-lg shadow-sm" style="z-index: -1;">
                    </div>
                </button>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
            <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">

                <!-- 资源列表内容 -->
                <div class="h-full flex flex-col">
                    <!-- 标题行 -->
                    <div v-if="currentProviderName !== '文件日志' || resources.length > 0"
                        class="px-3 py-1 text-sm font-medium bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center">
                            <div class="flex-1 flex items-center space-x-4 min-w-0">
                                <div class="w-full max-w-md">
                                    <input v-model="filterText" type="text"
                                        :placeholder="'输入' + currentProviderName + '过滤...'" class="w-full pl-2 pr-7 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700 
                                        bg-white dark:bg-gray-800 
                                        text-gray-700 dark:text-gray-300
                                        placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-500 
                                        focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500
                                        outline-none transition-colors duration-200" />
                                </div>
                            </div>

                            <div v-if="currentProviderName === '文件日志'" class="relative group ml-2">
                                <button
                                    class="p-1 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <i class="pi pi-bars"></i>
                                </button>
                                <!-- 下拉菜单 -->
                                <div
                                    class="absolute right-0 mt-1 w-36 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <label
                                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input type="file" @change="handleFileSelection" multiple class="hidden" />
                                        <i class="pi pi-file w-4 mr-2"></i>
                                        <span>选择文件</span>
                                    </label>
                                    <label
                                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input type="file" @change="handleFolderSelection" webkitdirectory directory
                                            class="hidden" />
                                        <i class="pi pi-folder w-4 mr-2"></i>
                                        <span>选择文件夹</span>
                                    </label>
                                    <button @click="handleReset"
                                        class="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <i class="pi pi-refresh w-4 mr-2"></i>
                                        <span>重置</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 资源列表 -->
                    <template v-if="currentProviderName !== '文件日志' || resources.length > 0">
                        <ul v-if="filteredResources.length > 0"
                            class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                            <li v-for="resource in filteredResources" :key="resource"
                                @click="handleResourceClick(resource)"
                                class="px-3 py-2 cursor-pointer group flex items-center space-x-2 transition-colors duration-200"
                                :class="[
                                    resource === currentResource
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                                ]" :title="resource">
                                <i :class="[
    'pi',
    currentProviderName === '文件日志' ? 'pi-file' : 'pi-inbox',
    resource === currentResource ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
]"></i>
                                <span class="text-sm">
                                    <HighlightText :text="resource" :highlight="filterText" />
                                </span>
                            </li>
                        </ul>
                        <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            暂无{{ currentProviderName }}
                        </div>
                    </template>

                    <!-- 选择文件模式 -->
                    <div v-else class="flex-1 flex items-center justify-center">
                        <div class="text-center">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                点击或拖拽文件到此处
                            </p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">
                                支持 .log、.txt、.zip、.gz、.zst 等格式
                            </p>
                            <div class="flex justify-center space-x-4">
                                <label class="px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                    border border-gray-200 dark:border-gray-700
                                    text-gray-600 dark:text-gray-300
                                    flex items-center">
                                    <input type="file" @change="handleFileSelection" multiple class="hidden" />
                                    <i class="pi pi-file-alt mr-2"></i>
                                    选择文件
                                </label>
                                <label class="px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                    border border-gray-200 dark:border-gray-700
                                    text-gray-600 dark:text-gray-300
                                    flex items-center">
                                    <input type="file" @change="handleFolderSelection" webkitdirectory directory
                                        class="hidden" />
                                    <i class="pi pi-folder mr-2"></i>
                                    选择文件夹
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import HighlightText from './HighlightText.vue';
import { proxyProvider } from '../utils/providers/ProxyProvider';

export default defineComponent({
    components: {
        HighlightText
    },
    data() {
        const providers = proxyProvider.availableProviders();
        return {
            isDragging: false,
            currentResource: null as string | null,
            filterText: '',
            providers,
            currentProviderName: providers[0].name,
            dragCounter: 0,
            resources: [] as string[]
        };
    },
    computed: {
        filteredResources(): string[] {
            if (!this.filterText) {
                return this.resources;
            }

            const searchText = this.filterText.toLowerCase();
            return this.resources.filter(resource =>
                resource.toLowerCase().includes(searchText)
            );
        }
    },
    methods: {
        async handleResourceClick(resource: string) {
            console.log("handleResourceClick", resource);
            if (this.currentResource === resource) {
                return;
            }
            this.currentResource = resource;
            await proxyProvider.useResource(resource);
            this.$emit('fileLoaded', resource);
        },
        setActiveProvider(name: string) {
            if (this.currentProviderName === name) return;
            this.currentProviderName = name;
            proxyProvider.setProvider(name);
            this.currentResource = null;
            this.filterText = '';

            this.resources = proxyProvider.getResources();

            if (this.resources.length > 0) {
                this.handleResourceClick(this.resources[0]);
            }
            this.$emit('switchToListMode');
        },
        handleDragEnter(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
            this.dragCounter++;
            this.isDragging = true;
        },
        handleDragOver(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
        },
        handleDragLeave(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.isDragging = false;
            }
        },
        async processEntry(entry: FileSystemEntry, processedFiles: File[]): Promise<void> {
            if (entry.isFile) {
                // 如果是文件，将其转换为 File 对象并添加到 processedFiles 中
                const file = await new Promise<File>((resolve, reject) => {
                    (entry as FileSystemFileEntry).file(resolve, reject);
                });
                processedFiles.push(file);
            } else if (entry.isDirectory) {
                // 如果是目录，创建目录读取器
                const dirReader = (entry as FileSystemDirectoryEntry).createReader();

                // 定义一个递归函数来读取所有条目
                const readAllEntries = async (): Promise<void> => {
                    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
                        dirReader.readEntries(resolve, reject);
                    });

                    // 处理当前批次的条目
                    for (const innerEntry of entries) {
                        await this.processEntry(innerEntry, processedFiles);
                    }

                    // 如果还有更多条目，继续读取
                    if (entries.length > 0) {
                        await readAllEntries();
                    }
                };

                // 开始读取目录中的所有条目
                await readAllEntries();
            }
        },
        async handleDrop(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
            this.isDragging = false;
            this.dragCounter = 0;

            const items = Array.from(event.dataTransfer!.items);
            const processedFiles: File[] = [];
            const promises = items.map((item) => {
                if (item.kind === 'file') {
                    const entry = (item as any).webkitGetAsEntry();
                    if (entry) {
                        return this.processEntry(entry, processedFiles);
                    }
                }
            });
            await Promise.all(promises);

            if (processedFiles.length > 0) {
                await this.processFiles(processedFiles);
            }
        },
        async handleFileSelection(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                await this.processFiles(Array.from(target.files));
            }
        },
        async handleFolderSelection(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                await this.processFiles(Array.from(target.files));
            }
        },
        async processFiles(selectedFiles: File[]) {
            await proxyProvider.setup(selectedFiles);
            this.resources = proxyProvider.getResources();
            this.$emit('fileLoaded', null);

            if (this.resources.length > 0) {
                await this.handleResourceClick(this.resources[0]);
            }
        },
        handleReset() {
            this.resources = [];
            this.currentResource = null;
            this.filterText = '';
            this.$emit('fileLoaded', null);
        }
    },
    mounted() {
        window.addEventListener('dragenter', this.handleDragEnter);
        window.addEventListener('dragover', this.handleDragOver);
        window.addEventListener('dragleave', this.handleDragLeave);
        window.addEventListener('drop', this.handleDrop);
    },
    unmounted() {
        window.removeEventListener('dragenter', this.handleDragEnter);
        window.removeEventListener('dragover', this.handleDragOver);
        window.removeEventListener('dragleave', this.handleDragLeave);
        window.removeEventListener('drop', this.handleDrop);
    }
});
</script>

<style scoped>
.file-input-container {
    position: relative;
    font-family: system-ui, -apple-system, sans-serif;
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
