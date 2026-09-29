<template>
    <div class="logdog-editor-shell" @click="closeContextMenu">
        <Splitter class="logdog-editor" layout="vertical" @wheel.capture="hideColorSelector" @pointerdown.capture="hideColorSelector" @scroll.capture="hideColorSelector">
        <!-- Left: Full log list -->
        <SplitterPanel style="width:100%;height:100%;min-height:100px">
            <div class="log-view-container h-full flex flex-col">
                <HugeList :wrap="isAutoWrap" :overscanRowCount="10" :version="dataVersion" :rowCount="totalCount"
                    ref="logFullView" class="log-list-panel border border-surface-200 dark:border-surface-700 rounded m-[4px] pb-10">
                    <template #default="{ index }">
                        <AsyncLogLineItem :index="index" :selected-line="selectedline" :animation-key="animationKey"
                            :selected-lines="fullSelectedLines" :all-lines-selected="fullAllLinesSelected"
                            :deselected-lines="fullDeselectedLines"
                            :is-auto-wrap="isAutoWrap" :hash-color-line-index="hashColorLineIndex"
                            :get-item-async="getItemAsync" :render-line-html="renderLogItem" :data-version="dataVersion"
                            clickable @item-click="onClickLogItem"
                            @context-menu="openFullContextMenu"
                            :default-tooltip-text="$t('logdogEditor.clickToMark')" @toggle-mark="toggleLineMarked"
                            @text-mouseup="handleTextSelection" />
                    </template>
                </HugeList>
            </div>
        </SplitterPanel>

        <!-- Right: Search results -->
        <SplitterPanel style="width:100%;height:100%;min-height:100px">
            <div class="log-view-container h-full flex flex-col">
                <div class="search-view-header">
                    <SearchBar :searchTerm="searchTerm" @search="searchLogs" @toggleAutoWrap="toggleAutoWrap"
                        @update:searchTerm="handleSearchInput" @toggleHistory="toggleHistory"
                        @changeDisplayMode="changeDisplayMode" @toggleCaseSensitive="toggleCaseSensitive" />
                </div>

                <HugeList :wrap="isAutoWrap" :version="dataVersion" :rowCount="searchCount"
                    class="log-list-panel border border-surface-200 dark:border-surface-700 rounded mx-[4px] mb-[4px] pb-10"
                    style="flex-grow:1" ref="logSearchView">
                    <template #default="{ index }">
                        <AsyncLogLineItem :index="index" :selected-line="selectedline" :animation-key="animationKey"
                            :selected-lines="searchSelectedLines" :all-lines-selected="searchAllLinesSelected"
                            :deselected-lines="searchDeselectedLines"
                            :is-auto-wrap="isAutoWrap" :hash-color-line-index="hashColorLineIndex"
                            :get-item-async="getSearchItemAsync" :render-line-html="renderLogItem"
                            :data-version="dataVersion" clickable @item-click="onClickSearchItem"
                            @context-menu="openSearchContextMenu"
                            @toggle-mark="toggleLineMarked" @text-mouseup="handleTextSelection" />
                    </template>
                </HugeList>

                <div class="bottom-status-bar">
                    <a class="feedback-button text-red-500 cursor-pointer text-center"
                        href="https://github.com/logdog-tech/logdog" target="_blank">{{
                            $t('userdropdown.feedback')
                        }}</a>
                    <span>{{ $t('logdogEditor.totalCount', { totalCount, searchCount, searchProgress }) }}</span>
                    <a class="encoding-selector" @click="showEncodingSelector = true">
                        {{ currentEncoding.toUpperCase() || 'UTF-8' }}
                    </a>
                    <span></span>
                    <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备2024043575号-3</a>
                </div>
            </div>
        </SplitterPanel>
        </Splitter>

        <div v-if="contextMenu.visible" class="log-context-menu" :style="contextMenuStyle" @click.stop>
            <button type="button" class="context-action" @click="copySelectedLines(activeSelectionView)" :disabled="!activeCanCopySelection">
                <i class="pi pi-copy" aria-hidden="true"></i>
                <span>复制选中日志</span>
            </button>
            <button type="button" class="context-action" @click="exportSelectedLines(activeSelectionView)" :disabled="activeSelectedLineCount === 0">
                <i class="pi pi-download" aria-hidden="true"></i>
                <span>导出选中日志</span>
            </button>
            <div v-if="!activeCanCopySelection && activeSelectedLineCount > 0" class="context-hint">日志量较大，请导出为文件</div>
        </div>
    </div>

    <!-- Floating helpers -->
    <ColorSelector @picked="handleColorPicked" :show="showColorSelector" 
        :x="selectionRect ? selectionRect.left + selectionRect.width / 2 : 0"
        :y="selectionRect?.top || 0" 
        :current-style="sessionColors[selectedText]"
        :selected-text="selectedText"
        :all-session-colors="sessionColors" />
    <EncodingSelector @update:show="showEncodingSelector = $event" @update:encoding="handleEncodingChange"
        :show="showEncodingSelector" :encoding="currentEncoding" />
    <FeedbackModal :showFeedbackModal="showFeedbackModal" @update:showFeedbackModal="showFeedbackModal = $event" />
