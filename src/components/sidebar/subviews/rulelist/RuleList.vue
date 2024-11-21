<template>
    <div class="space-y-3">
        <!-- 添加规则按钮 -->
        <button v-if="!showEditor"
            class="w-full flex items-center justify-center px-4 py-2.5 rounded-lg
                   bg-blue-50 dark:bg-blue-900/30 
                   text-blue-600 dark:text-blue-400
                   hover:bg-blue-100 dark:hover:bg-blue-900/50
                   transition duration-200 group"
            @click="handleAddRule"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:scale-110 transition duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加{{ typeLabel }}
        </button>

        <!-- 规则列表 -->
        <div class="space-y-2">
            <div 
                v-for="(item, index) in localItems" 
                :key="index"
                class="relative p-4 rounded-lg
                       shadow-sm
                       border border-gray-100 dark:border-gray-700
                       transition-all duration-200
                       cursor-pointer
                       group"
                :class="{
                    'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50': !item._checked,
                    'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800': item._checked
                }"
                @click="toggleCheck(item)"
            >
                <!-- 左侧选中指示器 -->
                <div 
                    class="absolute left-0 top-0 bottom-0 w-1.5
                           transition-all duration-200"
                    :class="{
                        'bg-emerald-500 dark:bg-emerald-400': item._checked,
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
                            placeholder="输入名称"
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
                                   bg-green-50 dark:bg-green-900/30 
                                   text-green-600 dark:text-green-400"
                        >
                            公开
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
                        <div class="text-sm text-gray-500 dark:text-gray-400">预览：</div>
                        <div 
                            class="px-3 py-1 rounded text-sm"
                            :style="{
                                color: item._is_editing ? editingItem!.fg_color : item.fg_color,
                                backgroundColor: item._is_editing ? editingItem!.bg_color : item.bg_color
                            }"
                        >
                            示例文本
                        </div>
                    </div>

                    <!-- 描述或模式编辑 -->
                    <div v-if="!item._is_editing">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ getItemDescription(item) }}2
                        </p>
                    </div>
                    <div v-else class="space-y-2">

                        <!-- 匹配框 -->
                        <input 
                            v-if="type !== 'function'"
                            v-model="editingItem!.pattern"
                            placeholder="输入匹配模式"
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
                            placeholder="输入函数代码"
                            rows="6"
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
                            placeholder="输入描述"
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
                            <label class="text-sm text-gray-700 dark:text-gray-300">标签</label>
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
                                    placeholder="输入标签按回车添加"
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
                                    公开
                                </label>
                            </div>

                            <!-- 操作按钮 -->
                            <div class="flex space-x-2">
                                <button 
                                    @click="cancelEdit"
                                    class="px-3 py-1 text-sm rounded-md
                                           text-gray-600 dark:text-gray-400
                                           hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    取消
                                </button>
                                <button 
                                    @click="handleSave"
                                    class="px-3 py-1 text-sm rounded-md
                                           bg-blue-500 hover:bg-blue-600
                                           text-white"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 数预览 -->
                    <div v-if="type === 'function' && !item._is_editing" class="mt-2">
                        <pre class="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">{{ item.custom_function }}</pre>
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
                                编辑{{ typeLabel }}
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
                                    名称
                                </label>
                                <input 
                                    v-model="expandedContent.rule_name"
                                    placeholder="输入名称"
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
                                    匹配模式
                                </label>
                                <input 
                                    v-model="expandedContent.pattern"
                                    placeholder="输入匹配模式"
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
                                    函数代码
                                </label>
                                <textarea 
                                    v-model="expandedContent.custom_function"
                                    placeholder="输入函数代码"
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
                                    描述
                                </label>
                                <textarea 
                                    v-model="expandedContent.rule_desc"
                                    placeholder="输入描述"
                                    rows="3"
                                    class="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                           bg-white dark:bg-gray-700 
                                           text-gray-900 dark:text-gray-100
                                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                           focus:border-transparent outline-none"
                                ></textarea>
                            </div>

                            <!-- 颜色选择器 -->
                            <div v-if="type === 'color'" class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    颜色方案
                                </label>
                                <div class="flex items-center space-x-2">
                                    <button
                                        v-for="(scheme, index) in colorSchemes"
                                        :key="index"
                                        class="px-3 py-1.5 rounded-lg hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all"
                                        :class="{'ring-2 ring-blue-500 dark:ring-blue-400': isSelectedScheme(scheme)}"
                                        :style="{
                                            color: scheme.fg,
                                            backgroundColor: scheme.bg
                                        }"
                                        @click="applyColorScheme(scheme)"
                                    >
                                        示例文本
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

                            <!-- 标签 -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    标签
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
                                        placeholder="输入标签按回车添加"
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
                                    公开
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
                            取消
                        </button>
                        <button 
                            @click="handleExpandedSave"
                            class="px-4 py-2 rounded-lg text-sm
                                   bg-blue-500 hover:bg-blue-600
                                   text-white"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Rule, User, Workspace } from '../../../../modules/base';
