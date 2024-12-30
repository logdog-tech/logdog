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

// 将接口声明为导出类型
export interface ComponentRefs {
    wrapper: HTMLElement;
    viewport: HTMLElement;
    fakeScrollbar: HTMLElement;
    fakeThumb: HTMLElement;
    contentArea: HTMLElement;
}

export default defineComponent({
    name: "HugeList",
    props: {
        dataSource: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            // 每项高度(px)
            ITEM_HEIGHT: 18,
            // 滚轮滚动灵敏度
            SCROLL_SENSITIVITY: 1.5,
            // 缓冲渲染的条目数
            BUFFER_SIZE: 5,
            // 当前已滚动的像素数
            scrollOffsetPx: 0,
            // 最大滚动像素数
            maxScrollPx: 0,
            width: 0,
            height: 0,
            resizeObserver: null as ResizeObserver | null,
            lastScrollLeft: 0, // 新增：记录横向滚动位置
            dataVersion: 0 as number,
            refs: {} as ComponentRefs
        };
    },
    computed: {

        visibleItems() {
            const dataVersion = this.dataVersion;
            const totalCount = this.dataSource.getCount();

            // 如果没有数据，直接返回空数组
            if (totalCount === 0) {
                return [];
            }

            const startIndex = Math.floor(this.scrollOffsetPx / this.ITEM_HEIGHT);
            const visibleCount = Math.ceil(this.height / this.ITEM_HEIGHT) + this.BUFFER_SIZE;

            // 确保 startIndex 不会小于0
            const safeStartIndex = Math.max(0, startIndex);
            // 确保 endIndex 不会超过数据总量
            const safeEndIndex = Math.min(totalCount, safeStartIndex + visibleCount);

            // 使用安全的索引范围创建数组
            return Array.from({ length: safeEndIndex - safeStartIndex }, (_, i) => {
                const index = safeStartIndex + i;
                return {
                    index,
                    item: this.dataSource.getItem(index),
                    top: index * this.ITEM_HEIGHT - this.scrollOffsetPx
                };
            });
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

        // 使用类型断言
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.width = width;
                this.height = height;

                // 验证并修正滚动位置
                this.validateScrollPosition();

                // 更新滚动条
                this.updateScrollbar();
            }
        });

        if (this.resizeObserver) {
            this.resizeObserver.observe(wrapper);
        }

        // 验证并修正初始滚动位置
        this.validateScrollPosition();

        // 初始化滚动位置为0
        this.setScrollOffset(0);

        // 加入滚轮事件
        this.refs.wrapper.addEventListener('wheel', this.handleWheel, { passive: false });

        // 添加拖拽事件
        this.addDragEvents();

        // 使 wrapper 可聚焦以接收键盘事件
        this.refs.wrapper.focus();

        // 添加轨道点击事件
        this.refs.fakeScrollbar.addEventListener('click', this.handleTrackClick);
    },
    beforeDestroy() {
        // 清理 ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        scrollToBottom() {
            this.setScrollOffset(this.maxScrollPx, true);
        },
        scrollToTop() {
            this.setScrollOffset(0);
        },
        scrollToIndex(index: number) {
            this.setScrollOffset(index * this.ITEM_HEIGHT);
        },
        // 更新滚动条
        updateScrollbar() {
            const scrollbarTrack = this.refs.fakeScrollbar;
            const thumb = this.refs.fakeThumb;
            if (!scrollbarTrack || !thumb) return;

            const totalHeight = this.dataSource.getCount() * this.ITEM_HEIGHT;

            // 如果内容高度小于或等于容器高度，隐藏滚动条
            if (totalHeight <= this.height) {
                thumb.style.display = 'none';
                this.scrollOffsetPx = 0; // 确保滚动位置为0
                this.maxScrollPx = 0;
                return;
            }

            thumb.style.display = 'block';
            this.maxScrollPx = totalHeight - this.height;

            // 计算滑块高度
            const trackHeight = scrollbarTrack.clientHeight;
            const thumbHeight = Math.max(
                20,
                trackHeight * (this.height / totalHeight)
            );
            thumb.style.height = `${thumbHeight}px`;

            // 计算滑块位置
            const scrollRatio = this.scrollOffsetPx / this.maxScrollPx;
            const thumbY = (trackHeight - thumbHeight) * scrollRatio;
            thumb.style.transform = `translateY(${thumbY}px)`;
        },
        // 设置滚动偏移
        setScrollOffset(newOffsetPx: number, forceBottom = false) {
            const totalHeight = this.dataSource.getCount() * this.ITEM_HEIGHT;

            // 如果内容高度小于容器高度，强制设置偏移量为0
            if (totalHeight <= this.height) {
                this.scrollOffsetPx = 0;
                this.maxScrollPx = 0;
                this.updateScrollbar();
                return;
            }

            if (forceBottom) {
                this.scrollOffsetPx = this.maxScrollPx;
            } else {
                this.scrollOffsetPx = Math.max(0, Math.min(newOffsetPx, this.maxScrollPx));
            }
            this.updateScrollbar();
        },
        // 处理滚轮滚动
        handleWheel(e: WheelEvent) {
            e.preventDefault();
            const viewport = this.refs.viewport;

            // 如果按住 Shift 键或者是横向滚动
            if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                const newScrollLeft = viewport.scrollLeft + (e.deltaX || e.deltaY);
                viewport.scrollLeft = newScrollLeft;
                return;
            }

            // 纵向滚动
            const delta = e.deltaY * this.SCROLL_SENSITIVITY;
            this.setScrollOffset(this.scrollOffsetPx + delta);
        },
        // 新增：处理横向滚动同步
        handleHorizontalScroll(e: Event) {
            const target = e.target as HTMLElement;
            const scrollLeft = target.scrollLeft;
            if (scrollLeft !== this.lastScrollLeft) {
                this.lastScrollLeft = scrollLeft;
            }
        },
        // 添加拖拽事件
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

            const track = this.refs.fakeScrollbar;
            const thumb = this.refs.fakeThumb;
            const trackRect = track.getBoundingClientRect();
            const thumbHeight = thumb.offsetHeight;

            // 计算点击位置相对于轨道顶部的距离
            const clickOffset = e.clientY - trackRect.top;

            // 计算点击位置在内容中对应的滚动位置
            const scrollRatio = clickOffset / (trackRect.height - thumbHeight);
            const newScrollOffset = scrollRatio * this.maxScrollPx;

            // 直接跳转到对应位置
            this.setScrollOffset(newScrollOffset);
        },
        // 添加新方法检查是否在底部
        isAtBottom() {
            // 允许有1px的误差
            return this.scrollOffsetPx >= this.maxScrollPx - 1;
        },
        validateScrollPosition() {
            const totalHeight = this.dataSource.getCount() * this.ITEM_HEIGHT;
            if (totalHeight <= this.height) {
                // 如果内容高度小于容器高度，强制滚动位置为0
                this.scrollOffsetPx = 0;
                this.maxScrollPx = 0;
            } else {
                // 更新最大滚动范围并确保当前滚动位置有效
                this.maxScrollPx = totalHeight - this.height;
                this.scrollOffsetPx = Math.min(this.scrollOffsetPx, this.maxScrollPx);
            }
        },

        flush() {
            // 验证并修正滚动位置
            this.validateScrollPosition();

            // 增加版本号
            this.dataVersion++;

            // 强制更新组件
            this.$forceUpdate();

            // 等待DOM更新后更新滚动条
            this.$nextTick(() => {
                this.updateScrollbar();
            });
        },
        scroolToBottomIfNecessary() {
            const wasAtBottom = this.isAtBottom();
            this.maxScrollPx = this.dataSource.getCount() * this.ITEM_HEIGHT - this.height;
            if (wasAtBottom) {
                this.setScrollOffset(0, true);
            } else {
                this.updateScrollbar();
            }
            this.flush();
        }
    }
});
</script>

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
        height: 40px;
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