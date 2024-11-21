<template>
    <div class="grid grid-cols-2 h-[48px] hover:cursor-pointer" @click="toggleUserDropdown"
         style="grid-template-columns: 48px 1fr 48px; grid-template-rows: 1px 1fr; align-items: center;">
        <div class="h-[1px] bg-gray-200" style="grid-column: 1 / 4"/>
        <div class="mx-4 rounded-full bg-blue-500 p-2 w-10 h-10"/>
        <div class="mx-2">
            <template v-if="isLoggedIn">
                <div class="text">{{ userInfo?.nickname }}</div>
                <div class="text text-gray-500 max-w-[140px] truncate">{{ userInfo?.email }}</div>
            </template>
            <template v-else>
                <div class="text-sm">未登录</div>
                <div class="text-xs text-gray-500 max-w-[140px] truncate">登录后可使用更多功能</div>
            </template>
        </div>
        <div>
            <i v-if="false" class="pi pi-bell p-2 border border-gray-200 rounded-md" @click="toggleNotifications"></i>
        </div>
    </div>


    <div v-if="showNotifications" class="fixed bottom-[50px] left-[180px]" style="z-index: 100;">
        <Notifications />
    </div>
    <div v-if="showUserDropdown" class="fixed bottom-[50px] left-[30px]" style="z-index: 100;">
        <UserDropdown />
    </div>
</template>

<script lang="ts">
import type { User } from "@/modules/base";
import { userApi, handleApiError } from "../../../api";
import Notifications from './Notifications.vue';
import UserDropdown from './footer/UserDropdown.vue';


export default {
    name: 'LoginInfo',
    components: {
        Notifications,
        UserDropdown
    },
    emits: ['login-status-changed'],
    data() {
        return {
            isLoggedIn: false,
            userInfo: null as User | null,

            showNotifications: false,
            showUserDropdown: false
        }
    },
    async mounted() {
        await this.checkLoginStatus();
    },
    methods: {
        async handleLoginClick() {
            window.location.href = "https://api.logdog.tech/login?redirect_url=" + window.location.href;
        },
        async checkLoginStatus() {
            try {
                const data = await userApi.getUserInfo() as User;
                this.isLoggedIn = true;
                this.userInfo = data;
                this.$emit('login-status-changed', true, data);
            } catch (error) {
                handleApiError(error as Error);
                this.isLoggedIn = false;
                this.userInfo = null;
                this.$emit('login-status-changed', false, null);
            }
        },
        toggleNotifications(event: Event) {
            event.stopPropagation();  // 阻止事件冒泡
            this.showUserDropdown = false;  // 关闭用户下拉菜单
            this.showNotifications = !this.showNotifications;
        },
        toggleUserDropdown() {
            if (this.isLoggedIn) {
                this.showNotifications = false;  // 关闭通知
                this.showUserDropdown = !this.showUserDropdown;
            } else {
                this.handleLoginClick();
            }
        }

    }
}

</script>
