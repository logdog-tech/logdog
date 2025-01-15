<script setup lang="ts">
import { RouterView } from 'vue-router'

import Toast from 'primevue/toast';
import { TolgeeProvider } from '@tolgee/vue';
</script>

<template>
    <TolgeeProvider>
        <template v-slot:fallback>
            <div>{{ $t('common.loading') }}</div>
        </template>

        <Toast /> <!-- 确保 Toast 组件在根组件中 -->
        <RouterView />
    </TolgeeProvider>
</template>