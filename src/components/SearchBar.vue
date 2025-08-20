<template>
    <div class="search-container">
                
        <InputGroup class="search-input">
            <CascadeSelect ref="bookmarkModeSelect" v-model="showBookmarkMode" :options="selectedBookmarkModes" optionLabel="cname" optionGroupLabel="cname"
            :optionGroupChildren="['states', 'cities']" class="w-[200px]" @change="emitChangeDisplayMode" >
                <template #value="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-filter mr-2"></i>
                        <span>{{ slotProps.value.cname || slotProps.placeholder }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div class="flex items-center">
                        <i class="pi pi-bookmark mr-2"></i>
                        <span>{{ slotProps.option.cname || slotProps.option.name }}</span>
                    </div>
                </template>
            </CascadeSelect>
            

            <InputGroupAddon :title="$t('searchBar.autoWrap')" @click="toggleAutoWrap" class="cursor-pointer hover:bg-gray-100"
                :class="{ 'icon-selected': isAutoWrap }">
                <i class="pi pi-align-left"></i>
            </InputGroupAddon>
            <InputGroupAddon :title="$t('searchBar.caseSensitive')" @click="toggleCaseSensitive" class="cursor-pointer hover:bg-gray-100"
                :class="{ 'icon-selected': showCaseSensitive }">
                <span>Aa</span>
            </InputGroupAddon>
            <InputGroupAddon :title="$t('searchBar.showHistory')" @click="toggleHistory" class="cursor-pointer hover:bg-gray-100"
                :class="{ 'icon-selected': showHistory }">
                <i class="pi pi-clock"></i>
            </InputGroupAddon>
            <InputText ref="searchInput" :value="localSearchTerm" @input="handleSearchInput"
                @focus="handleFocus" @blur="handleBlur" @keyup.enter="doSearch"
                @keyup.esc="hideHistory" @keydown.up.prevent="navigateHistory('up')"
                @keydown.down.prevent="navigateHistory('down')" :placeholder="$t('search.placeholder')" />
            <PrimeButton :label="$t('search.button')" @click="doSearch" />
        </InputGroup>

        <div v-show="showHistory" class="history-dropdown" @mousedown.prevent ref="historyDropdown">
            <div class="history-header" v-if="history.length > 0">
                <span>{{ $t('searchBar.searchHistory') }}</span>
                <span class="clear-history" v-if="hasNonFavorites" @click="clearNonFavorites">
                    <i class="pi pi-trash"></i>
                    {{ $t('searchBar.clearHistory') }}
                </span>
            </div>
            <div v-if="filteredHistory.length === 0" class="history-empty">
                {{ $t(history.length === 0 ? 'search.no_history' : 'search.no_matches') }}
            </div>
            <div v-else v-for="(item, index) in filteredHistory" :key="index" class="history-items"
                :class="{ 'history-item-selected': selectedIndex === index }">
                <div class="favorite-icon" @click="toggleFavorite(item)">
                    <i class="pi" :class="{ 'pi-star-fill': item.isFavorite, 'pi-star': !item.isFavorite }"></i>
                </div>
                <div class="history-term" @click="useHistoryTerm(item)">{{ item.term }}</div>
                <div class="history-info">
                    <span class="use-count">{{ item.useCount }}{{ $t('searchBar.times') }}</span>
                    <span class="update-time">{{ formatTime(item.updateTime) }}</span>
                </div>
                <div class="remove-icon" @click.stop="handleRemove(item)">
                    <i class="pi pi-times"></i>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import { searchTableHelper } from "../utils/db";
import CascadeSelect from 'primevue/cascadeselect';
import type { CascadeSelectChangeEvent } from 'primevue/cascadeselect';

import { DisplayMode } from "../modules/base";

export interface HistoryItem {
    uuid: string;
    term: string;
    isFavorite: boolean;
    useCount: number;
    updateTime: number;
}

export default {
    name: "SearchBar",
    components: {
        InputText,
        "PrimeButton": Button,
        InputGroup,
        InputGroupAddon,
        CascadeSelect
    },
    props: {
        searchTerm: {
            type: String,
            required: true,
            default: ""
        }
    },

    emits: ['search', 'update:searchTerm', 'toggleHistory', 'toggleCaseSensitive', 'changeDisplayMode', 'toggleAutoWrap'],

    data() {
        return {
            localSearchTerm: this.searchTerm,
            filterText: '',
            history: [] as HistoryItem[],
            showHistory: false,
            selectedIndex: -1,
            showBookmark: true,
            showCaseSensitive: false,
            isAutoWrap: false,
            showBookmarkMode: 
            { cname: this.$t('searchBar.markAndSearch'), code: DisplayMode.MARK_AND_SEARCH },
            selectedBookmarkModes: [
                { cname: this.$t('searchBar.markAndSearch'), code: DisplayMode.MARK_AND_SEARCH },
                { cname: this.$t('searchBar.onlyMark'), code: DisplayMode.ONLY_MARK },
                { cname: this.$t('searchBar.onlySearch'), code: DisplayMode.ONLY_SEARCH }
            ]
        }
    },

    watch: {
        searchTerm(newValue) {
            this.localSearchTerm = newValue;
        }
    },

    computed: {
        filteredHistory(): HistoryItem[] {
            const sorted = [...this.history];

            if (!this.filterText) {
                return sorted;
            }
            const searchLower = this.filterText.toLowerCase();
            return sorted.filter(item =>
                item.term.toLowerCase().includes(searchLower)
            );
        },

        hasNonFavorites(): boolean {
            return this.history.some(item => !item.isFavorite);
        },
    },
    async mounted() {
        // 重要!!! initCopyHandler 函数用于修复"双击复制文本时自动添加多余空格的问题，详见：https://github.com/jasper9w/logdog/issues/21
        this.initCopyHandler();

        // 添加Ctrl+F键盘事件监听器
        document.addEventListener('keydown', this.handleCtrlF);
    },
    beforeUnmount() {
        // 清理事件监听器
        document.removeEventListener('keydown', this.handleCtrlF);
    },

    methods: {
        /**
         * 处理Ctrl+F事件
         */
        handleCtrlF(event: KeyboardEvent) {
            // 检查是否按下了Ctrl+F (在Mac上是Cmd+F)
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                // 阻止浏览器默认的查找行为
                event.preventDefault();
                
                // 使搜索框获得焦点
                if (this.$refs.searchInput) {
                    // Vue 3 中直接使用 ref 引用的元素
                    const searchInput = this.$refs.searchInput as any;
                    // 如果是组件实例，获取其 $el
                    const element = searchInput.$el ? searchInput.$el : searchInput;
                    if (element && typeof element.focus === 'function') {
                        element.focus();
                        
                        // 添加高亮闪烁效果
                        element.classList.add('search-highlight');
                        setTimeout(() => {
                            element.classList.remove('search-highlight');
                        }, 2000); // 2秒后移除高亮效果
                    }
                }
            }
        },
        
        /**
         * 高亮搜索框
         */
        highlightSearchBox() {
            if (this.$refs.searchInput) {
                // Vue 3 中直接使用 ref 引用的元素
                const searchInput = this.$refs.searchInput as any;
                // 如果是组件实例，获取其 $el
                const element = searchInput.$el ? searchInput.$el : searchInput;
                if (element) {
                    element.classList.add('search-highlight');
                    setTimeout(() => {
                        element.classList.remove('search-highlight');
                    }, 2000); // 2秒后移除高亮效果
                }
            }
        },
        
        toggleHistory() {
            this.showHistory = !this.showHistory;
            if (this.showHistory) {
                this.loadHistory();
            }
        },

        emitChangeDisplayMode(event: CascadeSelectChangeEvent) {
            console.log(event.value);
            this.$emit('changeDisplayMode', event.value.code); // code 是 DisplayMode 枚举的值
        },

        toggleAutoWrap() {
            this.isAutoWrap = !this.isAutoWrap;
            this.$emit('toggleAutoWrap', this.isAutoWrap);
        },
        toggleCaseSensitive() {
            this.showCaseSensitive = !this.showCaseSensitive;
            this.$emit('toggleCaseSensitive', this.showCaseSensitive);
        },
        hideHistory() {
            this.showHistory = false;
            this.selectedIndex = -1;
        },

        doSearch() {
            const currentTerm = this.localSearchTerm.trim();
            if (!currentTerm) {
                this.$emit('search', "");
                return;
            };

            this.updateHistory(currentTerm);
            this.hideHistory();
            this.$emit('search', currentTerm);
        },

        generateId(): string {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        },

        async updateHistory(term: string) {
            const existingIndex = this.history.findIndex(item => item.term === term);
            const now = Date.now();

            if (existingIndex !== -1) {
                const existingItem = this.history[existingIndex];
                const updatedItem = {
                    ...existingItem,
                    useCount: existingItem.useCount + 1,
                    updateTime: now
                };

                this.history.splice(existingIndex, 1);
                this.history.unshift(updatedItem);

                try {
                    await searchTableHelper.put(updatedItem);
                } catch (error) {
                    console.error('Failed to update search history:', error);
                }
            } else {
                const newItem: HistoryItem = {
                    uuid: this.generateId(),
                    term,
                    isFavorite: false,
                    useCount: 1,
                    updateTime: now
                };

                this.history.unshift(newItem);
                try {
                    await searchTableHelper.add(newItem);
                } catch (error) {
                    console.error('Failed to save search history:', error);
                }
            }

            const nonFavorites = this.history.filter(item => !item.isFavorite);
            if (nonFavorites.length > 100) {
                const sortedNonFavorites = nonFavorites.sort((a, b) => b.updateTime - a.updateTime);
                const itemsToRemove = sortedNonFavorites.slice(100);

                for (const item of itemsToRemove) {
                    const index = this.history.findIndex(h => h.uuid === item.uuid);
                    if (index !== -1) {
                        this.history.splice(index, 1);
                        await searchTableHelper.delete(item.uuid);
                    }
                }
            }
        },

        async toggleFavorite(item: HistoryItem) {
            item.isFavorite = !item.isFavorite;
            item.updateTime = Date.now();
            await searchTableHelper.put({ ...item });
        },

        useHistoryTerm(item: HistoryItem) {
            this.localSearchTerm = item.term;
            this.$emit('update:searchTerm', item.term);
            this.doSearch();
            this.selectedIndex = -1;
            const input = this.$refs.searchInput as HTMLElement;
            if (input && 'focus' in input) {
                input.focus();
            }
        },

        async handleRemove(item: HistoryItem) {
            const index = this.history.findIndex(h => h.uuid === item.uuid);
            if (index !== -1) {
                try {
                    await searchTableHelper.delete(item.uuid);
                    this.history.splice(index, 1);
                } catch (error) {
                    console.error('Failed to delete search history:', error);
                }
            }

            const input = this.$refs.searchInput as HTMLElement;
            if (input && 'focus' in input) {
                input.focus();
            }

            if (this.filteredHistory.length === 0) {
                this.hideHistory();
            }
        },

        handleSearchInput(event: Event) {
            const target = event.target as HTMLInputElement;
            this.localSearchTerm = target.value;
            this.filterText = target.value;
            this.$emit('update:searchTerm', target.value);
            this.showHistory = true;
            this.selectedIndex = -1;
            this.loadHistory();
        },

        handleBlur(event: FocusEvent) {
            const relatedTarget = event.relatedTarget as HTMLElement;
            if (relatedTarget && this.$el.contains(relatedTarget)) {
                return;
            }

            setTimeout(() => {
                this.hideHistory();
            }, 200);
        },

        handleFocus() {
            this.showHistory = true;
            this.loadHistory();
        },

        navigateHistory(direction: 'up' | 'down') {
            if (!this.showHistory) {
                this.showHistory = true;
                this.loadHistory();
                return;
            }

            const historyLength = this.filteredHistory.length;
            if (historyLength === 0) return;

            if (direction === 'up') {
                if (this.selectedIndex === -1) {
                    this.selectedIndex = historyLength - 1;
                } else {
                    this.selectedIndex = (this.selectedIndex - 1 + historyLength) % historyLength;
                }
            } else {
                if (this.selectedIndex === -1) {
                    this.selectedIndex = 0;
                } else {
                    this.selectedIndex = (this.selectedIndex + 1) % historyLength;
                }
            }

            const selectedItem = this.filteredHistory[this.selectedIndex];
            if (selectedItem) {
                this.localSearchTerm = selectedItem.term;
                this.$emit('update:searchTerm', selectedItem.term);
                this.$nextTick(() => {
                    this.scrollToSelected();
                });
            }
        },

        scrollToSelected() {
            const dropdown = this.$refs.historyDropdown as HTMLElement;
            const selectedElement = dropdown.querySelector('.history-item-selected') as HTMLElement;

            if (dropdown && selectedElement) {
                const dropdownRect = dropdown.getBoundingClientRect();
                const selectedRect = selectedElement.getBoundingClientRect();

                if (selectedRect.top < dropdownRect.top) {
                    dropdown.scrollTop -= (dropdownRect.top - selectedRect.top);
                } else if (selectedRect.bottom > dropdownRect.bottom) {
                    dropdown.scrollTop += (selectedRect.bottom - dropdownRect.bottom);
                }
            }
        },

        formatTime(timestamp: number): string {
            const now = Date.now();
            const diff = now - timestamp;

            // 1分钟内
            if (diff < 60000) {
                return this.$t('searchBar.justNow');
            }
            // 1小时内
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return this.$t('searchBar.minutesAgo', { minutes });
            }
            // 24小时内
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return this.$t('searchBar.hoursAgo', { hours });
            }
            // 30天内
            if (diff < 2592000000) {
                const days = Math.floor(diff / 86400000);
                return this.$t('searchBar.daysAgo', { days });
            }
            // 超过30天
            const date = new Date(timestamp);
            return this.$t('searchBar.dateFormat', { month: date.getMonth() + 1, day: date.getDate() });
        },

        async sortHistory() {
            const sorted = [...this.history].sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) {
                    return a.isFavorite ? -1 : 1;
                }
                return b.updateTime - a.updateTime;
            });
            this.history = sorted;
        },
        
        async loadHistory() {
            try {
                const historyData = await searchTableHelper.getAll();
                this.history = historyData as HistoryItem[] || [];

                await this.sortHistory();


            } catch (error) {
                console.error('Failed to load search history:', error);
                this.history = [];
            }
        },
        
        async clearNonFavorites() {
            try {
                const nonFavorites = this.history.filter(item => !item.isFavorite);
                
                for (const item of nonFavorites) {
                    await searchTableHelper.delete(item.uuid);
                }
                
                this.history = this.history.filter(item => item.isFavorite);
                
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        },
        
        /**
         * 初始化复制事件处理器
         * 修复双击复制文本时自动添加多余空格的问题
         * Initialize copy event handler to fix the issue where double-clicking to copy text 
         * and pasting into an input field adds extra spaces
         */
        initCopyHandler() {
            document.addEventListener('copy', (e) => {
                // 获取用户选中的内容
                // Get the user's selected text content
                const selection = window.getSelection()?.toString() || '';
                
                // 阻止默认的复制行为，以便我们可以自定义复制的内容
                // Prevent the default copy behavior so we can customize the copied content
                e.preventDefault();
                
                // 设置剪贴板的内容为原始选中文本，避免添加额外空格
                // Set the clipboard content to the original selected text without extra spaces
                e.clipboardData?.setData('text/plain', selection);
            });
        }
    },
    
    async created() {
        await this.loadHistory();
    }
}
</script>

