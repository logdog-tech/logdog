<template>
    <div class="space-y-3">
        <!-- 搜索框和添加按钮的水平布局 -->
        <div class="flex items-center gap-2">
            <!-- 搜索框 -->
            <div class="relative flex-1">
                <InputText 
                    v-model="searchQuery"
                    :placeholder="$t('ruleList.searchPlaceholder')"
                    @input="handleSearch"
                    class="w-full"
                    size="small"
                />
                <div class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <!-- 添加按钮 -->
            <PrimeButton 
                v-if="!showEditor"
                :label="$t('ruleList.addButtonText')"
                @click="handleAddRule"
                icon="pi pi-plus"
                size="small"
                class="flex-shrink-0"
            />
        </div>

        <!-- 规则列表 -->
        <div class="space-y-2">
            <div 
                v-for="(item, index) in filteredItems" 
                :key="index"
                class="relative p-4 rounded-lg
                       shadow-sm
                       border border-gray-100 dark:border-gray-700
                       transition-all duration-200
                       cursor-pointer
                       group"
                :class="{
                    'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50': !item._checked,
                    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800': item._checked
                }"
                @click="toggleCheck(item)"
            >
                <!-- 左侧选中指示器 -->
                <div 
                    class="absolute left-0 top-0 bottom-0 w-1.5
                           transition-all duration-200"
                    :class="{
                        'bg-blue-500 dark:bg-blue-400': item._checked,
                        'opacity-0 group-hover:opacity-100 bg-gray-300 dark:bg-gray-600': !item._checked
                    }"
                ></div>

                <!-- 规则头部 -->
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2 flex-1">
                        <!-- 标题显示/编辑 -->
                        <div class="flex-1" v-if="!item._is_editing">
                            <h3 class="font-medium text-gray-900 dark:text-gray-100">
                                {{ getItemTitle(item) }}
                            </h3>
                        </div>
                        <input 
                            v-else
                            v-model="editingItem!.rule_name"
                            @keyup.enter="handleSave"
                            @keyup.esc="cancelEdit"
                            :placeholder="$t('ruleList.placeholderName')"
                            ref="titleInput"
                            class="flex-1 px-2 py-1 text-sm rounded border dark:border-gray-600
                                   bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                   focus:border-transparent outline-none"
                            @click.stop
                        >
                        <span 
                            v-if="item.is_public && !item._is_editing"
                            class="px-2 py-0.5 text-xs rounded-full 
                                   bg-blue-50 dark:bg-blue-900/30 
                                   text-blue-600 dark:text-blue-400"
                        >
                            {{ $t('ruleList.readOnly') }}
                        </span>
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="flex items-center space-x-2">
                        <!-- 放大按钮 -->
                        <button 
                            v-if="item._is_editing"
                            @click.stop="openExpandedEdit"
                            class="p-1.5 rounded-md text-gray-400 hover:text-blue-500 
                                   hover:bg-gray-100 dark:hover:bg-gray-700
                                   transition duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                        <!-- 其他按钮 -->
                        <div v-if="!item._is_editing && canEdit(item)">
                            <button 
                                class="p-1.5 rounded-md text-gray-400 hover:text-blue-500 
                                       hover:bg-gray-100 dark:hover:bg-gray-700
                                       transition duration-200"
                                @click.stop="startEdit(item)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button 
                                class="p-1.5 rounded-md text-gray-400 hover:text-red-500 
                                       hover:bg-gray-100 dark:hover:bg-gray-700
                                       transition duration-200"
                                @click.stop="handleDelete(item)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 规则内容 -->
                <div class="space-y-2 editing-area">
                    <!-- 颜色预览 -->
                    <div v-if="type === 'color'" class="flex items-center space-x-2">
                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ $t('ruleList.preview') }}：</div>
                        <div 
                            class="px-3 py-1 rounded text-sm"
                            :style="{
                                color: item._is_editing ? editingItem!.fg_color : item.fg_color,
                                backgroundColor: item._is_editing ? editingItem!.bg_color : item.bg_color
                            }"
                        >
                            {{ $t('ruleList.exampleText') }}
                        </div>
                    </div>

                    <!-- 编辑表单 -->
                    <div v-if="item._is_editing" class="space-y-2">
                        <!-- 匹配框 -->
                        <input 
                            v-if="type !== 'function'"
                            v-model="editingItem!.pattern"
                            :placeholder="$t('ruleList.placeholderMatchPattern')"
                            class="w-full px-2 py-1 text-sm rounded border dark:border-gray-600
                                   bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                   focus:border-transparent outline-none"
                        >
                        
                        <!-- 函数代码编辑器 -->
                        <textarea 
                            v-if="type === 'function'"
                            v-model="editingItem!.custom_function"
                            :placeholder="$t('ruleList.placeholderFunctionCode')"
                            rows="14"
                            class="w-full px-2 py-1 text-sm rounded border dark:border-gray-600
                                   bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                   focus:border-transparent outline-none
                                   font-mono"
                        ></textarea>

                        <!-- 描述编辑器 -->
                        <textarea 
                            v-model="editingItem!.rule_desc"
                            :placeholder="$t('ruleList.placeholderDescription')"
                            rows="2"
                            class="w-full px-2 py-1 text-sm rounded border dark:border-gray-600
                                   bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                   focus:border-transparent outline-none"
                        ></textarea>

                        <!-- 颜色选择按钮 -->
                        <div v-if="type === 'color'" class="flex items-center space-x-2">
                            <button
                                v-for="(scheme, index) in colorSchemes.slice(0, 5)"
                                :key="index"
                                class="px-2 py-1 rounded hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all"
                                :class="{'ring-2 ring-blue-500 dark:ring-blue-400': isSelectedScheme(scheme)}"
                                :style="{
                                    color: scheme.fg,
                                    backgroundColor: scheme.bg
                                }"
                                @click="applyColorScheme(scheme)"
                            >
                                T
                            </button>
                            <button
                                @click="regenerateColorSchemes"
                                class="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                       hover:bg-gray-100 dark:hover:bg-gray-700
                                       transition-all duration-200"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        <!-- 标签编辑 -->
                        <div class="space-y-1">
                            <label class="text-sm text-gray-700 dark:text-gray-300">{{ $t('ruleList.label') }}</label>
                            <div class="flex flex-wrap gap-1 p-2 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[38px]">
                                <!-- 现有标签 -->
                                <div 
                                    v-for="(tag, tagIndex) in editingItem!.tags?.split(',') || []" 
                                    :key="tagIndex"
                                    class="inline-flex items-center px-2 py-0.5 rounded-full 
                                           bg-gray-100 dark:bg-gray-600
                                           text-sm text-gray-600 dark:text-gray-300"
                                >
                                    {{ tag }}
                                    <button 
                                        @click="removeTag(tagIndex)"
                                        class="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <!-- 添加新标签的输入框 -->
                                <input 
                                    v-model="newTag"
                                    @keyup.enter="addTag"
                                    @keyup.backspace="handleBackspace"
                                    :placeholder="$t('ruleList.placeholderTag')"
                                    class="flex-1 min-w-[120px] bg-transparent border-none outline-none 
                                           text-sm text-gray-900 dark:text-gray-100
                                           placeholder-gray-400 dark:placeholder-gray-500"
                                >
                            </div>
                        </div>

                        <!-- 底部操作栏 -->
                        <div class="flex justify-between items-center pt-2">
                            <!-- 公开开关 -->
                            <div class="flex items-center space-x-2">
                                <input 
                                    type="checkbox"
                                    id="is_public"
                                    v-model="editingItem!.is_public"
                                    class="w-4 h-4 rounded border-gray-300 text-blue-500 
                                           focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                <label 
                                    for="is_public"
                                    class="text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {{ $t('ruleList.public') }}
                                </label>
                            </div>

                            <!-- 操作按钮 -->
                            <div class="flex space-x-2">
                                <button 
                                    @click.stop="cancelEdit"
                                    class="px-3 py-1 text-sm rounded-md
                                           text-gray-600 dark:text-gray-400
                                           hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {{ $t('ruleList.cancel') }}
                                </button>
                                <button 
                                    @click.stop="handleSave"
                                    class="px-3 py-1 text-sm rounded-md
                                           bg-blue-500 hover:bg-blue-600
                                           text-white"
                                >
                                    {{ $t('ruleList.save') }}
                                </button>
                            </div>
                        </div>
                    </div>


                    <!-- 在内容区域底部添加一个新的底栏 -->
                    <div class="flex items-center justify-between mt-2" v-if="!item._is_editing">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ getItemDescription(item) }}
                        </div>
                        <!-- 右侧放置开关控件 -->
                        <button
                            class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full 
                                   transition-colors duration-200 ease-in-out"
                            :class="[item._checked ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-600']"
                            @click.stop="toggleCheck(item)"
                            role="switch"
                            :aria-checked="item._checked"
                        >
                            <span
                                class="pointer-events-none relative inline-block h-4 w-4 transform rounded-full 
                                       bg-white shadow ring-0 transition duration-200 ease-in-out"
                                :class="[
                                    item._checked ? 'translate-x-4' : 'translate-x-0.5',
                                    'translate-y-0.5'
                                ]"
                            ></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加模态框组件 -->
        <Teleport to="body">
            <div v-if="showExpandedEditor" 
                class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                @click="closeExpandedEdit"
            >
                <div 
                    class="bg-white dark:bg-gray-800 rounded-lg w-[800px] h-[80vh] flex flex-col"
                    @click.stop
                >
                    <!-- 内容区域 -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-4">
                        <!-- 模态框标题 -->
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-medium text-gray-900 dark:text-gray-100">
                                {{ $t('ruleList.editRule', { typeLabel }) }}
                            </h2>
                            <button 
                                @click="closeExpandedEdit"
                                class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 
                                       hover:bg-gray-100 dark:hover:bg-gray-700
                                       transition duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- 编辑表单 -->
                        <div class="space-y-4">
                            <!-- 名称 -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {{ $t('ruleList.name') }}
                                </label>
                                <input 
                                    v-model="expandedContent.rule_name"
                                    :placeholder="$t('ruleList.placeholderName')"
                                    class="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                           bg-white dark:bg-gray-700 
                                           text-gray-900 dark:text-gray-100
                                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                           focus:border-transparent outline-none"
                                >
                            </div>

                            <!-- 匹配模式 -->
                            <div v-if="type !== 'function'">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {{ $t('ruleList.matchPattern') }}
                                </label>
                                <input 
                                    v-model="expandedContent.pattern"
                                    :placeholder="$t('ruleList.placeholderMatchPattern')"
                                    class="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                           bg-white dark:bg-gray-700 
                                           text-gray-900 dark:text-gray-100
                                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                           focus:border-transparent outline-none"
                                >
                            </div>

                            <!-- 函数代码 -->
                            <div v-if="type === 'function'">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {{ $t('ruleList.functionCode') }}
                                </label>
                                <textarea 
                                    v-model="expandedContent.custom_function"
                                    :placeholder="$t('ruleList.placeholderFunctionCode')"
                                    rows="12"
                                    class="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                           bg-white dark:bg-gray-700 
                                           text-gray-900 dark:text-gray-100
                                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                           focus:border-transparent outline-none
                                           font-mono"
                                ></textarea>
                            </div>

                            <!-- 描述 -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {{ $t('ruleList.description') }}
                                </label>
                                <textarea 
                                    v-model="expandedContent.rule_desc"
                                    :placeholder="$t('ruleList.placeholderDescription')"
                                    rows="3"
                                    class="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                           bg-white dark:bg-gray-700 
                                           text-gray-900 dark:text-gray-100
                                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                           focus:border-transparent outline-none"
                                ></textarea>
                            </div>

                            <!-- 颜色预览和选择器 -->
                            <div v-if="type === 'color'" class="space-y-2">
                                <!-- 预览 -->
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {{ $t('ruleList.preview') }}
                                    </label>
                                    <div 
                                        class="px-3 py-1.5 rounded text-sm"
                                        :style="{
                                            color: expandedContent.fg_color,
                                            backgroundColor: expandedContent.bg_color
                                        }"
                                    >
                                        {{ $t('ruleList.exampleText') }}
                                    </div>
                                </div>

                                <!-- 颜色选择器 -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {{ $t('ruleList.colorScheme') }}
                                    </label>
                                    <div class="flex items-center space-x-2">
                                        <button
                                            v-for="(scheme, index) in colorSchemes"
                                            :key="index"
                                            class="px-3 py-1.5 rounded-lg hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all"
                                            :class="{'ring-2 ring-blue-500 dark:ring-blue-400': isExpandedSelectedScheme(scheme)}"
                                            :style="{
                                                color: scheme.fg,
                                                backgroundColor: scheme.bg
                                            }"
                                            @click="applyExpandedColorScheme(scheme)"
                                        >
                                            {{ $t('ruleList.exampleText') }}
                                        </button>
                                        <button
                                            @click="regenerateColorSchemes"
                                            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                                   hover:bg-gray-100 dark:hover:bg-gray-700
                                                   transition-all duration-200"
                                        >
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- 标签 -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {{ $t('ruleList.label') }}
                                </label>
                                <div class="flex flex-wrap gap-2 p-3 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[48px]">
                                    <div 
                                        v-for="(tag, tagIndex) in expandedContent.tags" 
                                        :key="tagIndex"
                                        class="inline-flex items-center px-3 py-1 rounded-full 
                                               bg-gray-100 dark:bg-gray-600
                                               text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {{ tag }}
                                        <button 
                                            @click="removeTag(tagIndex)"
                                            class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <input 
                                        v-model="newTag"
                                        @keyup.enter="addTag"
                                        :placeholder="$t('ruleList.placeholderTag')"
                                        class="flex-1 min-w-[120px] bg-transparent border-none outline-none 
                                               text-sm text-gray-900 dark:text-gray-100
                                               placeholder-gray-400 dark:placeholder-gray-500"
                                    >
                                </div>
                            </div>

                            <!-- 公开开关 -->
                            <div class="flex items-center space-x-2">
                                <input 
                                    type="checkbox"
                                    id="expanded_is_public"
                                    v-model="expandedContent.is_public"
                                    class="w-4 h-4 rounded border-gray-300 text-blue-500 
                                           focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                <label 
                                    for="expanded_is_public"
                                    class="text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {{ $t('ruleList.public') }}
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 固定在底部的按钮 -->
                    <div class="flex justify-end space-x-3 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                        <button 
                            @click="closeExpandedEdit"
                            class="px-4 py-2 rounded-lg text-sm
                                   text-gray-600 dark:text-gray-400
                                   hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {{ $t('ruleList.cancel') }}
                        </button>
                        <button 
                            @click="handleExpandedSave"
                            class="px-4 py-2 rounded-lg text-sm
                                   bg-blue-500 hover:bg-blue-600
                                   text-white"
                        >
                            {{ $t('ruleList.save') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Rule, User, Workspace } from '@/modules/base';
import { generateColorSchemes, type ColorScheme } from '@/utils/colors';
import { ruleTableHelper } from '@/utils/db';
import { ruleApi } from '@/api';
import { useToast } from 'primevue/usetoast';
import { settingsTableHelper, ruleStatusTableHelper } from '@/utils/db';
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const defaultFunctionCode = `// 对日志进行预处理
return function(
  file, // 文件名
  line, // 行号
  log   // 日志内容
) {
  // 在这里对日志做各种处理
  // 例如：增加文件名
  log = file + " " + log;

  // 返回处理后的日志
  return log;
}`

export default {
    name: 'RuleList',
    components: {
        InputText,
        "PrimeButton": Button
    },
    props: {
        currentUser: {
            type: Object as PropType<User>,
            required: false,
            default: null
        },
        workspace: {
            type: Object as PropType<Workspace>,
            required: true
        },
        items: {
            type: Array as PropType<Rule[]>,
            required: true
        },
        type: {
            type: String as PropType<'filter' | 'color' | 'function'>,
            required: true
        }
    },
    data() {
        return {
            localItems: [] as Rule[],
            editingItem: this.createEmptyItem(),
            newTag: '',
            colorSchemes: generateColorSchemes(),
            showExpandedEditor: false,
            expandedContent: {} as Rule,
            titleInputRef: null as HTMLInputElement | null,
            defaultFunctionCode: defaultFunctionCode,
            searchQuery: '', // 添加搜索查询字段
            searchDebounce: null as number | null // 添加防抖定时器
        }
    },
    computed: {
        typeLabel(): string {
            const labels = {
                filter: this.$t('ruleList.filter'),
                color: this.$t('ruleList.color'),
                function: this.$t('ruleList.function')
            };
            return labels[this.type];
        },
        showEditor(): boolean {
            let yes = false;
            for (const i of this.localItems) {
                if (i._is_editing) {
                    yes = true;
                    break;
                }
            }
            return yes;
        },
        // 添加过滤后的规则列表
        filteredItems(): Rule[] {
            if (!this.searchQuery) {
                return this.localItems;
            }
            
            const query = this.searchQuery.toLowerCase();
            return this.localItems.filter(item => {
                // 搜索规则名称
                if (item.rule_name && item.rule_name.toLowerCase().includes(query)) {
                    return true;
                }
                
                // 搜索规则描述
                if (item.rule_desc && item.rule_desc.toLowerCase().includes(query)) {
                    return true;
                }
                
                // 搜索匹配模式（对于过滤器和颜色规则）
                if (this.type !== 'function' && item.pattern && item.pattern.toLowerCase().includes(query)) {
                    return true;
                }
                
                // 搜索标签
                if (item.tags && item.tags.toLowerCase().includes(query)) {
                    return true;
                }
                
                return false;
            });
        }
    },
    watch: {
        items: {
            immediate: true,
            handler(newItems) {
                this.localItems = newItems;
            }
        }
    },
    beforeUnmount() {
        // 清理防抖定时器
        if (this.searchDebounce) {
            clearTimeout(this.searchDebounce);
        }
    },
    setup() {
        const toast = useToast()
        return { toast }
    },
    methods: {
        emitUpdate() {
            this.$emit('update:items', this.type, this.localItems);
        },
        emitUserToggleItems(item: Rule) {
            this.$emit('userToggleItems', this.type, item);
        },
        getItemTitle(item: Rule): string {
            if (item.rule_name) return item.rule_name;
            return `${this.$t('ruleList.unnamed')}${this.typeLabel}`;
        },
        getItemDescription(item: Rule): string {
            if (this.type === 'filter') {
                return item.rule_desc || item.pattern || this.$t('ruleList.editMatchPattern');
            }
            if (this.type === 'color') {
                return item.rule_desc || `${this.$t('ruleList.matchPattern')}: ${item.pattern}` || this.$t('ruleList.editMatchPattern');
            }
            return item.rule_desc || this.$t('ruleList.noDescription');
        },
        // 添加搜索处理方法
        handleSearch() {
            // 搜索通过计算属性自动处理，这里可以添加防抖逻辑以提高性能
            if (this.searchDebounce) {
                clearTimeout(this.searchDebounce);
            }
            this.searchDebounce = window.setTimeout(() => {
                // 实际的搜索逻辑（如果需要额外处理的话）
                // 当前通过计算属性 filteredItems 自动处理
                this.searchDebounce = null;
            }, 300);
        },
        startEdit(item: Rule) {
            this.editingItem = item;
            item._is_editing = true;
            
            if (this.type === 'color') {
                this.regenerateColorSchemes();
            }
            
            setTimeout(() => {
                const input = document.querySelector('input[ref="titleInput"]') as HTMLInputElement;
                if (input) {
                    input.focus();
                }
            }, 0);
        },
        cancelEdit() {
            if (this.editingItem!._is_adding) {
                this.localItems.shift();
            }
            this.editingItem!._is_editing = false;
            this.editingItem = undefined;
            if (this.showExpandedEditor === false) {
                this.showExpandedEditor = false;
                this.expandedContent = {} as Rule;
            }
        },
        createEmptyItem(): Rule {
            return  {
                uuid: crypto.randomUUID(),
                workspace_id: this.workspace.id,
                user_id: this.currentUser?.id,
                rule_type: this.type,
                rule_name: '',
                is_public: false,
                created_at: '',
                updated_at: '',
                _is_editing: true,
                _is_adding: true,
            } as Rule;
        },
        async handleAddRule() {
            const userInfoStr = await settingsTableHelper.get('user_info', null)
            const userInfo = userInfoStr ? JSON.parse(userInfoStr as string) as User : null
            const isLoggedIn = userInfo !== null
            if (!isLoggedIn) {
                this.toast.add({
                    severity: 'warn',
                    summary: this.$t('ruleList.anonymousWarningTitle'),
                    detail: this.$t('ruleList.anonymousWarningDetail'),
                    life: 8000
                });
            }
            this.editingItem = this.createEmptyItem();

            // 为函数规则添加默认内容
            if (this.type === 'function') {
                this.editingItem.custom_function = this.defaultFunctionCode;
            }

            this.localItems.unshift(this.editingItem);
        },
        async handleSave() {
            console.log("handleSave triggered, editingItem=", this.editingItem)
            this.editingItem!._is_editing = false;
            this.editingItem!._is_adding = false;
            const existingItem = await ruleTableHelper.isExistByUuid(this.editingItem!.uuid);
            if (existingItem) {
                await ruleTableHelper.put(this.editingItem!);
                if (this.workspace.id !== 0) { // 0 是本地工作区，不需要同步到远程
                    await ruleApi.updateRule(this.editingItem!);
                }
            } else {
                await ruleTableHelper.add(this.editingItem!);
                await this.handleFunctionSubmit(this.editingItem!);
                if (this.workspace.id !== 0) { // 0 是本地工作区，不需要同步到远程
                    await ruleApi.createRule(this.editingItem!);
                }
            }
            this.closeExpandedEdit();
        },
        async handleDelete(item: Rule) {
            console.log("handleDelete, item=", item)
            this.localItems = this.localItems.filter(i => i.uuid !== item.uuid);
            await ruleTableHelper.delete(item.uuid);
            if (this.workspace.id !== 0) { // 0 是本地工作区，不需要同步到远程
                await ruleApi.deleteRule(item.uuid);
            }
        },
        closeEditor() {
            this.editingItem._is_editing = false;
            this.editingItem._is_adding = false;
        },
        async handleFunctionSubmit(rule: Rule) {
            const index = this.localItems.findIndex(item => item.rule_name === this.editingItem.rule_name);
            if (index !== -1) {
                this.localItems[index] = rule;
            } else {
                this.localItems.push(rule);
            }
            this.emitUpdate();
            this.closeEditor();
        },
        addTag() {
            if (!this.newTag.trim()) return;
            
            if (!this.editingItem!.tags) {
                this.editingItem!.tags = '';
            }
            const tags = this.editingItem!.tags.split(',').filter(Boolean);
            
            if (!tags.includes(this.newTag.trim())) {
                tags.push(this.newTag.trim());
            }
            this.editingItem!.tags = tags.join(',');
            this.newTag = '';
        },
        removeTag(index: number) {
            const tags = this.editingItem!.tags?.split(',');
            if (!tags) return;
            tags.splice(index, 1);
            this.editingItem!.tags = tags.join(',');
        },
        regenerateColorSchemes() {
            this.colorSchemes = generateColorSchemes();
        },
        isSelectedScheme(scheme: ColorScheme): boolean {
            if (!this.editingItem) return false;
            return this.editingItem.fg_color === scheme.fg && 
                   this.editingItem.bg_color === scheme.bg;
        },
        applyColorScheme(scheme: ColorScheme) {
            this.editingItem!.fg_color = scheme.fg;
            this.editingItem!.bg_color = scheme.bg;
        },
        async toggleCheck(item: Rule) {
            if (item._is_editing) {
                return;
            }
            item._checked = !item._checked;

            console.log("toggleCheck, item=", item) 
            await ruleStatusTableHelper.storeChecked(item.uuid, item._checked);
            await ruleTableHelper.insertOrUpdate(item);
            this.emitUserToggleItems(item);
        },
        openExpandedEdit() {
            this.expandedContent = JSON.parse(JSON.stringify(this.editingItem));
            if (this.type === 'color') {
                this.regenerateColorSchemes();
            }
            this.showExpandedEditor = true;
        },
        closeExpandedEdit() {
            this.showExpandedEditor = false;
            this.expandedContent = {} as Rule;
            this.cancelEdit();
        },
        handleExpandedSave() {
            Object.assign(this.editingItem!, this.expandedContent);
            this.handleSave();
            this.closeExpandedEdit();
        },
        handleBackspace() {
            // 处理回退键的逻辑
        },
        canEdit(item: Rule): boolean {
            return item.workspace_id === this.workspace.id;
        },
        isExpandedSelectedScheme(scheme: ColorScheme): boolean {
            if (!this.expandedContent) return false;
            return this.expandedContent.fg_color === scheme.fg && 
                   this.expandedContent.bg_color === scheme.bg;
        },
        applyExpandedColorScheme(scheme: ColorScheme) {
            this.expandedContent.fg_color = scheme.fg;
            this.expandedContent.bg_color = scheme.bg;
        },
    }
}
</script>

<style scoped>
/* 确保搜索框和按钮的高度协调 */
:deep(.p-inputtext) {
    height: 2.25rem; /* 36px */
    padding: 0.375rem 0.75rem;
    padding-left: 2.25rem !important; /* 为搜索图标留出空间 */
    font-size: 0.875rem;
}

:deep(.p-button.p-button-sm) {
    height: 2.25rem; /* 36px */
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}
</style>