</template>

<script lang="ts">
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import HugeList from "./HugeList.vue";
import ColorSelector from "./ColorSelector.vue";
import SearchBar from "./SearchBar.vue";
import EncodingSelector from "./EncodingSelector.vue";
import FeedbackModal from "./sidebar/subviews/FeedbackModal.vue";
import AsyncLogLineItem from "./AsyncLogLineItem.vue";

import { defineComponent, type PropType } from "vue";
import type { BaseLine, Rule, LogFile } from "@/modules/base";
import { DisplayMode } from "@/modules/base";
import { proxyProvider } from "@/utils/providers/ProxyProvider";
import { type Observer } from "@/utils/providers/define";
import { hashColor } from "@/utils/colors";
import { highlightIt } from "@/utils/highlighter";
import { escapeRegExp } from "@/utils/regex";
import { settingsTableHelper } from "@/utils/db";
import { useToast } from 'primevue/usetoast';

type StyleObject = Record<string, string>;
type SelectionScope = 'full' | 'search';
const MAX_CLIPBOARD_LINES = 1000;

// 使用 HugeList 组件的真实类型
type HugeListRef = InstanceType<typeof HugeList>;

export default defineComponent({
    name: "LogdogEditor",
    components: {
        Splitter,
        SplitterPanel,
        HugeList,
        ColorSelector,
        SearchBar,
        EncodingSelector,
        FeedbackModal,
        AsyncLogLineItem
    },
    props: {
        filters: {
            type: Array as PropType<Rule[]>,
            required: true,
            default: () => [],
        },
        colors: {
            type: Array as PropType<Rule[]>,
            required: true,
            default: () => [{ pattern: "", style: { color: "", "background-color": "" } }],
        },
        functions: {
            type: Array as PropType<Rule[]>,
            required: true,
            default: () => [],
        },
    },
    setup() {
        const toast = useToast()
        return { toast }
    },
    data() {
        return {
            searchTerm: "",
            selectedline: -1 as number,
            selectionRect: null as DOMRect | null,
            showColorSelector: false,
            selectedText: "",
            sessionColors: {} as Record<string, StyleObject>,
            totalCount: 0,
            searchCount: 0,
            searchProgress: 100,
            updateCountTimer: null as NodeJS.Timeout | null,
            animationKey: 0,
            currentEncoding: "utf8",
            showEncodingSelector: false,
            showCaseSensitive: false,
            showBookmark: DisplayMode.MARK_AND_SEARCH,
            showFeedbackModal: false,
            isAutoWrap: false,
            dataVersion: 0 as number,
            fullSelectedLines: new Set<number>(),
            fullDeselectedLines: new Set<number>(),
            fullAllLinesSelected: false,
            searchSelectedLines: new Set<number>(),
            searchDeselectedLines: new Set<number>(),
            searchAllLinesSelected: false,
            activeSelectionView: 'full' as SelectionScope,
            selectionAnchorIndices: { full: -1, search: -1 } as Record<SelectionScope, number>,
            contextMenu: {
                visible: false,
                x: 0,
                y: 0,
            },
        };
    },
    computed: {
        fullSelectedLineCount(): number {
            return this.fullAllLinesSelected
                ? Math.max(0, this.totalCount - this.fullDeselectedLines.size)
                : this.fullSelectedLines.size;
        },
        searchSelectedLineCount(): number {
            return this.searchAllLinesSelected
                ? Math.max(0, this.searchCount - this.searchDeselectedLines.size)
                : this.searchSelectedLines.size;
        },
        fullCanCopySelection(): boolean {
            return this.fullSelectedLineCount > 0 && this.fullSelectedLineCount <= MAX_CLIPBOARD_LINES;
        },
        searchCanCopySelection(): boolean {
            return this.searchSelectedLineCount > 0 && this.searchSelectedLineCount <= MAX_CLIPBOARD_LINES;
        },
        activeSelectedLineCount(): number {
            return this.activeSelectionView === 'full' ? this.fullSelectedLineCount : this.searchSelectedLineCount;
        },
        activeCanCopySelection(): boolean {
            return this.activeSelectionView === 'full' ? this.fullCanCopySelection : this.searchCanCopySelection;
        },
        contextMenuStyle(): Record<string, string> {
            return {
                left: `${this.contextMenu.x}px`,
                top: `${this.contextMenu.y}px`,
            };
        },
    },
    async mounted() {
        const myObserver = {
            onLoaded: async () => {
                this.totalCount = await proxyProvider.getTotalLineCount();
                this.searchCount = await proxyProvider.getFilteredLineCount();
                this.searchProgress = 100;
                this.dataVersion++;
                this.clearLineSelection('full');
                this.clearLineSelection('search');
            },
            onChange: async () => {
                this.totalCount = await proxyProvider.getTotalLineCount();
                this.searchCount = await proxyProvider.getFilteredLineCount();
                this.searchProgress = await proxyProvider.getSearchProcess();
                this.dataVersion++;
            }
        } as Observer;
        proxyProvider.subscribe(myObserver);
        this.currentEncoding = (await settingsTableHelper.getDefaultEncoding() as string) || "utf-8";
        proxyProvider.useEncoding(this.currentEncoding);

        // 监听选择变化，当没有选中内容时隐藏颜色选择器
        document.addEventListener('selectionchange', this.handleSelectionChange);
        document.addEventListener('keydown', this.handleGlobalKeydown);
    },
    beforeUnmount() {
        // 移除事件监听器
        document.removeEventListener('selectionchange', this.handleSelectionChange);
        document.removeEventListener('keydown', this.handleGlobalKeydown);
    },
    methods: {
        // 辅助方法：安全地获取组件引用
        getLogSearchViewRef(): HugeListRef {
            return this.$refs.logSearchView as HugeListRef;
        },
        getLogFullViewRef(): HugeListRef {
            return this.$refs.logFullView as HugeListRef;
        },

        // 直接返回 Promise，不做缓存
        getItemAsync(index: number): Promise<BaseLine> {
            return Promise.resolve(proxyProvider.getLine(index));
        },
        getSearchItemAsync(index: number): Promise<BaseLine> {
            return Promise.resolve(proxyProvider.getFilteredLine(index));
        },

        hashColorLineIndex(filename: string) {
            return hashColor(filename, 80, 35);
        },
        onClickLogItem(item: BaseLine, event: MouseEvent, index: number) {
            this.updateLineSelection(index, event, 'full');
            this.selectedline = item.line;
            this.animationKey++;  // 增加key触发新动画
        },
        
        onClickSearchItem(item: BaseLine, event: MouseEvent, index: number) {
            this.updateLineSelection(index, event, 'search');
            this.selectedline = item.line;
            this.animationKey++;  // 增加key触发新动画
            // 单行模式下居中显示，换行模式下顶部显示
            const alignment = this.isAutoWrap ? "start" : "center";
            this.getLogFullViewRef().scrollToIndex(item.line, alignment);
        },
        isLineSelected(index: number, scope: SelectionScope): boolean {
            const allSelected = scope === 'full' ? this.fullAllLinesSelected : this.searchAllLinesSelected;
            const selectedLines = scope === 'full' ? this.fullSelectedLines : this.searchSelectedLines;
            const deselectedLines = scope === 'full' ? this.fullDeselectedLines : this.searchDeselectedLines;
            return allSelected ? !deselectedLines.has(index) : selectedLines.has(index);
        },
        updateLineSelection(index: number, event: MouseEvent, scope: SelectionScope) {
            this.activeSelectionView = scope;
            const allSelected = scope === 'full' ? this.fullAllLinesSelected : this.searchAllLinesSelected;
            const selectedLines = scope === 'full' ? this.fullSelectedLines : this.searchSelectedLines;
            const deselectedLines = scope === 'full' ? this.fullDeselectedLines : this.searchDeselectedLines;
            const anchorIndex = this.selectionAnchorIndices[scope];
            if (event.shiftKey && anchorIndex >= 0 && !allSelected) {
                const start = Math.min(anchorIndex, index);
                const end = Math.max(anchorIndex, index);
                const next = new Set(selectedLines);
                for (let index = start; index <= end; index++) next.add(index);
                if (scope === 'full') this.fullSelectedLines = next;
                else this.searchSelectedLines = next;
                return;
            }

            if (event.metaKey || event.ctrlKey) {
                if (allSelected) {
                    const next = new Set(deselectedLines);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    if (scope === 'full') this.fullDeselectedLines = next;
                    else this.searchDeselectedLines = next;
                } else {
                    const next = new Set(selectedLines);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    if (scope === 'full') this.fullSelectedLines = next;
                    else this.searchSelectedLines = next;
                }
                return;
            }

            if (scope === 'full') {
                this.fullAllLinesSelected = false;
                this.fullDeselectedLines = new Set();
                this.fullSelectedLines = new Set([index]);
            } else {
                this.searchAllLinesSelected = false;
                this.searchDeselectedLines = new Set();
                this.searchSelectedLines = new Set([index]);
            }
            this.selectionAnchorIndices[scope] = index;
        },
        selectAllLines(scope: SelectionScope) {
            const count = scope === 'full' ? this.totalCount : this.searchCount;
            if (count === 0) return;
            this.activeSelectionView = scope;
            if (scope === 'full') {
                this.fullAllLinesSelected = true;
                this.fullSelectedLines = new Set();
                this.fullDeselectedLines = new Set();
            } else {
                this.searchAllLinesSelected = true;
                this.searchSelectedLines = new Set();
                this.searchDeselectedLines = new Set();
            }
            this.selectedline = 0;
            this.closeContextMenu();
        },
        clearLineSelection(scope: SelectionScope) {
            if (scope === 'full') {
                this.fullAllLinesSelected = false;
                this.fullSelectedLines = new Set();
                this.fullDeselectedLines = new Set();
            } else {
                this.searchAllLinesSelected = false;
                this.searchSelectedLines = new Set();
                this.searchDeselectedLines = new Set();
            }
            this.selectionAnchorIndices[scope] = -1;
            if (this.activeSelectionView === scope) this.selectedline = -1;
        },
        openContextMenu(item: BaseLine, event: MouseEvent, index: number, scope: SelectionScope) {
            this.activeSelectionView = scope;
            if (!this.isLineSelected(index, scope)) {
                this.clearLineSelection(scope);
                if (scope === 'full') this.fullSelectedLines = new Set([index]);
                else this.searchSelectedLines = new Set([index]);
                this.selectedline = item.line;
            }
            this.contextMenu = {
                visible: true,
                x: Math.min(event.clientX, window.innerWidth - 220),
                y: Math.min(event.clientY, window.innerHeight - 110),
            };
        },
        openFullContextMenu(item: BaseLine, event: MouseEvent, index: number) {
            this.openContextMenu(item, event, index, 'full');
        },
        openSearchContextMenu(item: BaseLine, event: MouseEvent, index: number) {
            this.openContextMenu(item, event, index, 'search');
        },
        closeContextMenu() {
            this.contextMenu.visible = false;
        },
        async getSelectedLineText(scope: SelectionScope): Promise<string> {
            const lines: string[] = [];
            const count = scope === 'full' ? this.totalCount : this.searchCount;
            for (let index = 0; index < count; index++) {
                if (!this.isLineSelected(index, scope)) continue;
                const line = scope === 'full'
                    ? await proxyProvider.getLine(index)
                    : await proxyProvider.getFilteredLine(index);
                lines.push(line.content);
                if (index % 1000 === 0) await new Promise(resolve => setTimeout(resolve, 0));
            }
            return lines.join('\n');
        },
        async copySelectedLines(scope: SelectionScope) {
            this.activeSelectionView = scope;
            this.closeContextMenu();
            const canCopy = scope === 'full' ? this.fullCanCopySelection : this.searchCanCopySelection;
            const count = scope === 'full' ? this.fullSelectedLineCount : this.searchSelectedLineCount;
            if (!canCopy) {
                if (count > MAX_CLIPBOARD_LINES) {
                    this.toast.add({
                        severity: 'warn',
                        summary: '日志行数过多',
                        detail: `超过 ${MAX_CLIPBOARD_LINES} 行时只能导出为文件`,
                        life: 3000,
                    });
                }
                return;
            }
            if (!navigator.clipboard?.writeText) return;
            const text = await this.getSelectedLineText(scope);
            await navigator.clipboard.writeText(text);
            this.toast.add({ severity: 'success', summary: '复制成功', detail: `已复制 ${count} 行`, life: 2000 });
        },
        async exportSelectedLines(scope: SelectionScope) {
            this.activeSelectionView = scope;
            this.closeContextMenu();
            const count = scope === 'full' ? this.fullSelectedLineCount : this.searchSelectedLineCount;
            if (count === 0) return;
            const text = await this.getSelectedLineText(scope);
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `logdog-selection-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            anchor.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        },
        handleGlobalKeydown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) return;

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
                event.preventDefault();
                this.selectAllLines(this.activeSelectionView);
            } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
                // 保留日志内容原生文字选区的复制行为，行选择则走 LogDog 的复制逻辑。
                if (window.getSelection()?.toString()) return;
                const count = this.activeSelectedLineCount;
                if (count === 0) return;
                event.preventDefault();
                void this.copySelectedLines(this.activeSelectionView);
            } else if (event.key === 'Escape') {
                this.closeContextMenu();
            }
        },
        renderLogItem(line: BaseLine) {
            const functions = this.functions.filter((f) => f._checked);

            let result = line.content;

            // s1, 执行所有预处理任务, TODO 将该方法向provider前移
            for (const func of functions) {
                try {
                    const code = String(func.custom_function);
                    // Validate: reject potentially dangerous code
                    if (/eval\b|Function\b|import\b|fetch\b|XMLHttpRequest|document\b|window\b|localStorage|sessionStorage|WebSocket|Worker\b/i.test(code)) {
                        console.error(`Blocked potentially unsafe function: "${func.custom_function}"`);
                        continue;
                    }
                     
                    const memFunc = new Function(code)();
                    result = memFunc(line.filename, line.line, result);
                } catch (error) {
                    console.error(`Error in function "${func.custom_function}":`, error);
                }
            }

            // s2, 执行所有高亮任务
            const keywords = [
                "" + line.pid + " ",
                " " + line.tid + " ",
                " " + line.level + " ",
            ];
            result = this.highlights(result);

            return result;
        },
        handleColorPicked(style: StyleObject, text?: string) {
            // 使用传递的文字参数，如果没有则使用当前选中的文字
            const targetText = text || this.selectedText;
            
            // 如果是删除操作（style为null）
            if (!style) {
                delete this.sessionColors[targetText];
            } else {
                // 正常的颜色设置操作
                this.sessionColors[targetText] = style;
            }
        },
        handleTextSelection(event: Event) {
            if (event.type !== "mouseup") {
                this.showColorSelector = false;
                return;
            }

            // 获取选中文字的坐标
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                this.showColorSelector = false;
                return;
            }
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // 如果是鼠标事件，使用鼠标位置；否则使用选中区域位置
            if (event instanceof MouseEvent) {
                this.selectionRect = {
                    left: event.clientX,
                    top: event.clientY,
                    right: event.clientX,
                    bottom: event.clientY,
                    width: 0,
                    height: 0,
                    x: event.clientX,
                    y: event.clientY,
                    toJSON: () => ({})
                } as DOMRect;
            } else {
                this.selectionRect = rect ?? null;
            }
            
            this.selectedText = selection.toString() ?? "";
            this.showColorSelector = !!this.selectedText;
        },

        hideColorSelector() {
            this.showColorSelector = false;
        },
        
        handleSelectionChange() {
            // 如果颜色选择器正在显示，不要因为选择变化而隐藏它
            if (this.showColorSelector) {
                return;
            }
            
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
                this.selectedText = '';
                this.showColorSelector = false;
            }
        },

        async toggleAutoWrap() {
            this.isAutoWrap = !this.isAutoWrap;
            console.log("Auto wrap toggled:", this.isAutoWrap);
            // 如果有选中的行，需要在搜索视图中找到对应的索引并滚动
            if (this.selectedline >= 0) {
                const searchCount = await proxyProvider.getFilteredLineCount();

                // 在搜索结果中查找与selectedline匹配的项的索引
                for (let i = 0; i < searchCount; i++) {
                    const item = await proxyProvider.getFilteredLine(i);
                    if (item.line === this.selectedline) {
                        // 使用安全的辅助方法
                        const logSearchView = this.getLogSearchViewRef();
                        if (logSearchView) {
                            logSearchView.scrollToIndex(i, "start");
                            console.log(`Scrolled to search result index: ${i} for line: ${this.selectedline}`);
                        }
                        break;
                    }
                }
            }
        },

        /**
         * 高亮显示文本内容中的多个匹配模式，支持样式叠加且避免HTML标签错误处理。
         * 
         * 需求：
         * - 支持多个正则表达式匹配和样式应用
         * - 处理重叠区域的样式叠加
         * - 避免HTML标签被错误替换
         * - 保证输出内容的安全性
         * 
         * 功能：
         * - 将内容中的<br>标签替换为空格
         * - 根据正则表达式查找所有匹配
         * - 对重叠区域应用多个样式
         * - 生成安全的HTML输出
         * 
         * 实现步骤：
         * 1. 预处理 - 替换<br>标签
         * 2. 匹配收集 - 获取所有正则表达式的匹配位置和样式信息
         * 3. 事件排序 - 将所有开始/结束位置排序，结束事件优先
         * 4. 样式管理 - 使用栈结构追踪每个位置的活动样式
         * 5. 文本处理 - 为每段文本应用当前活动的样式组合
         * 6. 安全转换 - HTML字符转义确保输出安全
         * 
         * 优势：
         * - 避免了span标签被二次处理的问题
         * - 准确处理样式叠加
         * - 保证HTML结构完整性
         * 
         * @param {string} content - 需要处理的原始文本内容
         * @returns {string} - 添加了高亮样式的HTML字符串
         */
        highlights(content: string, autoHashHighlightByKeywords: string[] = []): string {
            const useColors = [] as { pattern: string | RegExp; style: StyleObject }[]

            const colorItems = this.colors.filter((c) => c._checked)
            for (const c of colorItems) {
                useColors.push({ pattern: c.pattern, style: { color: c.fg_color, "background-color": c.bg_color } } as { pattern: string | RegExp; style: StyleObject });
            }

            for (const keyword of autoHashHighlightByKeywords) {
                useColors.push({ pattern: keyword, style: { color: hashColor(keyword) } } as { pattern: string | RegExp; style: StyleObject });
            }
            // 直接使用完整的搜索词作为正则表达式，考虑大小写敏感设置
            if (this.searchTerm) {
                this.searchTerm.split("|").forEach((f) => {
                    if (f) {
                        try {
                            // 根据大小写敏感设置创建正则表达式
                            const flags = this.showCaseSensitive ? 'g' : 'gi';
                            new RegExp(f, flags);
                            useColors.push({ pattern: new RegExp(f, flags), style: { "background-color": hashColor(f) } });
                        } catch (error) {
                            console.error(`Error in regex "${f}":`, error)
                        }
                    }
                });
            }

            // TODO 添加临时高亮规则
            useColors.push(...Object.entries(this.sessionColors).map(([text, style]) => ({ pattern: escapeRegExp(text), style: style as StyleObject })));


            return highlightIt(content + " ", useColors);
        },
        handleSearchInput(currentTerm: string) {
            const terms = currentTerm.split("|");
            for (const ff of this.filters) {
                ff._checked = ff.pattern ? terms.includes(ff.pattern) : false;
            }
        },
        async toggleHistory(showHistory: boolean) {
            // this.showHistory = showHistory;
            console.log("toggleHistory", showHistory);
            // await this.searchLogs(this.searchTerm);
        },
        async changeDisplayMode(mode: DisplayMode) {
            this.showBookmark = mode;
            console.log("toggleBookmark", mode);
            await this.searchLogs(this.searchTerm);
        },
        async toggleCaseSensitive(showCaseSensitive: boolean) {
            this.showCaseSensitive = showCaseSensitive;
            console.log("toggleCaseSensitive", showCaseSensitive);
            await this.searchLogs(this.searchTerm);
        },
        async searchLogs(currentTerm: string) {
            try { // 判断finalSearch是否是合法的正则表达式
                new RegExp(currentTerm);
            } catch (e) {
                console.warn('无效的正则表达式，中断:', currentTerm, e);
                this.toast.add({ severity: 'error', summary: this.$t('logdogEditor.invalidRegex'), detail: currentTerm, life: 3000 });
                return;
            }

            const previousLine = this.selectedline;  // Store current line
            this.searchTerm = currentTerm;
            console.log("Searching for:", this.searchTerm);

            await proxyProvider.useFilter(this.searchTerm, { caseSensitive: this.showCaseSensitive, displayMode: this.showBookmark });

            // 重新搜索后，使用二分法找到最近的匹配项
            if (previousLine >= 0) {
                const count = await proxyProvider.getFilteredLineCount();
                if (count > 0) {
                    let left = 0;
                    let right = count - 1;
                    let nearestIndex = 0;
                    let nearestDiff = Number.MAX_VALUE;

                    while (left <= right) {
                        const mid = Math.floor((left + right) / 2);
                        const item = await proxyProvider.getFilteredLine(mid);
                        const diff = Math.abs(item.line - previousLine);

                        if (diff < nearestDiff) {
                            nearestDiff = diff;
                            nearestIndex = mid;
                        }

                        if (item.line === previousLine) {
                            break;
                        } else if (item.line < previousLine) {
                            left = mid + 1;
                        } else {
                            right = mid - 1;
                        }
                    }

                    const nearestItem = await proxyProvider.getFilteredLine(nearestIndex);
                    this.selectedline = nearestItem.line;
                    this.animationKey++;
                    this.getLogSearchViewRef().scrollToIndex(nearestIndex, "start");
                    return;
                }
            }

            this.getLogSearchViewRef().scrollToIndex(0, "start");
        },

        async handleUserToggleItems(type: string, item: Rule) {
            if (type === 'filter') { // 过滤器
                let searchBoxPatterns = this.searchTerm.split("|");
                if (!item._checked) {
                    if (searchBoxPatterns.includes(item.pattern!)) {
                        searchBoxPatterns = searchBoxPatterns.filter((f) => f !== item.pattern);
                    }
                } else {
                    if (!searchBoxPatterns.includes(item.pattern!)) {
                        searchBoxPatterns.push(item.pattern!);
                    }
                }
                const tmpSearchTerm = searchBoxPatterns.filter((f) => f).join("|");
                try {
                    new RegExp(tmpSearchTerm);
                } catch (error) {
                    this.toast.add({ severity: 'error', summary: this.$t('logdogEditor.invalidRegex'), detail: tmpSearchTerm, life: 3000 });
                    console.warn('无效的正则表达式，中断:', tmpSearchTerm, error);
                    return;
                }

                this.searchTerm = tmpSearchTerm;
                await this.searchLogs(this.searchTerm);
            }
        },
        async handleEncodingChange(encoding: string) {
            this.currentEncoding = encoding;
            await proxyProvider.useEncoding(encoding);
            this.dataVersion++;
        },
        async toggleLineMarked(item: BaseLine) {
            await proxyProvider.markLine(item.line, !item.isMarked);
            this.animationKey++;
            this.dataVersion++;
        },
        async scrollToResource(resource: LogFile) {
            // 使用优化后的 useResource 方法获取文件的起始行
            const startLine = await proxyProvider.useResource(resource);
            console.log('scrollToResource', resource, startLine);
            if (startLine >= 0) {
                // 如果找到了文件的起始行，直接滚动到该行
                this.selectedline = startLine;
                this.animationKey++; // 触发动画
                // 单行模式下居中显示，换行模式下顶部显示
                const alignment = this.isAutoWrap ? "start" : "center";
                this.getLogFullViewRef().scrollToIndex(startLine, alignment);
                return;
            }
        }
    },
});
</script>
<style scoped>
.logdog-editor-shell {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--color-background);
}

.log-view-container {
    position: relative;
    min-height: 0;
}

.search-view-header {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px;
}

.search-view-header :deep(.search-container) {
    flex: 1 1 auto;
    min-width: 0;
}

.context-action {
    display: inline-flex;
    align-items: center;
}

.context-action {
    gap: 6px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    padding: 6px 8px;
}

.context-action:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.context-action:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.log-context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 190px;
    padding: 6px;
    border: 1px solid var(--color-border);
    border-radius: 5px;
    background: var(--color-background);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
}

.context-action {
    width: 100%;
    justify-content: flex-start;
    border: 0;
    background: transparent;
}

.context-hint {
    padding: 6px 8px 4px;
    color: var(--color-text-soft);
    font-size: 11px;
    line-height: 1.4;
}

.logdog-editor {
    height: auto;
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    background: var(--color-background);
    color: var(--color-text);
}

.log-list-panel {
    background: var(--color-background);
}

.bottom-status-bar {
    height: 20px;
    background-color: var(--color-background-soft);
    color: var(--color-text);
    border-top: 1px solid var(--color-border);
    padding: 0 8px;
    display: grid;
    grid-template-columns: 120px 1fr 80px 1fr 200px;
    align-items: center;
}

.bottom-status-bar .encoding-selector {
    cursor: pointer;
    text-align: center;
}

.bottom-status-bar a {
    color: var(--color-link);
}

.virtual-scroller {
    height: calc(100% - 8px) !important;
    min-height: 0px;
    width: calc(100% - 8px) !important;
    margin: 4px 4px;
}

.log-search-view {
    height: calc(100% - 64px) !important;
}
</style>
