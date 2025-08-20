<!-- DataProvider.vue -->
<template>
    <div class="file-input-container h-full w-full relative flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
        @dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop.prevent="handleDrop">
        <!-- 拖拽覆盖层 -->
        <div v-if="isDragging || filesReceived"
            class="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
            @drop.prevent.stop="handleDrop">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 overflow-hidden h-full transition-all duration-300"
                :style="overlayMainStyle"
                :class="{
                    'border-dashed border-blue-300 dark:border-blue-600': !filesReceived && !isDragHovering,
                    'border-dashed border-blue-500 dark:border-blue-400 border-4 shadow-blue-500/25 scale-105': !filesReceived && isDragHovering,
                    'border-solid border-gray-200 dark:border-gray-700': filesReceived
                }">
                
                <!-- 拖拽分析状态 -->
                <div v-if="!filesReceived" class="flex flex-col h-full">
                    <!-- 头部 -->
                    <div class="p-8 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-center">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                                <i class="pi pi-cloud-download text-2xl text-blue-500 dark:text-blue-400"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ $t('dataProvider.prepareForAnalysis') }}
                                </h3>
                                <p class="text-gray-600 dark:text-gray-400">
                                    {{ $t('dataProvider.dragFilesHereToStart') }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-1">
                        <!-- 左侧：拖拽分析区域 -->
                        <div class="flex-1 p-8 flex flex-col items-center justify-center transition-all duration-300"
                            :class="{
                                'transform scale-105': isDragHovering,
                                'transform scale-100': !isDragHovering
                            }">
                            <div class="text-center">
                                <div class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300"
                                    :class="{
                                        'bg-blue-100 dark:bg-blue-900/30': !isDragHovering,
                                        'bg-blue-500 dark:bg-blue-600 animate-bounce': isDragHovering
                                    }">
                                    <i class="text-4xl transition-all duration-300"
                                        :class="{
                                            'pi pi-upload text-blue-500 dark:text-blue-400': !isDragHovering,
                                            'pi pi-check text-white animate-pulse': isDragHovering
                                        }"></i>
                                </div>
                                <div class="w-20 h-1 rounded mx-auto mb-6 transition-all duration-300"
                                    :class="{
                                        'bg-blue-200 dark:bg-blue-700': !isDragHovering,
                                        'bg-blue-500 dark:bg-blue-400': isDragHovering
                                    }">
                                    <div class="w-full h-full rounded transition-all duration-300"
                                        :class="{
                                            'bg-blue-500 animate-pulse': !isDragHovering,
                                            'bg-blue-300 animate-none': isDragHovering
                                        }"></div>
                                </div>
                                <h4 class="text-xl font-semibold mb-3 transition-all duration-300"
                                    :class="{
                                        'text-gray-800 dark:text-gray-200': !isDragHovering,
                                        'text-blue-600 dark:text-blue-400': isDragHovering
                                    }">
                                    {{ isDragHovering ? $t('dataProvider.aboutToStartAnalysis') : $t('dataProvider.dragFilesHereAction') }}
                                </h4>
                                <p class="text-base mb-2 transition-all duration-300"
                                    :class="{
                                        'text-gray-600 dark:text-gray-400': !isDragHovering,
                                        'text-blue-500 dark:text-blue-300': isDragHovering
                                    }">
                                    {{ isDragHovering ? $t('dataProvider.releaseToStartImmediately') : $t('dataProvider.releaseToStartAnalysis') }}
                                </p>
                            </div>
                        </div>

                        <!-- 右侧：支持格式说明 -->
                        <div class="w-80 p-8 border-l border-gray-200 dark:border-gray-700">
                            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                {{ $t('dataProvider.supportedFileFormats') }}
                            </h4>
                            <div class="space-y-3">
                                <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i class="pi pi-file text-blue-500 dark:text-blue-400 mr-3"></i>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('dataProvider.logFiles') }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('dataProvider.standardLogFormat') }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i class="pi pi-file-o text-green-500 dark:text-green-400 mr-3"></i>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('dataProvider.textFiles') }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('dataProvider.plainTextLogs') }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i class="pi pi-file-archive text-purple-500 dark:text-purple-400 mr-3"></i>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('dataProvider.zipArchives') }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('dataProvider.zipCompression') }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i class="pi pi-file-archive text-orange-500 dark:text-orange-400 mr-3"></i>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('dataProvider.gzipArchives') }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('dataProvider.gzipCompression') }}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p class="text-sm text-blue-700 dark:text-blue-300">
                                    <i class="pi pi-info-circle mr-2"></i>
                                    {{ $t('dataProvider.supportMultipleFiles') }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 文件准备完成状态 -->
                <div v-else class="flex flex-col h-full relative">
                    <!-- 右上角关闭按钮 -->
                    <button @click="cancelModeSelection"
                        class="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200">
                        <i class="pi pi-times text-gray-600 dark:text-gray-400"></i>
                    </button>

                    <!-- 头部 -->
                    <div class="p-8 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-center">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                                <i class="pi pi-check text-2xl text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {{ $t('dataProvider.filesReady') }}
                                </h3>
                                <p class="text-gray-600 dark:text-gray-400">
                                    {{ $t('dataProvider.filesLoaded', { count: pendingFiles.length }) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 文件列表区域 -->
                    <div class="flex-1 p-6 overflow-hidden">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{{ $t('dataProvider.pendingFiles') }}</h4>
                        <div class="h-full max-h-64 overflow-y-auto">
                            <div class="space-y-2">
                                <div v-for="(file, index) in pendingFiles.slice(0, 12)" :key="index"
                                    class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <i class="pi pi-file text-blue-500 dark:text-blue-400 mr-3"></i>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {{ file.name }}
                                        </p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">
                                            {{ formatFileSize(file.size) }}
                                        </p>
                                    </div>
                                </div>
                                <div v-if="pendingFiles.length > 12" 
                                    class="text-center py-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                                    {{ $t('dataProvider.moreFiles', { count: pendingFiles.length - 12 }) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 底部操作区域 -->
                    <div class="p-6 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex flex-col space-y-4">
                            <!-- 开始分析按钮 -->
                            <button @click="startAnalysis"
                                class="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center">
                                <i class="pi pi-play mr-2 text-lg"></i>
                                {{ $t('dataProvider.startAnalysis') }}
                            </button>
                            
                            <!-- 模式选择 -->
                            <label class="flex items-center justify-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    v-model="isAppendMode"
                                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                >
                                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {{ $t('dataProvider.appendToExistingLogs') }}
                                </span>
                            </label>
                        </div>
                    </div>
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
import HighlightText from './HighlightText';
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
            isDragHovering: false, // 新增：是否正在拖拽悬停
            currentResource: null as LogFile | null,
            filterText: '',
            providers,
            currentProviderName: providers[0].name,
            dragCounter: 0,
            resources: [] as LogFile[],
            dropMode: 'append', 
            hoverMode: null as 'append' | 'reset' | null,
            // 文件处理相关
            pendingFiles: [] as File[],
            showModeSelector: false,
            filesReceived: false,
            isAppendMode: true, // 默认为追加模式
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
        },
        // 计算浮窗位置样式
        overlayMainStyle() {
            return {
                position: 'fixed' as const,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '800px',
                height: '500px',
                maxWidth: '90vw',
                maxHeight: '80vh'
            };
        }
    },
    methods: {
        hashColorLineIndex(filename: string) {
            return hashColor(filename, 80, 35);
        },
        formatFileSize(bytes: number): string {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
            
            // 如果是第一次进入拖拽状态
            if (!this.isDragging) {
                this.isDragging = true;
            }
            
            // 检查是否在拖拽区域内
            if (event.target && !this.filesReceived) {
                this.isDragHovering = true;
            }
        },
        handleDragOver(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
            
            // 保持悬停状态
            if (!this.filesReceived) {
                this.isDragHovering = true;
            }
        },
        handleDragLeave(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
            this.dragCounter--;
            
            if (this.dragCounter === 0 && !this.filesReceived) {
                this.isDragging = false;
                this.isDragHovering = false;
                this.hoverMode = null;
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
            this.isDragHovering = false; // 重置悬停状态
            this.dragCounter = 0;
            this.hoverMode = null;

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
                this.pendingFiles = processedFiles;
                this.filesReceived = true;
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
                this.pendingFiles = files;
                // 按钮选择的文件直接以追加模式处理，不显示模态窗口
                await this.processPendingFiles('append');
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
                this.pendingFiles = files;
                // 按钮选择的文件夹直接以追加模式处理，不显示模态窗口
                await this.processPendingFiles('append');
            }
        },
        async handlePaste(event: ClipboardEvent) {
            // 只在没有焦点在输入框时处理粘贴
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }

            event.preventDefault();
            
            const items = event.clipboardData?.items;
            if (!items) return;

            const files: File[] = [];
            let hasText = false;
            let possibleFolders = 0;
            
            // 检查剪贴板中的内容
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        // 实测没有类型可能是文件夹，而粘贴模式读不到文件夹的内容
                        if (file.type === '') {
                            possibleFolders++;
                            console.warn(this.$t('dataProvider.pasteFolderWarning'));
                            continue;
                        }
                        
                        // 为文件添加path属性
                        Object.defineProperty(file, 'path', {
                            value: file.name,
                            writable: false
                        });
                        files.push(file);
                    }
                } else if (item.kind === 'string' && item.type === 'text/plain') {
                    hasText = true;
                }
            }

            if (files.length > 0) {
                this.pendingFiles = files;
                // 粘贴的文件显示模态窗口，让用户选择处理方式（类似拖拽）
                this.filesReceived = true;
                console.info(this.$t('dataProvider.pasteFilesDetected') + `: ${files.length}`);
            } else if (possibleFolders > 0) {
                // 只检测到可能的文件夹
                console.warn(this.$t('dataProvider.pasteFolderWarning'));
            } else if (hasText) {
                // 如果只有文本内容，可能是文件路径，给用户提示
                console.info(this.$t('dataProvider.pasteOnlyText'));
            } else {
                // 没有检测到有效文件
                console.info(this.$t('dataProvider.pasteNoFiles'));
            }
        },
        startAnalysis() {
            const mode = this.isAppendMode ? 'append' : 'reset';
            this.processPendingFiles(mode);
        },
        async processPendingFiles(mode: 'append' | 'reset') {
            this.filesReceived = false;
            if (this.pendingFiles.length > 0) {
                await proxyProvider.setup(this.pendingFiles, mode === 'reset');
                this.$emit('fileLoaded', null);

                if (this.resources.length > 0) {
                    await this.handleResourceClick(this.resources[0]);
                }
            }
            this.pendingFiles = [];
        },
        cancelModeSelection() {
            this.filesReceived = false;
            this.isDragHovering = false; // 重置悬停状态
            this.pendingFiles = [];
        },
        handleReset() {
            window.location.reload();
        },

        handleResourceDoubleClick(_resource: LogFile) {
            // 双击资源的处理逻辑（留空）
        },
        
        handleResourceMouseEnter(_resource: LogFile) {
            // 鼠标进入资源项时立即显示title（留空）
        },
    },
    mounted() {
        window.addEventListener('dragenter', this.handleDragEnter);
        window.addEventListener('dragover', this.handleDragOver);
        window.addEventListener('dragleave', this.handleDragLeave);
        window.addEventListener('drop', this.handleDrop);
        window.addEventListener('paste', this.handlePaste);

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
        window.removeEventListener('paste', this.handlePaste);
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
