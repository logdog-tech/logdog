<template>
    <div>
        <div style="display: grid; grid-template-columns: 40px 1fr 30px 40px; align-items: center;">
            <div @click="toggleFileMode"><i :class="{'pi-folder-open': isSelectedFileMode, 'pi-folder': !isSelectedFileMode, 'bg-gray-200': isSelectedFileMode}" class="pi m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" style="font-size: 16px;"></i></div>
            <div class="text-lg font-bold text-gray-800">
                <span @click="isOpen = !isOpen" :class="{'bg-gray-200': isOpen}" class="hover:cursor-pointer hover:bg-gray-200 rounded-md p-2">
                    <span>{{ currentWorkspace.workspace_name || $t('dogHeader.selectWorkspace') }}</span>
                    <i class="pi pi-chevron-down p-2"></i>
                </span>
            </div>
            <div v-if="currentWorkspace.id && !currentWorkspace._is_local" 
                 @click="showMemberManagement"
                 :title="$t('dogHeader.manageMembers')">
                <i class="pi pi-users m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" 
                   style="font-size: 16px;"></i>
            </div>
            <div v-else></div>
            <div @click="clickMenuButton">
                <i class="pi pi-bars m-2 p-2 hover:cursor-pointer text-gray-600 hover:bg-gray-200 rounded-md" 
                   style="font-size: 16px;"></i>
            </div>
        </div>

        <!-- 工作区下拉菜单 -->
        <div v-if="isOpen" class="absolute bg-white shadow-lg rounded-md mt-2 w-64 z-50 ml-4 border border-gray-200">
            <div class="p-2">
                <button @click="createWorkspace" class="w-full text-left p-2 hover:bg-gray-100 rounded-md">
                    <i class="pi pi-plus mr-2"></i>{{ $t('dogHeader.newWorkspace') }}
                </button>
            </div>
            <div v-for="workspace in myWorkspaces" :key="workspace.id" class="p-2 flex justify-between items-center">
                <div @click="selectWorkspace(workspace)" class="flex-grow p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                    {{ workspace.workspace_name }}
                </div>
                <i v-if="canDeleteWorkspace(workspace)" 
                   @click="deleteWorkspace(workspace)" 
                   class="pi pi-trash p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                   :title="$t('dogHeader.deleteWorkspace')"></i>
            </div>
        </div>

        <!-- 添加成员管理对话框 -->
        <div v-if="showMemberDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-[480px]">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">{{ $t('dogHeader.memberManagement') }}</h3>
                    <button @click="showMemberDialog = false" 
                            class="text-gray-500 hover:text-gray-700">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>
                
                <!-- 添加新成员 -->
                <div v-if="isWorkspaceAdmin()" class="mb-6">
                    <div class="relative">
                        <div class="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <i class="pi pi-search text-gray-400 mx-3"></i>
                            <input v-model="searchQuery" 
                                   type="text" 
                                   :placeholder="$t('dogHeader.searchPlaceholder')"
                                   @input="handleSearch"
                                   class="flex-1 p-3 outline-none border-none">
                        </div>
                        
                        <!-- 搜索结果下拉框 -->
                        <div v-if="searchResults.length > 0" 
                             class="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 overflow-hidden">
                            <div v-for="user in searchResults" 
                                 :key="user.id"
                                 @click="selectUser(user)"
                                 class="p-3 hover:bg-gray-50 cursor-pointer flex items-center border-b last:border-b-0">
                                <div v-if="user.avatar" class="w-10 h-10 rounded-full overflow-hidden mr-3">
                                    <img :src="user.avatar" 
                                         :alt="user.nickname"
                                         @error="handleAvatarError"
                                         class="w-full h-full object-cover">
                                </div>
                                <div v-else 
                                     class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                     :class="getAvatarColor(user.id)">
                                    <span class="text-lg font-medium">{{ getAvatarText(user) }}</span>
                                </div>
                                <div>
                                    <div class="font-medium">{{ user.nickname }}</div>
                                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 添加邀请链接按钮 -->
                <div class="mt-4">
                    <button @click="generateInvitation" 
                            class="flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                        <i class="pi pi-link mr-2"></i>{{ $t('dogHeader.generateInviteLink') }}
                    </button>
                </div>
                
                <!-- 显示邀请链接 -->
                <div v-if="invitationLink" class="mt-2 p-4 bg-gray-50 rounded-md">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-600">{{ $t('dogHeader.inviteLinkValid') }}</div>
                        <button @click="copyInvitationLink" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="pi pi-copy"></i>
                        </button>
                    </div>
                    <div class="mt-2 text-sm break-all">
                        {{ invitationLink }}
                    </div>
                </div>

                <!-- 成员列表 -->
                <div class="max-h-[400px] overflow-y-auto">
                    <div v-for="member in currentWorkspace.members" 
                         :key="member.user_id"
                         class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group">
                        <div class="flex items-center">
                            <div v-if="member.avatar" class="w-10 h-10 rounded-full overflow-hidden mr-3">
                                <img :src="member.avatar" 
                                     :alt="member.nickname"
                                     @error="handleAvatarError"
                                     class="w-full h-full object-cover">
                            </div>
                            <div v-else 
                                 class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                 :class="getAvatarColor(member.user_id)">
                                <span class="text-lg font-medium">{{ getAvatarText(member) }}</span>
                            </div>
                            <div>
                                <div class="font-medium">
                                    {{ member.nickname || $t('dogHeader.localWorkspace') }}
                                </div>
                                <div class="text-sm">
                                    <span class="px-2 py-1 rounded-full text-xs" 
                                          :class="{
                                              'bg-blue-100 text-blue-800': member.role === 'owner',
                                              'bg-green-100 text-green-800': member.role === 'admin',
                                              'bg-gray-100 text-gray-800': member.role === 'member'
                                          }">
                                        {{ getRoleText(member.role) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button v-if="canRemoveMember(member)" 
                                @click="removeMember(member)"
                                class="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-2">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
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

export interface UserInfo {
  id: number;
  nickname: string;
  email: string;
  avatar?: string;
}

export interface WorkspaceMember {
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    nickname: string;
    avatar?: string;
}

export interface WorkspaceWithMembers extends Workspace {
    members: WorkspaceMember[];
}

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
            currentWorkspace: {
                id: 0,
                workspace_name: '',
                workspace_desc: '',
                is_public: false,
                created_by: 0,
                created_at: '',
                updated_at: '',
                members: []
            } as WorkspaceWithMembers,
            showMemberDialog: false,
            newMemberEmail: '',
            searchQuery: '',
            searchResults: [] as UserInfo[],
            searchTimeout: null as number | null,
            invitationLink: '',
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
            // 同步工作区列表
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

            this.myWorkspaces = await workspaceTableHelper.getAll();

            // 更新当前工作区信息，包括成员列表
            if (this.currentWorkspace.id) {
                const updatedWorkspace = await workspaceApi.getWorkspace(this.currentWorkspace.id);
                this.currentWorkspace = updatedWorkspace as WorkspaceWithMembers;
            }
        },
        async tryInitLocalWorkspace() {
            const exitLocalWorkspace = await workspaceTableHelper.isExistById(0);
            console.log("tryInitLocalWorkspace, exitLocalWorkspace=", exitLocalWorkspace)
            if (!exitLocalWorkspace) {
                const localWorkspace = {
                    id: 0,
                    workspace_name: this.$t('dogHeader.localWorkspace'),
                    is_public: false,
                    created_by: this.currentUser.id || 0,
                    _is_local: true,
                } as Workspace;
                await workspaceTableHelper.add(localWorkspace);
                this.myWorkspaces.push(localWorkspace);
                this.selectWorkspace(localWorkspace);
            }
        },
        async createWorkspace() {
            const name = prompt(this.$t('dogHeader.promptWorkspaceName'));
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
            this.$emit('toggle-sidebar');
        },
        clickReselectFiles() {
            this.$emit('reselect-files');
        },
        selectWorkspace(workspace: Workspace) {
            const workspaceWithMembers = {
                ...workspace,
                members: [] as WorkspaceMember[]
            } as WorkspaceWithMembers;
            
            this.currentWorkspace = workspaceWithMembers;
            this.isOpen = false;
            this.$emit('workspace-selected', JSON.parse(JSON.stringify(workspace)));
            settingsTableHelper.set('last_selected_workspace', workspace.id);
        },
        
        async deleteWorkspace(workspace: Workspace) {
            if (!confirm(this.$t('dogHeader.deleteWorkspaceConfirm', { workspaceName: workspace.workspace_name }))) return;
            
            const index = this.myWorkspaces.findIndex(w => w.id === workspace.id);
            if (index > -1) {
                this.myWorkspaces.splice(index, 1);
                if (this.currentWorkspace.id === workspace.id) {
                    this.currentWorkspace = {
                        id: 0,
                        workspace_name: '',
                        workspace_desc: '',
                        is_public: false,
                        created_by: 0,
                        created_at: '',
                        updated_at: '',
                        members: []
                    } as WorkspaceWithMembers;
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
        showMemberManagement() {
            this.showMemberDialog = true;
            this.newMemberEmail = '';
        },
        isWorkspaceAdmin(): boolean {
            if (!this.currentWorkspace?.members) return false;
            const currentUserMember = this.currentWorkspace.members.find(
                (m: WorkspaceMember) => m.user_id === this.currentUser.id
            );
            return currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';
        },
        canRemoveMember(member: WorkspaceMember): boolean {
            if (member.role === 'owner') return false;
            if (member.user_id === this.currentUser.id) return false;
            return this.isWorkspaceAdmin();
        },
        async removeMember(member: WorkspaceMember) {
            if (!confirm(this.$t('dogHeader.removeMemberConfirm', { memberNickname: member.nickname }))) return;
            
            try {
                await workspaceApi.removeWorkspaceMember(
                    this.currentWorkspace.id,
                    member.user_id
                );
                await this.syncWorkspace();
            } catch (error: unknown) {
                const err = error as Error;
                alert(this.$t('dogHeader.removeMemberFailed', { message: err.message }));
            }
        },
        async handleSearch() {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            if (!this.searchQuery.trim()) {
                this.searchResults = [];
                return;
            }

            this.searchTimeout = window.setTimeout(async () => {
                try {
                    this.searchResults = await workspaceApi.searchUsers(
                        this.currentWorkspace.id,
                        this.searchQuery.trim()
                    );
                } catch (error: unknown) {
                    const err = error as Error;
                    console.error('搜索用户失败:', err);
                    alert(this.$t('dogHeader.removeMemberFailed', { message: err.message }));
                }
            }, 300);
        },
        async selectUser(user: UserInfo) {
            try {
                await workspaceApi.addWorkspaceMember(
                    this.currentWorkspace.id,
                    user.id,
                    'member'
                );
                this.searchQuery = '';
                this.searchResults = [];
                await this.syncWorkspace();
            } catch (error: unknown) {
                const err = error as Error;
                alert(this.$t('dogHeader.removeMemberFailed', { message: err.message }));
            }
        },
        handleAvatarError(e: Event) {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            // 触发父元素显示首字母头像
            const parent = img.parentElement;
            if (parent) {
                parent.classList.add('bg-gray-200');
                parent.classList.add('flex');
                parent.classList.add('items-center');
                parent.classList.add('justify-center');
            }
        },
        getAvatarText(user: UserInfo | WorkspaceMember): string {
            // 只有当昵称存在且不为空字符串时才使用昵称首字母
            if (user.nickname?.trim()) {
                return user.nickname.charAt(0).toUpperCase();
            }
            // 其他情况都显示 #
            return '#';
        },
        getAvatarColor(id: number): string {
            // 预定义一组好看的颜色
            const colors = [
                'bg-blue-100 text-blue-600',
                'bg-blue-100 text-blue-600',
                'bg-yellow-100 text-yellow-600',
                'bg-red-100 text-red-600',
                'bg-purple-100 text-purple-600',
                'bg-pink-100 text-pink-600',
                'bg-indigo-100 text-indigo-600',
            ];
            // 根据用户 ID 选择固定的颜色
            return colors[id % colors.length];
        },
        async generateInvitation() {
            try {
                const response = await workspaceApi.createInvitation(this.currentWorkspace.id);
                const baseUrl = window.location.origin;
                this.invitationLink = `${baseUrl}/join/${response.code}`;
            } catch (error: unknown) {
                const err = error as Error;
                alert(this.$t('dogHeader.removeMemberFailed', { message: err.message }));
            }
        },
        
        async copyInvitationLink() {
            try {
                await navigator.clipboard.writeText(this.invitationLink);
                alert(this.$t('dogHeader.inviteLinkCopied'));
            } catch (_error) {
                alert(this.$t('dogHeader.inviteLinkCopyFailed'));
            }
        },
        getRoleText(role: string): string {
            const roleMap = {
                'owner': this.$t('dogHeader.owner'),
                'admin': this.$t('dogHeader.admin'),
                'member': this.$t('dogHeader.member')
            };
            return roleMap[role as keyof typeof roleMap] || role;
        },
    }
}
</script>