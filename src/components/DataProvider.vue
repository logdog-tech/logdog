<!-- DataProvider.vue -->
<template>
    <div class="file-input-container h-full w-full relative flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
        @dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop.prevent="handleDrop">
        <!-- 拖拽覆盖层 -->
        <div v-if="isDragging"
            class="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50"
            @dragover.prevent="handleMainDragOver" @dragleave.prevent="handleMainDragLeave" @drop.prevent.stop>
            <div v-if="hoverMode === null"
                class="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur px-8 py-6 rounded-2xl shadow-xl">
                <p class="text-2xl font-medium text-white text-center">
                    {{ $t('dataProvider.selectOperation') }}<br>
                    <span class="text-base font-normal text-white/70 mt-2 block">{{
                        $t('dataProvider.appendToCurrentList') }}</span>
                </p>
            </div>
            <div class="w-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                <div class="text-center p-8">
                    <i class="pi pi-cloud-upload text-5xl text-gray-400 dark:text-gray-500 mb-5 block"></i>
                    <p class="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {{ $t('dataProvider.selectLogFile') }}
                    </p>
                    <p class="text-base text-gray-500 dark:text-gray-400">
                        {{ $t('dataProvider.addToCurrentList') }} {{ $t('dataProvider.keepExistingLogs') }}
                    </p>
                </div>
                <div class="flex h-[300px]">
                    <button @mouseover="handleHover('append', $event)" @mouseleave="handleHover(null, $event)"
                        @dragover.prevent.stop="handleHover('append', $event)"
                        @dragleave.prevent="handleHover(null, $event)"
                        @drop.stop.prevent="handleModeDrop('append', $event)"
                        class="flex-1 p-8 transition-all duration-300 rounded-bl-2xl relative overflow-hidden group"
                        :class="{
                            'bg-blue-500 scale-[1.03] z-10': hoverMode === 'append',
                            'hover:bg-blue-50 dark:hover:bg-blue-900/20': hoverMode !== 'append'
                        }">
                        <div class="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-blue-500/5 opacity-0 transition-opacity duration-300"
                            :class="{ '!opacity-100': hoverMode === 'append' }"></div>
                        <div class="absolute inset-0 border-2 border-blue-200 dark:border-blue-700 rounded-bl-2xl opacity-0 transition-opacity duration-300"
                            :class="{ '!opacity-100': hoverMode !== 'append' }"></div>
                        <div class="h-full flex flex-col items-center justify-center gap-4 relative">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-2"
                                :class="hoverMode === 'append' ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'">
                                <i class="pi pi-plus text-3xl transition-all duration-300"
                                    :class="hoverMode === 'append' ? 'text-white scale-125' : 'text-blue-500 dark:text-blue-400 group-hover:scale-110'"></i>
                            </div>
                            <div>
                                <p class="text-xl font-medium mb-3 transition-all duration-300"
                                    :class="hoverMode === 'append' ? 'text-white' : 'text-blue-600 dark:text-blue-400'">
                                    {{ $t('dataProvider.addToCurrentList') }}
                                </p>
                                <p class="text-sm transition-all duration-300"
                                    :class="hoverMode === 'append' ? 'text-white/90' : 'text-blue-500/70 dark:text-blue-400/70'">
                                    {{ $t('dataProvider.keepExistingLogs') }}
                                </p>
                            </div>
                            <div class="absolute inset-x-0 bottom-4 text-center transition-all duration-300"
                                :class="{ 'opacity-100 translate-y-0': hoverMode === 'append', 'opacity-0 translate-y-2': hoverMode !== 'append' }">
                                <p class="text-white text-sm font-medium">{{ $t('dataProvider.releaseToAdd') }}</p>
                            </div>
                        </div>
                    </button>
                    <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
                    <button @mouseover="handleHover('reset', $event)" @mouseleave="handleHover(null, $event)"
                        @dragover.prevent.stop="handleHover('reset', $event)"
                        @dragleave.prevent="handleHover(null, $event)"
                        @drop.stop.prevent="handleModeDrop('reset', $event)"
                        class="flex-1 p-8 transition-all duration-300 rounded-br-2xl relative overflow-hidden group"
                        :class="{
                            'bg-rose-500 scale-[1.03] z-10': hoverMode === 'reset',
                            'hover:bg-rose-50 dark:hover:bg-rose-900/20': hoverMode !== 'reset'
                        }">
                        <div class="absolute inset-0 bg-gradient-to-b from-rose-500/20 to-rose-500/5 opacity-0 transition-opacity duration-300"
                            :class="{ '!opacity-100': hoverMode === 'reset' }"></div>
                        <div class="absolute inset-0 border-2 border-rose-200 dark:border-rose-700 rounded-br-2xl opacity-0 transition-opacity duration-300"
                            :class="{ '!opacity-100': hoverMode !== 'reset' }"></div>
                        <div class="h-full flex flex-col items-center justify-center gap-4 relative">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-2"
                                :class="hoverMode === 'reset' ? 'bg-white/20' : 'bg-rose-50 dark:bg-rose-900/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50'">
                                <i class="pi pi-refresh text-3xl transition-all duration-300"
                                    :class="hoverMode === 'reset' ? 'text-white scale-125' : 'text-rose-500 dark:text-rose-400 group-hover:scale-110'"></i>
                            </div>
                            <div>
                                <p class="text-xl font-medium mb-3 transition-all duration-300"
                                    :class="hoverMode === 'reset' ? 'text-white' : 'text-rose-600 dark:text-rose-400'">
                                    {{ $t('dataProvider.resetAndAnalyze') }}
                                </p>
                                <p class="text-sm transition-all duration-300"
                                    :class="hoverMode === 'reset' ? 'text-white/90' : 'text-rose-500/70 dark:text-rose-400/70'">
                                    {{ $t('dataProvider.clearAndAnalyze') }}
                                </p>
                            </div>
                            <div class="absolute inset-x-0 bottom-4 text-center transition-all duration-300"
                                :class="{ 'opacity-100 translate-y-0': hoverMode === 'reset', 'opacity-0 translate-y-2': hoverMode !== 'reset' }">
                                <p class="text-white text-sm font-medium">{{ $t('dataProvider.releaseToAdd') }}</p>
                            </div>
                        </div>
                    </button>
                </div>
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
                    {{ $t('dataProvider.' + provider.name) }}
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
                <div v-show="true" class="h-full flex flex-col">
                    <!-- 标题行 -->
                    <div v-if="currentProviderName !== 'fileLog' || resources.length > 0"
                        class="px-3 py-1 text-sm font-medium bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center">
                            <div class="flex-1 flex items-center space-x-4 min-w-0">
                                <div class="w-full max-w-md">
                                    <input v-model="filterText" type="text"
                                        :placeholder="$t('search.filter_placeholder', { provider: currentProviderName })"
                                        class="w-full pl-2 pr-7 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700
                                        bg-white dark:bg-gray-800 
                                        text-gray-700 dark:text-gray-300
                                        placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-500 
                                        focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500
                                        outline-none transition-colors duration-200" />
                                </div>
                            </div>

                            <div v-if="currentProviderName === 'fileLog'" class="relative group ml-2">
                                <button
                                    class="p-1 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <i class="pi pi-plus"></i>
                                </button>
                                <!-- 下拉菜单 -->
                                <div
                                    class="absolute right-0 mt-1 w-36 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <label
                                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input type="file" @change="handleFileSelection" multiple class="hidden" />
                                        <i class="pi pi-file-plus w-4 mr-2"></i>
                                        <span>{{ $t('dataProvider.addLogFile') }}</span>
                                    </label>
                                    <label
                                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input type="file" @change="handleFolderSelection" webkitdirectory directory
                                            class="hidden" />
                                        <i class="pi pi-folder-plus w-4 mr-2"></i>
                                        <span>{{ $t('dataProvider.addFolder') }}</span>
                                    </label>
                                    <button @click="handleReset"
                                        class="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <i class="pi pi-refresh w-4 mr-2"></i>
                                        <span>{{ $t('dataProvider.reset') }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 资源列表 -->
                    <template v-if="currentProviderName !== 'fileLog' || resources.length > 0">
                        <ul v-if="filteredResources.length > 0"
                            class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                            <li v-for="resource in filteredResources" :key="resource.path" :title="resource.path"
                                @click="handleResourceClick(resource)"
                                @dblclick="handleResourceDoubleClick(resource)"
                                @mouseenter="handleResourceMouseEnter(resource)"
                                class="group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                :class="{
                                    'bg-blue-50/50 dark:bg-blue-900/20': currentResource === resource,
                                    'opacity-75': !resource.isLogFile,
                                    'bg-gray-100 dark:bg-gray-800/50': resource.status === 'pending',
                                    'bg-yellow-50 dark:bg-yellow-900/40': resource.status === 'extracting',
                                    'bg-white-50/50 dark:bg-white-900/20': resource.status === 'extracted'
                                }">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <i :class="[
                                            'pi text-base',
                                            {
                                                'pi-code': resource.isLogFile,
                                                'pi-file': !resource.isLogFile,
                                                'text-blue-500': resource.isLogFile && resource.status === 'extracted',
                                                'text-gray-400': !resource.isLogFile && resource.status === 'extracted',
                                                'text-gray-500': resource.status === 'pending',
                                                'text-yellow-500': resource.status === 'extracting'
                                            }
                                        ]"></i>
                                    </div>
                                    <div class="flex-1 min-w-0 group hover:cursor-pointer">
                                        <div class="flex items-center justify-between">
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                                                    :class="{ 'font-normal': !resource.isLogFile }">
                                                    <HighlightText :text="resource.name" :highlight="filterText" />
                                                </p>
                                                <p class="mt-1 text-xs text-gray-500 truncate overflow-hidden flex-1 min-w-0 group-hover:whitespace-normal group-hover:break-words group-hover:overflow-visible">
                                                    <span class="font-bold pr-1" :style="{ color: hashColorLineIndex(resource.path) }">{{ '#' + resource.id}}</span>
                                                    <span v-html="resource.desc"></span>
                                                </p>
                                            </div>
                                            <div class="ml-2 flex-shrink-0 flex items-center space-x-2">
                                                <span class="text-xs text-gray-500">{{ resource.getDisplayStatus() }}</span>
                                                <i v-if="resource.status === 'pending'"
                                                    class="pi pi-clock text-gray-500 text-sm"
                                                    :title="$t('data.waiting')"></i>
                                                <i v-else-if="resource.status === 'extracting'"
                                                    class="pi pi-spin pi-spinner text-yellow-500 text-sm"
                                                    :title="$t('data.processing')"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            {{ $t('dataProvider.noLogs') }}
                        </div>
                    </template>

                    <!-- 选择文件模式 -->
                    <div v-else class="flex-1 flex items-center justify-center">
                        <div class="text-center">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {{ $t('dataProvider.dragFilesHere') }}
                            </p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">
                                {{ $t('dataProvider.supportedFormats') }}
                            </p>
                            <div class="flex justify-center space-x-4">
                                <label class="px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                    border border-gray-200 dark:border-gray-700
                                    text-gray-600 dark:text-gray-300
                                    flex items-center">
                                    <input type="file" @change="handleFileSelection" multiple class="hidden" />
                                    <i class="pi pi-file-alt mr-2"></i>
                                    {{ $t('dataProvider.selectFile') }}
                                </label>
                                <label class="px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                    border border-gray-200 dark:border-gray-700
                                    text-gray-600 dark:text-gray-300
                                    flex items-center">
                                    <input type="file" @change="handleFolderSelection" webkitdirectory directory
                                        class="hidden" />
                                    <i class="pi pi-folder mr-2"></i>
                                    {{ $t('dataProvider.selectFolder') }}
                                </label>
                            </div>
                            <div class="mt-8"><a
                                    href="https://nhwc-app.oss-cn-hangzhou.aliyuncs.com/logdog/logdog_sample_data.zip"
                                    class="text-blue-500" target="_blank">{{ $t('dataProvider.downloadSampleData') }}</a>
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
import type { LogFile } from '@/modules/base';
import { hashColor } from '@/utils/colors';

export default defineComponent({
    components: {
        HighlightText
    },
    data() {
        const providers = proxyProvider.availableProviders();
        return {
            isDragging: false,
            currentResource: null as LogFile | null,
            filterText: '',
            providers,
            currentProviderName: providers[0].name,
            dragCounter: 0,
            resources: [] as LogFile[],
            dropMode: 'append', 
            hoverMode: null as 'append' | 'reset' | null, 
        };
    },
    computed: {
        filteredResources(): LogFile[] {
            if (!this.filterText) {
                return this.resources;
            }

            const searchText = this.filterText.toLowerCase();
            let fileIndex = 0;
            return this.resources.filter(resource => {
                resource.id = fileIndex++
                return resource.path.toLowerCase().includes(searchText)
            });
        }
    },
    methods: {
        hashColorLineIndex(filename: string) {
            return hashColor(filename, 80, 35);
        },
        async handleResourceClick(resource: LogFile) {
            console.log('handleResourceClick', resource);
            if (this.currentResource === resource) {
                return;
            }
            this.currentResource = resource;
            await proxyProvider.useResource(resource);
            this.$emit('fileLoaded', resource);
            this.$emit('resourceClick', resource);
        },
        setActiveProvider(name: string) {
            if (this.currentProviderName === name) return;
            this.currentProviderName = name;
            proxyProvider.setProvider(name);
            this.currentResource = null;
            this.filterText = '';

            // this.resources = proxyProvider.getResources();


            const newResources = proxyProvider.getResources();
            this.resources.length = 0;
            this.resources.push(...newResources);

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
        async processEntry(entry: FileSystemEntry, processedFiles: File[], basePath: string = ''): Promise<void> {
            const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (entry.isFile) {
                // 如果是文件，将其转换为 File 对象并添加到 processedFiles 中
                const file = await new Promise<File>((resolve, reject) => {
                    (entry as FileSystemFileEntry).file(resolve, reject);
                });
                // 创建一个新的File对象，保留原始路径信息
                const fileWithPath = Object.defineProperty(file, 'path', {
                    value: currentPath,
                    writable: false
                });
                processedFiles.push(fileWithPath);
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
                        await this.processEntry(innerEntry, processedFiles, currentPath);
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
            this.isDragging = false;
            this.dragCounter = 0;

            const items = event.dataTransfer?.items;
            if (!items) return;

            const processedFiles: File[] = [];
            const promises = Array.from(items).map((item) => {
                if (item.kind === 'file') {
                    const entry = (item as unknown as { webkitGetAsEntry: () => FileSystemEntry }).webkitGetAsEntry();
                    if (entry) {
                        // 从根路径开始处理
                        return this.processEntry(entry, processedFiles, '');
                    }
                }
            });
            await Promise.all(promises);

            if (processedFiles.length > 0) {
                await this.processFiles(processedFiles);
            }
        },
        async handleFileSelection(event: Event) {
            const input = event.target as HTMLInputElement;
            if (input.files && input.files.length > 0) {
                const files = Array.from(input.files).map(file => {
                    return Object.defineProperty(file, 'path', {
                        value: file.name,
                        writable: false
                    });
                });
                await this.processFiles(files);
            }
        },
        async handleFolderSelection(event: Event) {
            const input = event.target as HTMLInputElement;
            if (input.files && input.files.length > 0) {
                const files = Array.from(input.files).map(file => {
                    // webkitRelativePath 包含了相对于选择文件夹的路径
                    const path = file.webkitRelativePath || file.name;
                    return Object.defineProperty(file, 'path', {
                        value: path,
                        writable: false
                    });
                });
                await this.processFiles(files);
            }
        },
        async processFiles(selectedFiles: File[]) {
            await proxyProvider.setup(selectedFiles, false);
            this.$emit('fileLoaded', null);

            if (this.resources.length > 0) {
                await this.handleResourceClick(this.resources[0]);
            }
        },
        handleReset() {
            window.location.reload();
        },
        async handleModeDrop(mode: 'append' | 'reset', event: DragEvent) {
            event.preventDefault();
            this.isDragging = false;
            this.dragCounter = 0;
            this.hoverMode = null;

            const items = event.dataTransfer?.items;
            if (!items) return;

            const processedFiles: File[] = [];
            const promises = Array.from(items).map((item) => {
                if (item.kind === 'file') {
                    const entry = (item as unknown as { webkitGetAsEntry: () => FileSystemEntry }).webkitGetAsEntry();
                    if (entry) {
                        return this.processEntry(entry, processedFiles);
                    }
                }
                return Promise.resolve();
            });

            await Promise.all(promises);
            await proxyProvider.setup(processedFiles, mode === 'reset');
            this.$emit('fileLoaded', null);

            if (this.resources.length > 0) {
                await this.handleResourceClick(this.resources[0]);
            }
        },
        handleHover(mode: 'append' | 'reset' | null, event: Event) {
            // 检查事件目标是否在按钮内
            const target = event.target as HTMLElement;
            const button = target.closest('button');
            if (!button) return;

            // 如果是dragleave事件，检查是否真的离开了按钮
            if (event.type === 'dragleave') {
                const rect = button.getBoundingClientRect();
                const mouseEvent = event as MouseEvent;
                if (
                    mouseEvent.clientX >= rect.left &&
                    mouseEvent.clientX <= rect.right &&
                    mouseEvent.clientY >= rect.top &&
                    mouseEvent.clientY <= rect.bottom
                ) {
                    return;
                }
            }

            this.hoverMode = mode;
        },

        handleMainDragOver(event: DragEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest('button')) {
                this.hoverMode = null;
            }
        },

        handleMainDragLeave(event: DragEvent) {
            // 检查是否真的离开了整个拖拽区域
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            if (
                event.clientX <= rect.left ||
                event.clientX >= rect.right ||
                event.clientY <= rect.top ||
                event.clientY >= rect.bottom
            ) {
                this.hoverMode = null;
            }
        },

        handleResourceDoubleClick(resource: LogFile) {
            // 双击资源的处理逻辑（留空）
        },
        
        handleResourceMouseEnter(resource: LogFile) {
            // 鼠标进入资源项时立即显示title（留空）
        },
    },
    mounted() {
        window.addEventListener('dragenter', this.handleDragEnter);
        window.addEventListener('dragover', this.handleDragOver);
        window.addEventListener('dragleave', this.handleDragLeave);
        window.addEventListener('drop', this.handleDrop);

        proxyProvider.subscribe({
            onChange: () => {
                const newResources = proxyProvider.getResources();
                this.resources.length = 0;
                this.resources.push(...newResources);

                for (let i = 0; i < this.resources.length; i++) {
                    this.resources[i].id = i + 1;
                }
            }
        });
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
