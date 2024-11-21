<template>
    <div class="widget" :style="{ 'width': isExpanded ? '100%' : 'unset' }">
        <div class="widget-sider" @click="toggleExpand" >
            <slot name="header">标题</slot>
        </div>
        <div class="widget-header" v-show="isExpanded">
            <slot name="header">标题</slot>
        </div>
        <div class="widget-content" v-show="isExpanded">
            <slot name="content">内容</slot>
        </div>
    </div>
    <div class="divider"></div>
</template>
<script lang="ts">
export default {
    name: "BaseWidget",
    props: {
        expanded: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isExpanded: this.expanded
        }
    },
    methods: {
        toggleExpand() {
            this.isExpanded = !this.isExpanded;
        }
    }
}
</script>
<style scoped>
.widget {
    display: inline-grid;
    grid-template-columns: 24px 1fr;
    grid-template-areas: "sider header" "sider content";
    cursor: pointer;
    border: 0.5px solid #333;
}
.widget-sider {
    display: flex;
    padding: 18px 4px;
    text-align: center;
    height: 100%;
    background-color: gainsboro;
    min-height: 160px;
    grid-area: sider;
}
.widget-header {
    grid-area: header;
    background-color: gainsboro;
    height: 24px;
    line-height: 24px;
    padding: 0 4px;
}
.widget-content {
    padding: 4px;
    width: 100%;
}
</style>
