<template>
    <div class="flex justify-start flex-col w-[200px] bg-white border border-gray-200 shadow-lg rounded-md p-4">
        <!-- <div class="flex items-center gap-2 p-3"><i class="pi pi-user"/> My Profile</div>
        <div class="flex items-center gap-2 p-3"><i class="pi pi-cog"/> Preferences</div>
        <div class="flex items-center gap-2 p-3"><i class="pi pi-phone"/> Support</div>
        <div class="h-[1px] bg-gray-200"/>
        <div class="flex items-center justify-between p-2">
            <span>Theme</span>
            <div class="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
                <i class="pi pi-sun theme-icon" :class="{'theme-selected': theme === 'light'}" @click="theme = 'light'"    />
                <i class="pi pi-moon theme-icon" :class="{'theme-selected': theme === 'dark'}" @click="theme = 'dark'" />
                <i class="pi pi-desktop theme-icon" :class="{'theme-selected': theme === 'system'}" @click="theme = 'system'" />
            </div>
        </div> 
        <div class="h-[1px] bg-gray-200"/> -->
        <div class="p-2 text-red-500 flex items-center mt-2 hover:cursor-pointer hover:bg-gray-100 rounded-md" @click="logout"><i class="pi pi-sign-out pr-2"/>Sign Out</div>
        <!-- <div class="p-2 text-center text-sm">user1@example.com</div> -->
    </div>
</template>
<script lang="ts">
import { userApi } from '@/api'
    export default {
        name: 'UserDropdown',
        data() {
            return {
                theme: 'light'
            }
        },
        methods: {
            async logout() {
                await userApi.logout();
                window.location.reload();
            }
        }
    }
</script>
<style scoped>

.theme-icon {
    padding: 2px;
    min-width: 24px;
    cursor: pointer;
}
.theme-selected {
    background-color: blueviolet;
    border-radius: 10px;
    padding: 2px;
    text-align: center;
    min-width: 24px;
    color: white;
}
</style>