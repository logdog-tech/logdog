<template>
    <div 
        v-if="show" 
        ref="selector"
        class="color-selector" 
        :style="computedPosition"
    >
        <div 
            v-for="style in colorStyles" 
            :key="getColorKey(style)"
            class="color-item"
        >
            <div class="color-preview" :style="{ backgroundColor: style['background-color'] }" @click="selectColor(style)">
                <span class="text-preview" :style="{ color: style.color }">A</span>
            </div>
        </div>
        <div class="color-item">
            <div class="color-preview eraser" @click="selectColor(null)">
                <span class="eraser-icon">⌫</span>
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
        y: Number
    },
    emits: ['picked'],
    data() {
        return {
            colorStyles: [
                { color: "#ffffff", "background-color": "#333333" },
                { color: "#333333", "background-color": "#ffffff" },
                { color: "#ffffff", "background-color": "#ff4444" },
                { color: "#ffffff", "background-color": "#2196F3" },
                { color: "#333333", "background-color": "#FFEB3B" },
            ] as ColorStyle[]
        }
    },
    computed: {
        computedPosition() {
            const selectorWidth = 120;
            const selectorHeight = 40;
            const spacing = 8;
            
            // 计算水平居中位置（选择器中心与鼠标位置对齐）
            let left = (this.x ?? 0) - (selectorWidth / 2);
            let top = (this.y ?? 0) - selectorHeight - spacing;

            // 处理左边界
            if (left < 0) {
                left = 0;
            }
            // 处理右边界
            else if (left + selectorWidth > window.innerWidth) {
                left = window.innerWidth - selectorWidth;
            }

            // 如果上方空间不足，则显示在下方
            if (top < 0) {
                top = (this.y ?? 0) + spacing;
            }

            return {
                left: `${left}px`,
                top: `${top}px`
            };
        }
    },
    methods: {
        selectColor(style: ColorStyle | null): void {
            this.$emit("picked", style);
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
    background: white;
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    gap: 4px;
    z-index: 1000;
}

.color-item {
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.color-item:hover {
    transform: scale(1.15);
}

.color-preview {
    width: 100%;
    height: 100%;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-preview {
    font-size: 12px;
    font-weight: bold;
    user-select: none;
}

.eraser {
    background-color: #f5f5f5;
    border: 1px dashed #999;
}

.eraser-icon {
    font-size: 14px;
    color: #666;
    user-select: none;
}

.eraser:hover {
    background-color: #eeeeee;
}
</style>