<style scoped>
.search-container {
    position: relative;
    width: 100%;
}

.search-input {
    margin: 4px 4px;
    width: calc(100% - 8px);
}

/* 添加 CascadeSelect 宽度控制 */
:deep(.p-cascadeselect) {
    min-width: 160px !important;
    max-width: 200px !important;
    width: auto !important;
    flex: 0 0 auto !important;
}

.action-icon {
    position: relative;
    padding: 0 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    height: 100%;
}

.action-icon:hover {
    color: var(--primary-color);
}

.history-dropdown {
    position: absolute;
    top: 100%;
    left: 4px;
    width: 100%;
    max-width: 600px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-height: 240px;
    overflow-y: auto;
    z-index: 1000;
}

.history-items {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0px 12px;
    border-bottom: 1px solid #eee;
}

.favorite-icon {
    flex: 0 0 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.history-term {
    flex: 1;
    margin: 0 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    cursor: pointer;
    padding: 8px 0px;
}

.history-items:hover {
    background-color: #f5f5f5;
}

.history-empty {
    padding: 8px;
    text-align: center;
    color: #999;
}

.history-item-selected {
    background-color: var(--highlight-bg, #EEF2FF);
    color: var(--highlight-text-color, #1D4ED8);
}

.history-item-selected:hover {
    background-color: var(--highlight-bg, #EEF2FF);
}

.history-item-selected i {
    color: var(--highlight-text-color, #1D4ED8);
}

.history-items i {
    color: var(--text-color-secondary, #64748B);
}

.history-items i.pi-star,
.history-items i.pi-star-o {
    cursor: pointer;
    transition: color 0.2s;
}

.history-items i.pi-star {
    color: var(--primary-color, #4338CA);
}

.history-items i.pi-star:hover {
    color: var(--primary-color-darker, #3730A3);
}

.history-items i.pi-star-o:hover {
    color: var(--primary-color, #4338CA);
}

.favorite-icon,
.remove-icon {
    padding: 4px;
    cursor: pointer;
    z-index: 1;
    opacity: 0.6;
    transition: opacity 0.2s;
}

.remove-icon:hover {
    opacity: 1;
    color: var(--red-600, #DC2626);
}

.history-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
    font-size: 0.85em;
    color: var(--text-color-secondary);
}

.use-count {
    background-color: var(--surface-hover);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.9em;
}

.update-time {
    color: var(--text-color-secondary);
    opacity: 0.8;
}

/* 选中状态下的样式调整 */
.history-item-selected .history-info {
    color: var(--highlight-text-color, #1D4ED8);
    opacity: 0.8;
}

.history-item-selected .use-count {
    background-color: var(--highlight-text-color, #1D4ED8);
    color: white;
    opacity: 0.9;
}

.history-item-selected .update-time {
    color: var(--highlight-text-color, #1D4ED8);
    opacity: 0.8;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    background-color: var(--surface-ground, #f8f9fa);
    font-size: 0.9em;
    color: var(--text-color-secondary);
}

.clear-history {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
}

.clear-history:hover {
    background-color: var(--surface-hover);
    color: var(--red-600);
}

.clear-history i {
    font-size: 0.9em;
}
.icon-selected {
    background-color: var(--surface-hover, #f0f0f0);
    color: var(--primary-color, rgb(59 130 246));
}

.icon-selected i, 
.icon-selected span {
    font-weight: 600;
    color: var(--primary-color, rgb(59 130 246));
}

/* 搜索框高亮闪烁效果 */
.search-highlight {
    animation: highlight 0.5s ease-in-out 3;
}

@keyframes highlight {
    0% { box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); }
    50% { box-shadow: 0 0 20px rgba(0, 123, 255, 0.9); }
    100% { box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); }
}
</style>