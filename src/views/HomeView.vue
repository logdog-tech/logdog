<template>
    <Splitter style="width: 100vw; height: 100vh">
        <SplitterPanel v-show="showSidebar" :size="20" style="max-width: 400px; min-width: 227px;">
            <div class="sidebar min-w-[227px] h-full" style="display: grid; grid-template-rows: 50px 200px 1fr 48px;">
                <DogHeader 
                    :currentUser="currentUser"
                    v-model:isSelectedFileMode="isSelectedFileMode"
                    @workspace-selected="handleWorkspaceSelected" 
                    @toggle-sidebar="onToggleSidebar" />
                <div class="overflow-y-auto h-[200px]">
                    <DataProvider 
                        :isSelectedFileMode="isSelectedFileMode"
                        @fileLoaded="handleFileLoaded"
                        @switchToListMode="isSelectedFileMode = false"
                    />
                </div>
                <div class="overflow-y-auto">
                    <DogRulers :currentUser="currentUser" :workspace="workspace" @configChanged="handleConfigChanged" @userToggleItems="handleUserToggleItems" />
                </div>
                <LoginInfo @login-status-changed="handleLoginStatusChanged" />
            </div>
        </SplitterPanel>
        
        <SplitterPanel class="flex items-center justify-center" :size="80">
            <LogdogEditor ref="logdogEditorRef" :logData="fileContent" :filters="filters" :colors="colors"
                :functions="functions" />
        </SplitterPanel>
    </Splitter>
    <div v-if="!showSidebar" class="fixed top-0 left-0" @click="onToggleSidebar"><i class="pi pi-bars m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" style="font-size: 16px;"></i></div>
</template>

<script lang="ts">
import DataProvider from "../components/DataProvider.vue";
import LogdogEditor from "../components/LogdogEditor.vue";
import LoginInfo from "../components/sidebar/subviews/LoginInfo.vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import type { BaseLine, User } from "../modules/base";

import DogHeader from "../components/sidebar/subviews/DogHeader.vue";
import DogRulers from "../components/sidebar/subviews/DogRulers.vue";
import type { Workspace, Rule } from '../modules/base';
import { userApi } from "@/api";

export default {
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
            fileContent: [] as BaseLine[],
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
            console.timeLog(
                "🕘加载文件",
                "s2.1, handleFileLoaded函数接收到任务，数据总长度" + content.length
            );

            const lines = content.split("\n");
            console.timeLog("🕘加载文件", "s2.2, 完成split风格，总行数" + lines.length);

            this.fileContent = lines.map((content: string, index: number) => {
                return { filename: name, line: index + 1, content: content } as BaseLine;
            });
            this.fileName = name;
            console.timeLog("🕘加载文件", "s2.3, 完成映射为line+content的json结构");
            console.timeEnd("🕘加载文件");

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
            (this.$refs.logdogEditorRef as any)?.handleUserToggleItems(1, item);
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
}
</script>
<style scoped>
</style>

