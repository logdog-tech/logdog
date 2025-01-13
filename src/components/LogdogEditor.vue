<template>
    <Splitter class="logdog-editor" layout="vertical">
        <SplitterPanel style="width: 100%; height: 100%; min-height: 100px">
            <div class="h-full flex flex-col">
                <HugeList ref="logFullView" class="border border-surface-200 dark:border-surface-700 rounded m-[4px]"
                    :dataSource="dataSource">
                    <template #default="{ item, index }">
                        <div class="log-item" :class="[
    'flex items-center',
    { 'glow-border': item.line === selectedline },
    { 'bg-surface-100 dark:bg-surface-700': index % 2 === 0 },
]">
                            <div v-if="item.line === selectedline" :key="animationKey" class="border-animation" />
                            <div class="line-number" contenteditable="false" v-html="item.line" />
                            <div class="content" v-html="renderLogItem(item)" @mouseup="handleTextSelection" />
                        </div>
                    </template>
                </HugeList>
            </div>
        </SplitterPanel>
        <SplitterPanel style="width: 100%; height: 100%; min-height: 100px; ">
            <div class="h-full flex flex-col">
                <SearchBar :searchTerm="searchTerm" @search="searchLogs" @update:searchTerm="handleSearchInput" />

                <HugeList class="border border-surface-200 dark:border-surface-700 rounded mx-[4px] mb-[4px]"
                    style="flex-grow: 1; overflow: hidden;" ref="logSearchView" :dataSource="searchDataSource">
                    <template #default="{ item, index }">
                        <div class="log-item" @click="onClickSearchItem(item, index)" :class="[
                            'flex items-center',
                            { 'glow-border': item.line === selectedline },
                            { 'bg-surface-100 dark:bg-surface-700': index % 2 === 0 },
                        ]">
                            <div v-if="item.line === selectedline" :key="animationKey" class="border-animation" />
                            <div class="line-number" contenteditable="false" v-html="item.line" />
                            <div class="content" v-html="renderLogItem(item)" @mouseup="handleTextSelection" />
                        </div>
                    </template>
                </HugeList>
                <div class="bottom-status-bar">
                    共计 {{ totalCount }} 行，找到 {{ searchCount }} 行
                </div>
            </div>
        </SplitterPanel>
    </Splitter>
    <ColorSelecter @picked="handleColorPicked" :show="showColorSelecter" :x="selectionRect?.right"
        :y="selectionRect?.top" />
</template>

