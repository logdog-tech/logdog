<template>
    <div class="wrapper" ref="wrapper" @keydown="handleKeyDown" tabindex="0">
        <div class="content-viewport" ref="viewport" @scroll="handleHorizontalScroll">
            <div class="content-area" ref="contentArea">
                <div v-for="i in visibleItems" :key="i.index" class="item"
                    :style="{ transform: `translateY(${i.top}px)` }">
                    <slot :item="i.item" :index="i.index">
                        {{ i.item }}
                    </slot>
                </div>
            </div>
        </div>
        <div class="fake-scrollbar" ref="fakeScrollbar">
            <div class="fake-thumb" ref="fakeThumb"></div>
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
            this.userLockedToBottom = false; // 添加这一行，取消底部跟随
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
        handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                const selection = window.getSelection();
                if (!selection) return;

                const range = document.createRange();
                range.selectNodeContents(this.refs.contentArea);
                selection.removeAllRanges();
                selection.addRange(range);
            }
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
}

.content-viewport {
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

.content-area {
    position: relative;
    min-height: 100%;
}

.item {
    position: absolute;
    width: 100%;
    height: 18px;
    left: 0;
}

.fake-scrollbar {
    position: absolute;
    top: 0;
    right: 0;
    width: 14px;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 7px;
}

.fake-thumb {
    position: absolute;
    top: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 7px;
    cursor: pointer;
}

.fake-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
}
</style>
<style scoped>
.wrapper {
    position: relative;
        border: 1px solid #ccc;
        overflow: hidden;
        min-width: 80px;
        height: 100%;
        outline: none;
        /* 移除聚焦时的默认边框 */
    }
    
    .content-viewport {
        position: absolute;
        top: 0;
        left: 0;
        right: 16px;
        bottom: 0;
        overflow-x: scroll;
        /* 改为 scroll 确保始终显示横向滚动条 */
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
</style>