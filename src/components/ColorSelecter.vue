<template>
    <div 
        v-if="show" 
        ref="selector"
        class="color-selector"
        :style="computedPosition"
        @click.stop
        v-click-outside="handleClickOutside"
    >
        <div class="color-section" v-for="(section, index) in colorSections" :key="index">
            <div class="color-row">
                <div 
                    v-for="style in section.styles" 
                    :key="getColorKey(style)"
                    class="color-item"
                    :class="{ 'selected': isCurrentColor(style) }"
                >
                    <div class="color-preview" :style="{ backgroundColor: style['background-color'] }" @click="selectColor(style)">
                        <span class="text-preview" :style="{ color: style.color }">A</span>
                    </div>
                </div>
                <div class="color-item">
                    <div class="color-preview eraser" @click="selectColor(null)">
                        <svg class="eraser-icon" viewBox="0 0 16 16" width="8" height="8">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export interface ColorStyle {
    color: string;
    'background-color': string;
}

export interface HTMLElementWithEvent extends HTMLElement {
    clickOutsideEvent?: (event: Event) => void;
}

export default {
    name: 'ColorSelector',
    props: {
        show: Boolean,
        x: Number,
        y: Number,
        currentStyle: Object as () => Record<string, string> | null,
        selectedText: String,
        allSessionColors: Object as () => Record<string, Record<string, string>>
    },
    emits: ['picked'],
    data() {
        return {
            colorSections: [
                {
                    // 第一行：高亮/荧光色系 - 按色相排列：红、橙、黄、绿、青、蓝、紫、粉、灰
                    styles: [
                        { color: "#000000", "background-color": "#ff6b6b" }, // 荧光红
                        { color: "#000000", "background-color": "#ff8c00" }, // 荧光橙
                        { color: "#000000", "background-color": "#ffff00" }, // 荧光黄
                        { color: "#000000", "background-color": "#00ff00" }, // 荧光绿
                        { color: "#000000", "background-color": "#00ffff" }, // 荧光青
                        { color: "#000000", "background-color": "#4169e1" }, // 荧光蓝
                        { color: "#ffffff", "background-color": "#8a2be2" }, // 荧光紫
                        { color: "#000000", "background-color": "#ff69b4" }, // 荧光粉
                        { color: "#000000", "background-color": "#c0c0c0" }, // 荧光银
                    ]
                },
                {
                    // 第二行：柔和/淡色系 - 按色相排列：红、橙、黄、绿、青、蓝、紫、粉、灰
                    styles: [
                        { color: "#8b0000", "background-color": "#ffcccb" }, // 淡红
                        { color: "#8b4500", "background-color": "#ffd4a3" }, // 淡橙
                        { color: "#8b8000", "background-color": "#ffffcc" }, // 淡黄
                        { color: "#006400", "background-color": "#ccffcc" }, // 淡绿
                        { color: "#2f4f4f", "background-color": "#e0ffff" }, // 淡青
                        { color: "#000080", "background-color": "#ccddff" }, // 淡蓝
                        { color: "#4b0082", "background-color": "#e6ccff" }, // 淡紫
                        { color: "#8b008b", "background-color": "#ffccff" }, // 淡粉
                        { color: "#696969", "background-color": "#f5f5f5" }, // 淡灰
                    ]
                },
                {
                    // 第三行：深色/状态色系 - 按色相排列：红、橙、黄、绿、青、蓝、紫、粉、黑
                    styles: [
                        { color: "#ffffff", "background-color": "#dc2626" }, // 深红
                        { color: "#000000", "background-color": "#f59e0b" }, // 深橙
                        { color: "#ffffff", "background-color": "#d97706" }, // 深黄
                        { color: "#ffffff", "background-color": "#059669" }, // 深绿
                        { color: "#ffffff", "background-color": "#0891b2" }, // 深青
                        { color: "#ffffff", "background-color": "#2563eb" }, // 深蓝
                        { color: "#ffffff", "background-color": "#7c3aed" }, // 深紫
                        { color: "#ffffff", "background-color": "#db2777" }, // 深粉
                        { color: "#ffffff", "background-color": "#1f2937" }, // 深黑
                    ]
                }
            ] as Array<{styles: ColorStyle[]}>
        }
    },
    computed: {
        computedPosition() {
            const width = 160; // 增加宽度以容纳更多颜色
            const height = 60;
            const spacing = 8;
            
            // 计算水平位置：以鼠标位置为中心
            let left = (this.x ?? 0) - (width / 2);
            
            // 计算垂直位置：始终在鼠标正上方
            let top = (this.y ?? 0) - height - spacing;

            // 处理左边界
            if (left < spacing) {
                left = spacing;
            }
            // 处理右边界
            else if (left + width > window.innerWidth - spacing) {
                left = window.innerWidth - width - spacing;
            }

            // 如果上方空间不足，则显示在下方
            if (top < spacing) {
                top = (this.y ?? 0) + spacing;
            }

            return {
                left: `${left}px`,
                top: `${top}px`
            };
        }
    },
    methods: {
        handleClickOutside() {
            // this.$emit("picked", null, this.selectedText);
        },
        selectColor(style: ColorStyle | null): void {
            // 如果点击的是当前选中文字已有的颜色，则删除
            if (style && this.currentStyle && this.hasSameColors(style, this.currentStyle)) {
                this.$emit("picked", null, this.selectedText);
            } else {
                this.$emit("picked", style, this.selectedText);
            }
        },
        isSameColor(style1: ColorStyle, style2: ColorStyle): boolean {
            return style1.color === style2.color && 
                   style1['background-color'] === style2['background-color'];
        },
        hasSameColors(style1: ColorStyle | Record<string, string>, style2: Record<string, string> | null): boolean {
            if (!style2) return false;
            return style1.color === style2.color && 
                   style1['background-color'] === style2['background-color'];
        },
        isCurrentColor(style: ColorStyle): boolean {
            // 检查这个颜色是否被任何文字使用
            if (this.allSessionColors) {
                for (const sessionStyle of Object.values(this.allSessionColors)) {
                    if (this.hasSameColors(style, sessionStyle)) {
                        return true;
                    }
                }
            }
            return false;
        },
        getColorKey(style: ColorStyle): string {
            return `${style.color}-${style['background-color']}`;
        }
    },
    directives: {
        clickOutside: {
            mounted(el: HTMLElementWithEvent, binding: { value: (event: Event) => void }) {
                el.clickOutsideEvent = (event: Event) => {
                    if (!(el === event.target || el.contains(event.target as Node))) {
                        binding.value(event);
                    }
                };
                document.addEventListener('click', el.clickOutsideEvent);
            },
            unmounted(el: HTMLElementWithEvent) {
                if (el.clickOutsideEvent) {
                    document.removeEventListener('click', el.clickOutsideEvent);
                }
            },
        },
    }
}
</script>