<script lang="ts">
import VirtualScroller from "primevue/virtualscroller";
import HugeList from "./HugeList.vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import ColorSelecter from "./ColorSelecter.vue";
import SearchBar from "./SearchBar.vue";
import type { BaseLine, Rule } from "../modules/base";
import type { PropType } from "vue";
import { defineComponent } from 'vue';
import type { ComponentRefs } from './HugeList.vue';
import type { DataSource } from './HugeList.vue';
import { proxyProvider } from "../utils/providers/ProxyProvider";
import { type Observer } from "../utils/providers/define";
import { hashColor } from "../utils/colors";
import { highlightIt } from "../utils/highlighter";

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
        VirtualScroller,
        Splitter,
        SplitterPanel,
        ColorSelecter,
        SearchBar,
        HugeList,
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
    data() {
        return {
            dataSource: {
                async getCount() {
                    const count = await proxyProvider.getTotalLineCount();
                    return count;
                },
                async getItem(index: number) {
                    const tmp = await proxyProvider.getLine(index);
                    return tmp;
                }
            } as DataSource<BaseLine>,
            searchDataSource: {
                async getCount() {
                    return await proxyProvider.getFilteredLineCount();
                },
                async getItem(index: number) {
                    const tmp = await proxyProvider.getFilteredLine(index);
                    return tmp;
                }
            } as DataSource<BaseLine>,
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
            updateCountTimer: null as any,
            animationKey: 0,  // 添加动画key
        };
    },
    mounted() {
        const myObserver = {
            onChange: async () => {
                console.log("dbg onChange");
                const logFullView = this.$refs.logFullView as LogViewRef;
                const logSearchView = this.$refs.logSearchView as LogViewRef;

                this.totalCount = await proxyProvider.getTotalLineCount();
                this.searchCount = await proxyProvider.getFilteredLineCount();
                logFullView.flush();
                logSearchView.flush();
            }
        } as Observer;
        proxyProvider.subscribe(myObserver);
    },
    methods: {
        onClickSearchItem(item: BaseLine, index: number) {
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
                    const mem_func = new Function('return ' + func.custom_function)()
                    result = mem_func(line.filename, line.line, result)
                } catch (error) {
                    console.error(`Error in function "${func.custom_function}":`, error)
                }
            }

            // s2, 执行所有高亮任务
            const keywords = [
                "" + line.pid + " ",
                " " + line.tid + " ",
                " " + line.level + " ",
            ];
            result = this.highlights(line);

            return result;
        },
        handleColorPicked(style: StyleObject) {
            console.log("handleColorPicked", style);
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
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            this.selectionRect = rect ?? null;
            this.selectedText = selection?.toString() ?? "";
            // 如果选中内容长度大于0，则显示颜色选择器
            if (this.selectedText) {
                this.showColorSelecter = true;
            } else {
                this.showColorSelecter = false;
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
        highlights(line: BaseLine, autoHashHightlightByKeyworkds: string[] = []): string {
            const useColors = [] as { pattern: string | RegExp; style: StyleObject }[]

            const colorItems = this.colors.filter((c) => c._checked)
            for (const c of colorItems) {
                useColors.push({ pattern: c.pattern, style: { color: c.fg_color, "background-color": c.bg_color } } as { pattern: string | RegExp; style: StyleObject });
            }

            for (const keyword of autoHashHightlightByKeyworkds) {
                useColors.push({ pattern: keyword, style: { color: hashColor(keyword) } } as { pattern: string | RegExp; style: StyleObject });
            }
            // TODO 添加临时高亮规则
            useColors.push(...Object.entries(this.sessionColors).map(([text, style]) => ({ pattern: text, style: style })));

            const searchPatternItems = this.searchTerm.split("|");
            for (const pattern of searchPatternItems) {
                const regex = new RegExp(pattern, 'gi');
                // 避免regex为空
                if (!pattern) {
                    continue;
                }
                useColors.push({ pattern: regex, style: { color: "red" } });
            }

            return highlightIt(line.content + " ", useColors);
        },
        handleSearchInput(currentTerm: string) {
            console.log("handleSearchInput")
            const terms = currentTerm.split("|");
            for (const ff of this.filters) {
                ff._checked = ff.pattern ? terms.includes(ff.pattern) : false;
            }
        },
        async searchLogs(currentTerm: string) {
            this.searchTerm = currentTerm;
            console.log("Searching for:", this.searchTerm);

            await proxyProvider.useFilter(this.searchTerm);
            const logSearchView = this.$refs.logSearchView as LogViewRef;
            logSearchView.scrollToTop();
            logSearchView.flush();
        },
        handleSearchItemClick(item: { line: number; content: string }) {
            const logFullView = this.$refs.logFullView as LogViewRef;
            logFullView.scrollToIndex(item.line - 8);
            this.selectedline = item.line;
        },
        async handleUserToggleItems(type: string, item: Rule) {
            console.log('====handleUserToggleItems', type, item.pattern, item._checked, item);
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
                this.searchTerm = searchBoxPatterns.filter((f) => f).join("|");

                await this.searchLogs(this.searchTerm);
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

:deep(span) {
    display: inline-block !important;
}

.search-input {
    padding: 0 4px;
    margin: 4px 0px;
    height: 32px;
}

.bottom-status-bar {
    height: 20px;
    background-color: #f0f0f0;
    padding-left: 4px;
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

.log-item {
    height: 18px;
    white-space: pre;
    font-family: monospace;
    position: relative;
}

.log-item:hover::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid darkgray;
    border-bottom: 1px solid darkgray;
    pointer-events: none;
    z-index: 9;
}

.glow-border {
    position: relative;
}

.border-animation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid darkgray;
    border-bottom: 1px solid darkgray;
    pointer-events: none;
    z-index: 10;
    animation: borderPulse 500ms ease-in-out;
}

@keyframes borderPulse {
    0% {
        border-color: #10a37f;
        box-shadow: 0 0 8px rgba(16, 163, 127, 0.6);
    }

    33% {
        border-color: #0ea5e9;
        box-shadow: 0 0 8px rgba(14, 165, 233, 0.6);
    }

    66% {
        border-color: #8b5cf6;
        box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
    }

    100% {
        border-color: darkgray;
        box-shadow: none;
    }
}

.line-number {
    position: sticky;
    left: 0;
    min-width: 50px;
    text-align: right;
    padding-right: 4px;
    padding-left: 8px;
    color: gray;
    font-family: monospace;
    background-color: #f3f3f3;
    user-select: none;
}

.content {
    overflow-x: auto;
    flex-grow: 1;
    padding-left: 4px;
}
</style>
