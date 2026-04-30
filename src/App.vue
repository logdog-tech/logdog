<script setup lang="ts">
import { RouterView } from 'vue-router'
import { acceptRouteChange, cancelRouteChange, useNavigationGuardState } from '@/utils/navigationGuard';

import Toast from 'primevue/toast';
import { TolgeeProvider } from '@tolgee/vue';

const { showConfirm } = useNavigationGuardState();
</script>

<template>
    <TolgeeProvider>
        <template v-slot:fallback>
            <div>{{ $t('common.loading') }}</div>
        </template>

        <Toast /> <!-- 确保 Toast 组件在根组件中 -->
        <RouterView />

        <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <h2 class="text-lg font-semibold text-gray-900">确认离开当前页面？</h2>
                <p class="mt-3 text-sm text-gray-600">
                    你正在触发浏览器路由跳转。为避免误触，我们先确认一次。
                </p>
                <div class="mt-6 flex justify-end gap-3">
                    <button class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" @click="cancelRouteChange">
                        取消
                    </button>
                    <button class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" @click="acceptRouteChange">
                        继续
                    </button>
                </div>
            </div>
        </div>
    </TolgeeProvider>
</template>