<style scoped>
.color-selector {
    position: fixed;
    width: 160px; /* 增加宽度以容纳10个项目 */
    padding: 4px;
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    z-index: 1000;
    cursor: default;
}

.color-section {
    margin-bottom: 1px;
}

.color-section:last-child {
    margin-bottom: 1px;
}

.color-row {
    display: flex;
    gap: 1px;
    flex-wrap: wrap;
}

.color-item {
    width: 14px;
    height: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 2px;
    overflow: hidden;
    position: relative;
}

.color-item.selected {
    position: relative;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
    border: 2px solid #ffffff;
}

.color-item:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10;
    position: relative;
}

.color-preview {
    width: 100%;
    height: 100%;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.color-preview:hover {
    border: 1px solid rgba(0, 0, 0, 0.3);
}

.text-preview {
    font-size: 7px;
    font-weight: bold;
    user-select: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.eraser {
    background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
    border: 1px dashed #999;
    position: relative;
    overflow: hidden;
}

.eraser::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
    transition: left 0.3s ease;
}

.eraser:hover::before {
    left: 100%;
}

.eraser-icon {
    width: 8px;
    height: 8px;
    fill: #666;
    user-select: none;
    position: relative;
    z-index: 1;
    transition: fill 0.2s ease;
}

.eraser:hover {
    background: linear-gradient(135deg, #eeeeee 0%, #ddd 100%);
    border-color: #777;
}

.eraser:hover .eraser-icon {
    fill: #333;
}
</style>