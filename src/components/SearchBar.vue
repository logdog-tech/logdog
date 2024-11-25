<template>
    <div class="search-container">
        <InputGroup class="search-input">
            <InputGroupAddon @click="toggleHistory" class="cursor-pointer hover:bg-gray-100" >
                <i class="pi pi-clock"></i>
            </InputGroupAddon>
            <InputText 
                ref="searchInput"
                :value="localSearchTerm"
                @input="handleSearchInput"
                @focus="showHistory = true && loadHistory()"
                @blur="handleBlur"
                @keyup.enter="doSearch"
                @keyup.esc="hideHistory"
                @keydown.up.prevent="navigateHistory('up')"
                @keydown.down.prevent="navigateHistory('down')"
                placeholder="输入搜索关键词"
            />
            <PrimeButton label="搜索" @click="doSearch" />
        </InputGroup>

        <div v-show="showHistory" 
            class="history-dropdown" 
            @mousedown.prevent
            ref="historyDropdown"
        >
            <div class="history-header" v-if="history.length > 0">
                <span>搜索历史</span>
                <span class="clear-history" 
                    v-if="hasNonFavorites"
                    @click="clearNonFavorites"
                >
                    <i class="pi pi-trash"></i>
                    清除历史
                </span>
            </div>
            <div v-if="filteredHistory.length === 0" class="history-empty">
                {{ history.length === 0 ? '暂无搜索历史' : '没有匹配的历史记录' }}
            </div>
            <div v-else v-for="(item, index) in filteredHistory" 
                :key="index" 
                class="history-items"
                :class="{ 'history-item-selected': selectedIndex === index }"
            >
                <div class="favorite-icon" @click="toggleFavorite(item)">
                    <i class="pi" :class="{'pi-star-fill': item.isFavorite, 'pi-star': !item.isFavorite}"></i>
                </div>
                <div class="history-term" @click="useHistoryTerm(item)">{{ item.term }}</div>
                <div class="history-info">
                    <span class="use-count">{{ item.useCount }}次</span>
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
    },
    props: {
        searchTerm: {
            type: String,
            required: true,
            default: ""
        }
    },
    
    emits: ['search', 'update:searchTerm'],
    
    data() {
        return {
            localSearchTerm: this.searchTerm,
            filterText: '',
            history: [] as HistoryItem[],
            showHistory: false,
            selectedIndex: -1
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
    
    methods: {
        toggleHistory() {
            this.showHistory = !this.showHistory;
            if (this.showHistory) {
                this.loadHistory();
            }
        },
        
        hideHistory() {
            this.showHistory = false;
            this.selectedIndex = -1;
        },
        
        doSearch() {
            const currentTerm = this.localSearchTerm.trim();
            if (!currentTerm) return;
            
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
            await searchTableHelper.put({...item});
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
                return '刚刚';
            }
            // 1小时内
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return `${minutes}分钟前`;
            }
            // 24小时内
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `${hours}小时前`;
            }
            // 30天内
            if (diff < 2592000000) {
                const days = Math.floor(diff / 86400000);
                return `${days}天前`;
            }
            // 超过30天
            const date = new Date(timestamp);
            return `${date.getMonth() + 1}月${date.getDate()}日`;
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
</style>