import { generateColorSchemes, type ColorScheme } from '../../../../utils/colors';
import { ruleTableHelper } from '@/utils/db';
import { ruleApi } from '@/api';

export default {
    name: 'RuleList',
    components: {
        // 移除未使用的组件
        // RuleEditor
    },
    props: {
        currentUser: {
            type: Object as PropType<User>,
            required: true
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
            editingItem: undefined as Rule | undefined,
            newTag: '',
            colorSchemes: [] as ColorScheme[],
            showExpandedEditor: false,
            expandedContent: {} as Rule,
            titleInputRef: null as HTMLInputElement | null,
        }
    },
    computed: {
        typeLabel(): string {
            const labels = {
                filter: '过滤器',
                color: '颜色规则',
                function: '函数'
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
        }
    },
    watch: {
        items: {
            immediate: true,
            handler(newItems) {
                console.log("items changed, newItems=", newItems)
                this.localItems = newItems;
            }
        }
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
            return `未命名${this.typeLabel}`;
        },
        getItemDescription(item: Rule): string {
            if (this.type === 'filter') {
                return item.rule_desc || item.pattern || '点击编辑匹配模式';
            }
            if (this.type === 'color') {
                return item.rule_desc || `匹配模式: ${item.pattern}` || '点击编辑匹配模式';
            }
            return item.rule_desc || '无描述';
        },
        startEdit(item: Rule) {
            this.editingItem = item;
            item._is_editing = true;
            
            setTimeout(() => {
                const input = document.querySelector('input[ref="titleInput"]') as HTMLInputElement;
                if (input) {
                    input.focus();
                }
            }, 0);
        },
        cancelEdit() {
            console.log("cancelEdit, editingItem=", this.editingItem, this.editingItem!._is_adding)
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
        handleAddRule() {
            console.log("handleAddRule, currentUser=", this.currentUser)
            this.editingItem = {
                uuid: crypto.randomUUID(),
                workspace_id: this.workspace.id,
                user_id: this.currentUser.id,
                rule_type: this.type,
                rule_name: '',
                is_public: false,
                created_at: '',
                updated_at: '',
                _is_editing: true,
                _is_adding: true,
            } as Rule;
            
            console.log("handleAddRule, newItem=", this.localItems)
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
        handleEdit(item: Rule) {
            if (this.type === 'function') {
                this.editingItem = item;
                this.showEditor = true;
            }
        },
        closeEditor() {
            this.showEditor = false;
            this.editingItem = undefined;
        },
        handleFunctionSubmit(rule: Rule) {
            const index = this.localItems.findIndex(item => item.rule_name === this.editingItem?.rule_name);
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
            console.log("addTag, this.editingItem!.tags=", this.editingItem!.tags)
            console.log("addTag, tags=", tags)
            console.log("addTag, this.newTag.trim()=", this.newTag.trim())
            
            if (!tags.includes(this.newTag.trim())) {
                tags.push(this.newTag.trim());
            }
            this.editingItem!.tags = tags.join(',');
            
            this.newTag = '';
            console.log("addTag, this.editingItem!.tags=", this.editingItem!.tags)
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
            if (!this.editingItem!.fg_color || !this.editingItem!.bg_color) return false;
            return this.editingItem!.fg_color === scheme.fg && 
                   this.editingItem!.bg_color === scheme.bg;
        },
        applyColorScheme(scheme: ColorScheme) {
            if (!this.editingItem!.fg_color || !this.editingItem!.bg_color) {
                this.editingItem!.fg_color = scheme.fg;
                this.editingItem!.bg_color = scheme.bg;
            }
        },
        toggleCheck(item: Rule) {
            if (item._is_editing) {
                return;
            }
            item._checked = !item._checked;
            this.emitUserToggleItems(item);
        },
        openExpandedEdit() {
            this.expandedContent = JSON.parse(JSON.stringify(this.editingItem));
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
    }
}
</script>