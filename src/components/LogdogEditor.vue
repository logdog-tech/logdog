<template>
    <Splitter class="logdog-editor" layout="vertical">
        <!-- Left: Full log list -->
        <SplitterPanel style="width:100%;height:100%;min-height:100px">
            <div class="h-full flex flex-col">
                <HugeList :wrap="isAutoWrap" :overscanRowCount="10" :version="dataVersion" :rowCount="totalCount"
                    ref="logFullView" class="border border-surface-200 dark:border-surface-700 rounded m-[4px] pb-10">
                    <template #default="{ index }">
                        <AsyncLogLineItem :index="index" :selected-line="selectedline" :animation-key="animationKey"
                            :is-auto-wrap="isAutoWrap" :hash-color-line-index="hashColorLineIndex"
                            :get-item-async="getItemAsync" :render-line-html="renderLogItem" :data-version="dataVersion"
                            :default-tooltip-text="$t('logdogEditor.clickToMark')" @toggle-mark="toggleLineMarked"
                            @text-mouseup="handleTextSelection" />
                    </template>
                </HugeList>
            </div>
        </SplitterPanel>

        <!-- Right: Search results -->
        <SplitterPanel style="width:100%;height:100%;min-height:100px">
            <div class="h-full flex flex-col">
                <SearchBar :searchTerm="searchTerm" @search="searchLogs" @toggleAutoWrap="toggleAutoWrap"
                    @update:searchTerm="handleSearchInput" @toggleHistory="toggleHistory"
                    @changeDisplayMode="changeDisplayMode" @toggleCaseSensitive="toggleCaseSensitive" />

                <HugeList :version="dataVersion" :rowCount="searchCount"
                    class="border border-surface-200 dark:border-surface-700 rounded mx-[4px] mb-[4px] pb-10"
                    style="flex-grow:1" ref="logSearchView">
                    <template #default="{ index }">
                        <AsyncLogLineItem :index="index" :selected-line="selectedline" :animation-key="animationKey"
                            :is-auto-wrap="isAutoWrap" :hash-color-line-index="hashColorLineIndex"
                            :get-item-async="getSearchItemAsync" :render-line-html="renderLogItem"
                            :data-version="dataVersion" clickable @item-click="onClickSearchItem"
                            @toggle-mark="toggleLineMarked" @text-mouseup="handleTextSelection" />
                    </template>
                </HugeList>

                <div class="bottom-status-bar">
                    <a class="feedback-button text-red-500 cursor-pointer text-center"
                        href="https://github.com/logdog-tech/logdog-issues" target="_blank">{{
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

    <!-- Floating helpers -->
    <ColorSelecter @picked="handleColorPicked" :show="showColorSelecter" :x="selectionRect?.right"
        :y="selectionRect?.top" />
    <EncodingSelector @update:show="showEncodingSelector = $event" @update:encoding="handleEncodingChange"
        :show="showEncodingSelector" :encoding="currentEncoding" />
    <FeedbackModal :showFeedbackModal="showFeedbackModal" @update:showFeedbackModal="showFeedbackModal = $event" />
</template>

<script lang="ts">
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import HugeList from "./HugeList.vue";
import ColorSelecter from "./ColorSelecter.vue";
import SearchBar from "./SearchBar.vue";
import EncodingSelector from "./EncodingSelector.vue";
import FeedbackModal from "./sidebar/subviews/FeedbackModal.vue";
import AsyncLogLineItem from "./AsyncLogLineItem.vue";

import { defineComponent, type PropType } from "vue";
import type { BaseLine, Rule, LogFile } from "../modules/base";
import { DisplayMode } from "../modules/base";
import { proxyProvider } from "../utils/providers/ProxyProvider";
import { type Observer } from "../utils/providers/define";
import { hashColor } from "../utils/colors";
import { highlightIt } from "../utils/highlighter";
import { escapeRegExp } from "../utils/regex";
import { settingsTableHelper } from "../utils/db";
import { useToast } from 'primevue/usetoast';

type StyleObject = Record<string, string>;

export interface LogViewRef {
    scrollToTop: () => void;
    flush: () => void;
    scrollToIndex: (index: number) => void;
    scroolToBottomIfNecessary: () => void;
}

export default defineComponent({
    name: "LogdogEditor",
    components: {
        Splitter,
        SplitterPanel,
        HugeList,
        ColorSelecter,
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
            logFullView: HugeList,
            logSearchView: HugeList,
            selectedline: -1 as number,
            selectionRect: null as DOMRect | null,
            showColorSelecter: false,
            selectedText: "",
            sessionColors: {} as Record<string, StyleObject>,
            totalCount: 0,
            searchCount: 0,
            searchProgress: 100,
            updateCountTimer: null as NodeJS.Timeout | null,
            animationKey: 0,
            currentEncoding: "utf8",
            showEncodingSelector: false,
            showCaseSensitive: true,
            showBookmark: DisplayMode.MARK_AND_SEARCH,
            showFeedbackModal: false,
            isAutoWrap: false,
            dataVersion: 0 as number
        };
    },
    async mounted() {
        const myObserver = {
            onLoaded: async () => {
                this.totalCount = await proxyProvider.getTotalLineCount();
                this.searchCount = await proxyProvider.getFilteredLineCount();
                this.searchProgress = 100;
                this.dataVersion++;
            },
            onChange: async () => {
                const logFullView = this.$refs.logFullView as LogViewRef;
                const logSearchView = this.$refs.logSearchView as LogViewRef;

                this.totalCount = await proxyProvider.getTotalLineCount();
                this.searchCount = await proxyProvider.getFilteredLineCount();
                this.searchProgress = await proxyProvider.getSearchProcess();
                logFullView.flush();
                logSearchView.flush();
            }
        } as Observer;
        proxyProvider.subscribe(myObserver);
        this.currentEncoding = (await settingsTableHelper.getDefaultEncoding() as string) || "utf-8";
        proxyProvider.useEncoding(this.currentEncoding);
    },
    methods: {
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
        onClickSearchItem(item: BaseLine) {
            this.selectedline = item.line;
            this.animationKey++;  // 增加key触发新动画
            const logFullView = this.$refs.logFullView as LogViewRef;
            logFullView.scrollToIndex(item.line - 8);
        },
        renderLogItem(line: BaseLine) {
            const functions = this.functions.filter((f) => f._checked);

            let result = line.content;

            // s1, 执行所有预处理任务, TODO 将该方法向provider前移
            for (const func of functions) {
                try {
                    // eslint-disable-next-line no-new-func
                    const mem_func = new Function('' + func.custom_function)();
                    result = mem_func(line.filename, line.line, result);
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
        handleColorPicked(style: StyleObject) {
            this.sessionColors[this.selectedText] = style;
            if (!style) {
                delete this.sessionColors[this.selectedText];
            }
        },
        handleTextSelection(event: Event) {
            if (event.type !== "mouseup") {
                this.showColorSelecter = false;
                return;
            }

            // 获取选中文字的坐标
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                this.showColorSelecter = false;
                return;
            }
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            this.selectionRect = rect ?? null;
            this.selectedText = selection.toString() ?? "";
            this.showColorSelecter = !!this.selectedText;
        },

        toggleAutoWrap() {
            this.isAutoWrap = !this.isAutoWrap;
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
        highlights(content: string, autoHashHightlightByKeyworkds: string[] = []): string {
            const useColors = [] as { pattern: string | RegExp; style: StyleObject }[]

            const colorItems = this.colors.filter((c) => c._checked)
            for (const c of colorItems) {
                useColors.push({ pattern: c.pattern, style: { color: c.fg_color, "background-color": c.bg_color } } as { pattern: string | RegExp; style: StyleObject });
            }

            for (const keyword of autoHashHightlightByKeyworkds) {
                useColors.push({ pattern: keyword, style: { color: hashColor(keyword) } } as { pattern: string | RegExp; style: StyleObject });
            }
            // 直接使用完整的搜索词作为正则表达式
            if (this.searchTerm) {
                this.searchTerm.split("|").forEach((f) => {
                    if (f) {
                        try {
                            new RegExp(f);
                            useColors.push({ pattern: f, style: { "background-color": hashColor(f) } });
                        } catch (error) {
                            console.error(`Error in regex "${f}":`, error)
                        }
                    }
                });
            }

            // TODO 添加临时高亮规则
            useColors.push(...Object.entries(this.sessionColors).map(([text, style]) => ({ pattern: escapeRegExp(text), style: style })));


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
            const logSearchView = this.$refs.logSearchView as LogViewRef;

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
                    logSearchView.scrollToIndex(nearestIndex - 4);
                    return;
                }
            }

            logSearchView.scrollToTop();
            logSearchView.flush();
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
                const logFullView = this.$refs.logFullView as LogViewRef;
                logFullView.scrollToIndex(startLine);
                return;
            }
        }
    },
});
</script>
<style scoped>
.logdog-editor {
    height: 100%;
    width: 100%;
    display: flex;
}

.bottom-status-bar {
    height: 20px;
    background-color: #f0f0f0;
    padding: 0 8px;
    display: grid;
    grid-template-columns: 120px 1fr 80px 1fr 200px;
    align-items: center;
}

.bottom-status-bar .encoding-selector {
    cursor: pointer;
    text-align: center;
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