<template>
    <div class="wrapper" ref="wrapper" @keydown="handleKeyDown" tabindex="0">
        <div class="content-viewport" ref="viewport" @scroll="handleHorizontalScroll" @mousedown="handleMouseDown"
            @copy="handleCopy" @contextmenu="handleContextMenu">
            <div class="content-area" ref="contentArea">
                <div v-for="i in visibleItems" :key="i.index" class="item"
                    :style="{ transform: `translateY(${i.top}px)` }">
                    <slot :isSelected="isItemSelected(i.index)" :item="i.item" :index="i.index">
                        {{ i.item }}
                    </slot>
                </div>
            </div>
        </div>
        <div class="fake-scrollbar" ref="fakeScrollbar">
            <div class="fake-thumb" ref="fakeThumb"></div>
        </div>

        <div v-if="showContextMenu" class="context-menu"
            :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }" @mousedown.stop>
            <div class="context-menu-item" @click="handleCopy">
                <span class="menu-icon">📋</span>
                {{ $t('hugeList.copy') }}
                <span class="shortcut">⌘C</span>
            </div>
            <div class="context-menu-item" @click="selectAll">
                <span class="menu-icon">☑️</span>
                {{ $t('hugeList.selectAll') }}
                <span class="shortcut">⌘A</span>
            </div>
            <div class="menu-divider"></div>
            <div class="context-menu-item" @click="exportSelectedLogs">
                <span class="menu-icon">📥</span>
                {{ $t('hugeList.exportLogs') }}
            </div>
            <div class="context-menu-item" @click="scrollToSelection">
                <span class="menu-icon">🔍</span>
                {{ $t('hugeList.locateRow') }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export interface ComponentRefs {
    wrapper: HTMLElement;
    viewport: HTMLElement;
    fakeScrollbar: HTMLElement;
    fakeThumb: HTMLElement;
    contentArea: HTMLElement;
}

export interface DataSource<T> {
    getCount(): Promise<number>;
    getItem(index: number): Promise<T>;
}

export default defineComponent({
    name: "HugeList",
    props: {
        dataSource: {
            type: Object as () => DataSource<any>,
            required: true,
        }
    },
    data() {
        return {
            ITEM_HEIGHT: 18,
            SCROLL_SENSITIVITY: 1.5,
            BUFFER_SIZE: 5,
            scrollOffsetPx: 0,
            maxScrollPx: 0,
            width: 0,
            height: 0,
            resizeObserver: null as ResizeObserver | null,
            lastScrollLeft: 0,
            dataVersion: 0 as number,
            refs: {} as ComponentRefs,
            isUpdating: false,
            updateQueue: 0,
            lastUpdateTime: 0,
            userLockedToBottom: true,
            totalCount: 0,
            items: [] as Array<{ index: number; item: any; top: number }>,
            selectionStart: -1,
            selectionEnd: -1,
            selectionAnchor: -1,
            isSelecting: false,
            showContextMenu: false,
            contextMenuX: 0,
            contextMenuY: 0,
        };
    },
    computed: {
        visibleItems() {
            return this.items;
        }
    },
    watch: {
        scrollOffsetPx: {
            handler() {
                this.updateVisibleItems();
            }
        },
        dataSource: {
            handler() {
                this.initializeData();
            },
            immediate: true
        }
    },
    mounted() {
        const wrapper = this.$refs.wrapper as HTMLElement;
        const viewport = this.$refs.viewport as HTMLElement;
        const fakeScrollbar = this.$refs.fakeScrollbar as HTMLElement;
        const fakeThumb = this.$refs.fakeThumb as HTMLElement;
        const contentArea = this.$refs.contentArea as HTMLElement;

        this.refs = {
            wrapper,
            viewport,
            fakeScrollbar,
            fakeThumb,
            contentArea
        };

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.width = width;
                this.height = height;
                this.validateScrollPosition();
                this.updateScrollbar();
            }
        });

        if (this.resizeObserver) {
            this.resizeObserver.observe(wrapper);
        }

        this.validateScrollPosition();
        this.setScrollOffset(0);
        this.refs.wrapper.addEventListener('wheel', this.handleWheel, { passive: false });
        this.addDragEvents();
        this.refs.wrapper.focus();
        this.refs.fakeScrollbar.addEventListener('click', this.handleTrackClick);
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        isCloseToThirdFromBottom() {
            const startIndex = Math.floor(this.scrollOffsetPx / this.ITEM_HEIGHT);
            const visibleCount = Math.ceil(this.height / this.ITEM_HEIGHT) + this.BUFFER_SIZE;
            const lastVisibleIndex = startIndex + visibleCount - 1;
            return lastVisibleIndex >= (this.totalCount - 2);
        },
        async initializeData() {
            try {
                this.totalCount = await this.dataSource.getCount();
                this.maxScrollPx = Math.max(0, this.totalCount * this.ITEM_HEIGHT - this.height);
                this.updateVisibleItems();
            } catch (error) {
                console.error('Failed to initialize data:', error);
            }
        },
        async updateVisibleItems() {
            if (this.totalCount === 0) {
                this.items = [];
                return;
            }

            const startIndex = Math.floor(this.scrollOffsetPx / this.ITEM_HEIGHT);
            const visibleCount = Math.ceil(this.height / this.ITEM_HEIGHT) + this.BUFFER_SIZE;

            const safeStartIndex = Math.max(0, startIndex);
            const safeEndIndex = Math.min(this.totalCount, safeStartIndex + visibleCount);

            try {
                const itemPromises = Array.from(
                    { length: safeEndIndex - safeStartIndex },
                    async (_, i) => {
                        const index = safeStartIndex + i;
                        const item = await this.dataSource.getItem(index);
                        return {
                            index,
                            item,
                            top: index * this.ITEM_HEIGHT - this.scrollOffsetPx
                        };
                    }
                );

                this.items = await Promise.all(itemPromises);
            } catch (error) {
                console.error('Failed to update visible items:', error);
            }
        },
        scrollToBottom() {
            this.setScrollOffset(this.maxScrollPx, true);
        },
        scrollToTop() {
            this.setScrollOffset(0);
        },
        scrollToIndex(index: number) {
            const offset = index * this.ITEM_HEIGHT;
            this.userLockedToBottom = false;
            this.setScrollOffset(offset);
        },
        updateScrollbar() {
            const scrollbarTrack = this.refs.fakeScrollbar;
            const thumb = this.refs.fakeThumb;
            if (!scrollbarTrack || !thumb) return;

            const totalHeight = this.totalCount * this.ITEM_HEIGHT;

            if (totalHeight <= this.height) {
                thumb.style.display = 'none';
                this.scrollOffsetPx = 0;
                this.maxScrollPx = 0;
                return;
            }

            thumb.style.display = 'block';
            this.maxScrollPx = totalHeight - this.height;

            const trackHeight = scrollbarTrack.clientHeight;
            const thumbHeight = Math.max(40, trackHeight * (this.height / totalHeight));
            thumb.style.height = `${thumbHeight}px`;

            const scrollRatio = this.scrollOffsetPx / this.maxScrollPx;
            const thumbY = (trackHeight - thumbHeight) * scrollRatio;
            thumb.style.transform = `translateY(${thumbY}px)`;
        },
        setScrollOffset(newOffsetPx: number, forceBottom = false) {
            const totalHeight = this.totalCount * this.ITEM_HEIGHT;

            if (totalHeight <= this.height) {
                this.scrollOffsetPx = 0;
                this.maxScrollPx = 0;
                this.updateScrollbar();
                return;
            }

            requestAnimationFrame(() => {
                if (forceBottom) {
                    this.scrollOffsetPx = this.maxScrollPx;
                    this.userLockedToBottom = true;
                } else {
                    this.scrollOffsetPx = Math.max(0, Math.min(newOffsetPx, this.maxScrollPx));
                    if (this.isCloseToThirdFromBottom()) {
                        this.userLockedToBottom = true;
                    }
                }
                this.updateScrollbar();
            });
        },
        handleWheel(e: WheelEvent) {
            e.preventDefault();
            const viewport = this.refs.viewport;

            if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                const newScrollLeft = viewport.scrollLeft + (e.deltaX || e.deltaY);
                viewport.scrollLeft = newScrollLeft;
                return;
            }

            const delta = e.deltaY * this.SCROLL_SENSITIVITY;
            const newOffset = this.scrollOffsetPx + delta;

            if (delta < 0) {
                this.userLockedToBottom = false;
            }

            this.setScrollOffset(newOffset);
        },
        handleHorizontalScroll(e: Event) {
            const target = e.target as HTMLElement;
            const scrollLeft = target.scrollLeft;
            if (scrollLeft !== this.lastScrollLeft) {
                this.lastScrollLeft = scrollLeft;
            }
        },
        addDragEvents() {
            const thumb = this.refs.fakeThumb;
            if (!thumb) return;

            let isDragging = false;
            let dragStartY = 0;
            let dragStartOffset = 0;

            thumb.addEventListener('mousedown', (e: MouseEvent) => {
                isDragging = true;
                dragStartY = e.clientY;
                dragStartOffset = this.scrollOffsetPx;
                document.body.style.userSelect = 'none';
                this.userLockedToBottom = false;
            });

            document.addEventListener('mousemove', (e: MouseEvent) => {
                if (!isDragging) return;
                const scrollbarTrack = this.refs.fakeScrollbar;
                const thumb = this.refs.fakeThumb;
                if (!scrollbarTrack || !thumb) return;

                const trackHeight = scrollbarTrack.clientHeight;
                const thumbHeight = thumb.clientHeight;
                const deltaY = e.clientY - dragStartY;
                const ratio = deltaY / (trackHeight - thumbHeight);
                const newOffsetPx = dragStartOffset + ratio * this.maxScrollPx;
                this.setScrollOffset(newOffsetPx);
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.userSelect = '';
                }
            });
        },
        handleMouseDown(e: MouseEvent) {
            // 如果是右键点击，不处理任何选择逻辑
            if (e.button === 2) {
                return;
            }

            const rect = this.refs.viewport.getBoundingClientRect();
            const y = e.clientY - rect.top + this.refs.viewport.scrollTop;
            const index = Math.floor((y + this.scrollOffsetPx) / this.ITEM_HEIGHT);

            if (!e.shiftKey) {
                this.selectionStart = index;
                this.selectionEnd = -1;
                this.selectionAnchor = -1;
            }
            
            if (index >= 0 && index < this.totalCount) {
                // 记录初始点击位置
                const initialY = y;
                
                if (e.shiftKey && this.selectionStart !== -1) {
                    // Shift 键选择的逻辑保持不变
                    if (this.selectionAnchor === -1) {
                        this.selectionAnchor = this.selectionStart;
                    }
                    if (Math.abs(index - this.selectionAnchor) < Math.abs(this.selectionEnd - this.selectionAnchor)) {
                        this.selectionEnd = this.selectionAnchor;
                        this.selectionStart = index;
                    } else {
                        this.selectionStart = this.selectionAnchor;
                        this.selectionEnd = index;
                    }
                    this.isSelecting = true;
                    // 跨行选择时禁用默认文本选择
                    e.preventDefault();
                } else {
                    // 普通点击，先不设置选择范围，等待可能的拖动
                    this.selectionAnchor = index;
                }

                const handleMouseMove = (e: MouseEvent) => {
                    const currentY = e.clientY - rect.top + this.refs.viewport.scrollTop;
                    const currentIndex = Math.floor((currentY + this.scrollOffsetPx) / this.ITEM_HEIGHT);

                    // 只有在跨行时才启用自定义选择
                    if (currentIndex !== index) {
                        // 如果开始跨行，禁用默认文本选择
                        document.body.style.userSelect = 'none';
                        this.isSelecting = true;
                        this.selectionStart = Math.min(index, currentIndex);
                        this.selectionEnd = Math.max(index, currentIndex);
                    }
                };

                const handleMouseUp = () => {
                    // 恢复默认文本选择
                    document.body.style.userSelect = '';
                    this.isSelecting = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);

                    // 如果没有跨行，清除选择状态
                    if (this.selectionStart === this.selectionEnd) {
                        this.selectionStart = -1;
                        this.selectionEnd = -1;
                        this.selectionAnchor = -1;
                    }
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        },

        handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                this.selectionStart = 0;
                this.selectionEnd = this.totalCount - 1;
                this.selectionAnchor = 0;
            }
            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                this.handleCopy(e);
            }
        },

        isItemSelected(index: number) {
            // 只在有效的选择范围时返回true
            if (this.selectionStart === -1 || this.selectionEnd === -1) {
                return false;
            }
            const start = Math.min(this.selectionStart, this.selectionEnd);
            const end = Math.max(this.selectionStart, this.selectionEnd);
            return index >= start && index <= end;
        },

        async handleCopy(e: Event) {
            // 如果有自定义选择范围，处理多行复制
            if (this.selectionStart !== -1 && this.selectionEnd !== -1) {
                e.preventDefault();
                const start = Math.min(this.selectionStart, this.selectionEnd);
                const end = Math.max(this.selectionStart, this.selectionEnd);
                
                // 检查选中的行数
                const selectedLines = end - start + 1;
                if (selectedLines > 10000) {
                    console.warn('选中内容超过10000行，请使用导出功能复制');

                    // 使用 ElMessage 显示警告
                    this.$toast.add({ severity: 'error', summary: $t('hugeList.error'), detail: $t('hugeList.copyFail'), life: 3000 });

                    return;
                }

                try {
                    const selectedContent = [];
                    for (let i = start; i <= end; i++) {
                        const item = await this.dataSource.getItem(i);
                        // 如果item是对象，获取其显示文本
                        const text = typeof item === 'object' ? 
                            (item.text || item.content || item.toString() || JSON.stringify(item)) : 
                            String(item);
                        selectedContent.push(text);
                    }
                    
                    await navigator.clipboard.writeText(selectedContent.join('\n'));
                    console.log('Copied multi-line content:', selectedContent.length, 'lines');
                } catch (err) {
                    console.error('Failed to copy multi-line content:', err);
                    this.$toast.add({ severity: 'error', summary: $t('hugeList.error'), detail: $t('hugeList.copyFail'), life: 3000 });
                }
            }
            // 否则让浏览器处理默认的复制行为
        },
        handleTrackClick(e: MouseEvent) {
            if (e.target === this.refs.fakeThumb) return;

            this.userLockedToBottom = false;

            const track = this.refs.fakeScrollbar;
            const thumb = this.refs.fakeThumb;
            const trackRect = track.getBoundingClientRect();
            const thumbHeight = thumb.offsetHeight;

            const clickOffset = e.clientY - trackRect.top;
            const scrollRatio = clickOffset / (trackRect.height - thumbHeight);
            const newScrollOffset = scrollRatio * this.maxScrollPx;

            this.setScrollOffset(newScrollOffset);
        },
        async handleContextMenu(e: MouseEvent) {
            e.preventDefault();

            // 使用鼠标相对于页面的位置
            this.contextMenuX = e.pageX;
            this.contextMenuY = e.pageY;

            const rect = this.refs.viewport.getBoundingClientRect();
            const clickY = e.clientY + this.refs.viewport.scrollTop - rect.top;
            const clickedIndex = Math.floor(clickY / this.ITEM_HEIGHT);

            if (clickedIndex >= 0 && clickedIndex < this.totalCount) {
                // 检查点击的行是否在选中范围内
                const isClickedLineSelected = this.isItemSelected(clickedIndex);
                if (!isClickedLineSelected) {
                    // 如果点击的不是选中行，重置选择状态
                    this.selectionStart = clickedIndex;
                    this.selectionEnd = clickedIndex;
                    this.selectionAnchor = clickedIndex;
                }
            }

            this.showContextMenu = true;

            const closeMenu = () => {
                this.showContextMenu = false;
                document.removeEventListener('click', closeMenu);
            };
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 0);
        },

        async exportSelectedLogs() {
            if (this.selectionStart === -1 || this.selectionEnd === -1) return;
            
            const start = Math.min(this.selectionStart, this.selectionEnd);
            const end = Math.max(this.selectionStart, this.selectionEnd);
            
            try {
                const logs = [];
                for (let i = start; i <= end; i++) {
                    const item = await this.dataSource.getItem(i);
                    if (item && typeof item === 'object' && 'contentKey' in item) {
                        logs.push(item.contentKey);
                    } else {
                        logs.push(String(item));
                    }
                }
                
                const content = logs.join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                a.download = `logs_${start}_to_${end}_${timestamp}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('导出日志失败:', error);
            }
        },
        selectAll() {
            this.selectionStart = 0;
            this.selectionEnd = this.totalCount - 1;
            this.selectionAnchor = 0;
            this.showContextMenu = false;
        },

        scrollToSelection() {
            if (this.selectionStart === -1 || this.selectionEnd === -1) return;
            const targetIndex = this.selectionStart;
            this.scrollToIndex(targetIndex);
            this.showContextMenu = false;
        },
        validateScrollPosition() {
            const totalHeight = this.totalCount * this.ITEM_HEIGHT;
            if (totalHeight <= this.height) {
                this.scrollOffsetPx = 0;
                this.maxScrollPx = 0;
            } else {
                this.maxScrollPx = totalHeight - this.height;
                this.scrollOffsetPx = Math.min(this.scrollOffsetPx, this.maxScrollPx);
            }
        },
        async flush() {
            await this.initializeData();
            this.validateScrollPosition();

            if (this.userLockedToBottom) {
                this.scrollOffsetPx = this.maxScrollPx;
            }

            this.dataVersion++;
            this.$forceUpdate();

            this.$nextTick(() => {
                this.updateScrollbar();
            });
        },
        scroolToBottomIfNecessary() {
            this.debounceUpdate(() => {
                this.validateScrollPosition();
                if (this.userLockedToBottom) {
                    requestAnimationFrame(() => {
                        this.setScrollOffset(this.maxScrollPx, true);
                        this.flush();
                    });
                } else {
                    this.flush();
                }
            });
        },
        debounceUpdate(fn: Function) {
            const now = Date.now();
            if (now - this.lastUpdateTime < 16) {
                this.updateQueue++;
                if (!this.isUpdating) {
                    this.isUpdating = true;
                    requestAnimationFrame(() => {
                        fn();
                        this.isUpdating = false;
                        this.updateQueue = 0;
                        this.lastUpdateTime = Date.now();
                    });
                }
                return;
            }

            this.lastUpdateTime = now;
            fn();
        }
    }
});
</script>

<style scoped>
.wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    outline: none;
    border: 1px solid #ccc;
    overflow: hidden;
    min-width: 80px;
    /* 移除聚焦时的默认边框 */
}

.content-viewport {
    position: absolute;
    top: 0;
    left: 0;
    right: 16px;
    bottom: 0;
    overflow-x: scroll;
    overflow-y: hidden;
}

.content-area {
    position: relative;
    min-width: 100%;
    height: 100%;
}

.fake-scrollbar {
    position: absolute;
    right: 0;
    top: 0;
    width: 16px;
    height: 100%;
    background-color: transparent;
    border-left: none;
    transition: background-color 0.2s;
}

.fake-scrollbar:hover {
    background-color: rgba(0, 0, 0, 0.03);
    /* 悬停时显示轨道 */
}

.fake-thumb {
    position: absolute;
    top: 0;
    left: 3px;
    width: 10px;
    height: 80px;
    min-height: 40px;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.fake-thumb:hover,
.fake-thumb:active {
    background-color: rgba(0, 0, 0, 0.25);
    width: 12px;
    left: 2px;
}

/* 横向滚动条样式 */
.content-viewport::-webkit-scrollbar {
    height: 16px;
}

.content-viewport::-webkit-scrollbar-track {
    background: transparent;
}

.content-viewport::-webkit-scrollbar-track:hover {
    background: rgba(0, 0, 0, 0.03);
}

.content-viewport::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    border: 4px solid transparent;
    background-clip: padding-box;
    min-width: 60px;
}

.content-viewport::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.25);
    border: 4px solid transparent;
}

/* 每条数据样式 */
.item {
    position: absolute;
    left: 0;
    height: 18px;
    box-sizing: border-box;
    white-space: nowrap;
    padding: 0 4px;
    width: fit-content;
    min-width: 100%;
}

/* 增加选中样式的优先级 */
.wrapper .content-viewport .content-area .item.selected {
    background-color: rgba(0, 122, 255, 0.1) !important;
    z-index: 1;
}

.context-menu {
    position: fixed;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    padding: 6px 0;
    min-width: 200px;
    font-size: 13px;
    color: #333;
    user-select: none;
}

.context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
}

.context-menu-item:hover {
    background-color: #f5f7fa;
}

.menu-icon {
    margin-right: 8px;
    width: 16px;
    text-align: center;
}

.shortcut {
    margin-left: auto;
    color: #999;
    font-size: 12px;
}

.menu-divider {
    height: 1px;
    background-color: #eee;
    margin: 4px 0;
}
</style>