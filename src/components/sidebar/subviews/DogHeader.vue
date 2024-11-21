<template>
    <div>
        <div style="display: grid; grid-template-columns: 40px 1fr 40px; align-items: center;">
            <div @click="toggleFileMode"><i :class="{'pi-folder-open': isSelectedFileMode, 'pi-folder': !isSelectedFileMode, 'bg-gray-200': isSelectedFileMode}" class="pi m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" style="font-size: 16px;"></i></div>
            <div class="text-lg font-bold text-gray-800">
                <span @click="isOpen = !isOpen" :class="{'bg-gray-200': isOpen}" class="hover:cursor-pointer hover:bg-gray-200 rounded-md p-2">
                    <span>{{ currentWorkspace.workspace_name || '选择工作区' }}</span>
                    <i class="pi pi-chevron-down p-2"></i>
                </span>
            </div>
            <div @click="clickMenuButton"><i class="pi pi-bars m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" style="font-size: 16px;"></i></div>
        </div>

        <!-- 工作区下拉菜单 -->
        <div v-if="isOpen" class="absolute bg-white shadow-lg rounded-md mt-2 w-64 z-50 ml-4 border border-gray-200">
            <div class="p-2">
                <button @click="createWorkspace" class="w-full text-left p-2 hover:bg-gray-100 rounded-md">
                    <i class="pi pi-plus mr-2"></i>新建工作区
                </button>
            </div>
            <div v-for="workspace in myWorkspaces" :key="workspace.id" class="p-2 flex justify-between items-center">
                <div @click="selectWorkspace(workspace)" class="flex-grow p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                    {{ workspace.workspace_name }}
                </div>
                <i v-if="canDeleteWorkspace(workspace)" @click="deleteWorkspace(workspace)" class="pi pi-trash p-2 hover:bg-gray-100 rounded-md cursor-pointer"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { Workspace } from '../../../modules/base';
import type { User } from '../../../modules/base';
import { workspaceApi } from '../../../api';
import { settingsTableHelper, workspaceTableHelper } from '../../../utils/db';
import type { PropType } from 'vue';

export default {
    name: 'DogHeader',
    props: {
        isSelectedFileMode: {
            type: Boolean,
            default: true,
        },
        currentUser: {
            type: Object as PropType<User>,
            required: true
        }
    },
    emits: ['toggle-sidebar', 'workspace-selected', 'reselect-files', 'update:isSelectedFileMode'],
    data() {
        return {
            isOpen: false,
            myWorkspaces: [] as Workspace[],
            currentWorkspace: {} as Workspace,
        }
    },
    async mounted() {
        await this.tryInitLocalWorkspace();
        
        const lastSelectedWorkspaceId = await settingsTableHelper.get('last_selected_workspace', 0);
        console.log('tryInitLocalWorkspace', lastSelectedWorkspaceId);
        this.myWorkspaces = await workspaceTableHelper.getAll();
        const tmpCurrentWorkspace = this.myWorkspaces.find(w => w.id === lastSelectedWorkspaceId) || this.myWorkspaces[0];
        this.selectWorkspace(tmpCurrentWorkspace);
        console.log('currentWorkspace', this.currentWorkspace);
       
        await this.syncWorkspace();
        const workspaces = await workspaceTableHelper.getAll();
        
        this.myWorkspaces = [];
        this.myWorkspaces.push(...workspaces);
        

        console.log('syncWorkspace');
        
        // 添加点击事件监听器
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        // 组件销毁前移除事件监听器
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        canDeleteWorkspace(workspace: Workspace): boolean {
            return !workspace._is_local && workspace.created_by === this.currentUser.id;
        },
        async syncWorkspace() {
            const workspaces = await workspaceApi.getWorkspaces();
            for (const workspace of workspaces) {
                const isExist = await workspaceTableHelper.isExistById(workspace.id);
                if (!isExist) {
                    await workspaceTableHelper.add(workspace);
                } else {
                    await workspaceTableHelper.put(workspace);
                }
            }

            const dbWorkspaces = await workspaceTableHelper.getAll() as Workspace[];
            for (const workspace of dbWorkspaces) {
                if (workspace._is_local) continue;
                if (!workspaces.find(w => w.id === workspace.id)) {
                    await workspaceTableHelper.delete(workspace.id);
                }
            }

            this.myWorkspaces = await workspaceTableHelper.getAll() as Workspace[];
        },
        async tryInitLocalWorkspace() {
            const exitLocalWorkspace = await workspaceTableHelper.isExistById(0);
            console.log("tryInitLocalWorkspace, exitLocalWorkspace=", exitLocalWorkspace)
            if (!exitLocalWorkspace) {
                const localWorkspace = {
                    id: 0,
                    workspace_name: '本地工作区',
                    is_public: false,
                    created_by: this.currentUser.id,
                    _is_local: true,
                } as Workspace;
                await workspaceTableHelper.add(localWorkspace);
                this.myWorkspaces.push(localWorkspace);
                this.selectWorkspace(localWorkspace);
            }
        },
        async createWorkspace() {
            const name = prompt('请输入工作区名称');
            if (!name) return;
            
            const workspace = await workspaceApi.createWorkspace({
                workspace_name: name,
                workspace_desc: '',
                is_public: false,
                uuid: crypto.randomUUID(),
            });
            this.myWorkspaces.push(workspace);
            this.selectWorkspace(workspace);
            this.isOpen = false;
        
            await this.syncWorkspace();
        },
        clickMenuButton() {
            console.log('clickMenuButton');
            this.$emit('toggle-sidebar');
        },
        clickReselectFiles() {
            this.$emit('reselect-files');
        },
        selectWorkspace(workspace: Workspace) {
            this.currentWorkspace = workspace;
            this.isOpen = false;
            this.$emit('workspace-selected', JSON.parse(JSON.stringify(workspace)));
            settingsTableHelper.set('last_selected_workspace', workspace.id);
        },
        
        async deleteWorkspace(workspace: Workspace) {
            if (!confirm(`确定要删除工作区 "${workspace.workspace_name}" 吗？`)) return;
            
            const index = this.myWorkspaces.findIndex(w => w.id === workspace.id);
            if (index > -1) {
                this.myWorkspaces.splice(index, 1);
                if (this.currentWorkspace.id === workspace.id) {
                    this.currentWorkspace = {} as Workspace;
                }

                await workspaceApi.deleteWorkspace(workspace.id);

                await this.syncWorkspace();

                this.selectWorkspace(this.myWorkspaces[0]);
            }
        },
        toggleFileMode() {
            this.$emit('update:isSelectedFileMode', !this.isSelectedFileMode);
        },
        handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!this.$el.contains(target) && this.isOpen) {
                this.isOpen = false;
            }
        },
    }
}
</script>