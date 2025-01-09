<template>
    <Splitter style="width: 100vw; height: 100vh">
        <SplitterPanel v-show="showSidebar" :size="20" style="max-width: 800px; min-width: 227px;">
            <div class="sidebar min-w-[227px] h-full" style="display: grid; grid-template-rows: 50px 240px 1fr 48px;">
                <DogHeader :currentUser="currentUser" v-model:isSelectedFileMode="isSelectedFileMode"
                    @workspace-selected="handleWorkspaceSelected" @toggle-sidebar="onToggleSidebar" />
                <div class="overflow-y-auto h-[240px]">
                    <DataProvider :isSelectedFileMode="isSelectedFileMode" @fileLoaded="handleFileLoaded"
                        @switchToListMode="isSelectedFileMode = false" />
                </div>
                <div class="overflow-y-auto">
                    <DogRulers :currentUser="currentUser" :workspace="workspace" @configChanged="handleConfigChanged"
                        @userToggleItems="handleUserToggleItems" />
                </div>
                <LoginInfo @login-status-changed="handleLoginStatusChanged" />
            </div>
        </SplitterPanel>

        <!-- <DataProvider @fileLoaded="handleFileLoaded" /> -->
        <SplitterPanel class="flex items-center justify-center" size="80">
            <LogdogEditor ref="logdogEditorRef" :filters="filters" :colors="colors" :functions="functions" />
        </SplitterPanel>
    </Splitter>
    <div v-if="!showSidebar" class="fixed top-0 left-0" @click="onToggleSidebar"><i
            class="pi pi-bars m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md"
            style="font-size: 16px;"></i></div>
</template>¡

<script lang="ts">
import DataProvider from "../components/DataProvider.vue";
import LogdogEditor from "../components/LogdogEditor.vue";
import LoginInfo from "../components/sidebar/subviews/LoginInfo.vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import type { User } from "../modules/base";

import DogHeader from "../components/sidebar/subviews/DogHeader.vue";
import DogRulers from "../components/sidebar/subviews/DogRulers.vue";
import type { Workspace, Rule } from '../modules/base';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'HomeView',
    components: {
        DataProvider,
        LogdogEditor,
        Splitter,
        SplitterPanel,
        DogHeader,
        DogRulers,
        LoginInfo
    },
    data() {
        return {
            fileName: "",
            filters: [] as Rule[],
            colors: [] as Rule[],
            functions: [] as Rule[],
            selectedDogfile: null as string | null,
            workspace: {} as Workspace,
            showSidebar: true,
            isSelectedFileMode: true,
            currentUser: this.createLocalTmpUser()
        }
    },
    async mounted() {
    },
    methods: {
        createLocalTmpUser() {
            return {
                id: -1,
                nickname: '未登录用户',
            } as User;
        },
        handleLoginStatusChanged(isLoggedIn: boolean, user: User) {
            this.currentUser = user;
        },
        handleWorkspaceSelected(workspace: Workspace) {
            console.log('handleWorkspaceSelected', workspace);
            this.workspace = workspace;
        },
        handleFileLoaded(content: string, name: string) {
            this.isSelectedFileMode = false;
        },

        handleConfigChanged(config: Rule[]) {
            console.log('handleConfigChanged', config);
            this.filters = config.filter(rule => rule.rule_type === 'filter');
            this.colors = config.filter(rule => rule.rule_type === 'color');
            this.functions = config.filter(rule => rule.rule_type === 'function');

            console.log('======filters', this.filters);
        },
        handleUserToggleItems(type: number, item: Rule) {
            console.log('handleUserToggleItems', type, item);
            (this.$refs.logdogEditorRef as any)?.handleUserToggleItems(item.rule_type, item);
        },
        handleDogfileSelected(dogfile: string) {
            console.log("🕘handleDogfileSelected", dogfile);
            this.selectedDogfile = dogfile;
        },
        onToggleSidebar() {
            console.log('onToggleSidebar');
            this.showSidebar = !this.showSidebar;
        }
    }
})
</script>
<style scoped></style>
