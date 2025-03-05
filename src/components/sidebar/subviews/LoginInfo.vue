<template>
    <div>
        <div class="grid grid-cols-2 h-[48px] hover:cursor-pointer px-2" @click="handleClick"
            style="grid-template-columns: 40px 1fr 48px; grid-template-rows: 1px 1fr; align-items: center; ">
            <div class="h-[1px] bg-gray-200" style="grid-column: 1 / 4" />
            <div class="rounded-full bg-blue-500 p-2 w-10 h-10 flex items-center justify-center text-white font-medium">
                {{ avatarText }}
            </div>
            <div class="">
                <template v-if="isLoggedIn">
                    <div class="text">{{ userInfo?.nickname }}</div>
                    <div class="text-xs text-gray-500 max-w-[120px] truncate">{{ userInfo?.email }}</div>
                </template>
                <template v-else>
                    <div class="text-sm">{{ $t('loginInfo.notLoggedIn') }}</div>
                    <div class="text-xs text-gray-500 max-w-[140px] truncate">{{ $t('loginInfo.moreFeatures') }}</div>
                </template>
            </div>
            <div>
                <i v-if="false" class="pi pi-bell p-2 border border-gray-200 rounded-md"
                    @click="toggleNotifications"></i>
            </div>
        </div>

        <div v-if="showNotifications" class="fixed bottom-[50px] left-[180px]" style="z-index: 100;">
            <Notifications />
        </div>
        <div v-if="showUserDropdown" class="fixed bottom-[50px] left-[30px]" style="z-index: 100;">
            <UserDropdown :currentUser="userInfo" />
        </div>
        <LoginModal v-model="showLoginModal" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from "@/modules/base"
import { userApi, handleApiError } from "../../../api"
import Notifications from './Notifications.vue'
import UserDropdown from './footer/UserDropdown.vue'
import LoginModal from '@/components/LoginModal'
import { settingsTableHelper } from '@/utils/db'

const emit = defineEmits<{
    (e: 'login-status-changed', status: boolean, user: User | null): void
}>()

const isLoggedIn = ref(false)
const userInfo = ref<User | null>(null)
const showNotifications = ref(false)
const showUserDropdown = ref(false)
const showLoginModal = ref(false)

const avatarText = computed(() => {
    if (isLoggedIn.value) {
        if (userInfo.value?.nickname?.trim()) {
            return userInfo.value.nickname.charAt(0).toUpperCase()
        }
        return userInfo.value?.id?.toString().charAt(0) || '#'
    }
    return '#'
})

const checkLoginStatus = async () => {
    try {
        const data = await userApi.getUserInfo() as User
        await settingsTableHelper.set('user_info', JSON.stringify(data))
        isLoggedIn.value = true
        userInfo.value = data
        emit('login-status-changed', true, data)
    } catch (error) {
        handleApiError(error as Error)
        isLoggedIn.value = false
        userInfo.value = null
        emit('login-status-changed', false, null)
    }
}

const toggleNotifications = (event: Event) => {
    event.stopPropagation()  // 阻止事件冒泡
    showUserDropdown.value = false  // 关闭用户下拉菜单
    showNotifications.value = !showNotifications.value
}

const handleClick = () => {
        showNotifications.value = false  // 关闭通知
    showUserDropdown.value = !showUserDropdown.value
}

checkLoginStatus()
</script>
