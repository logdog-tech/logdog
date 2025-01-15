<template>
    <div class="flex justify-start flex-col w-[240px] bg-white border border-gray-200 shadow-lg rounded-md p-4">
        <!-- <div class="flex items-center gap-2 p-3"><i class="pi pi-user" /> My Profile</div>
        <div class="flex items-center gap-2 p-3"><i class="pi pi-cog" /> Preferences</div>
        <div class="flex items-center gap-2 p-3"><i class="pi pi-phone" /> Support</div>
        <div class="h-[1px] bg-gray-200" />
        <div class="flex items-center justify-between p-2">
            <span>Theme</span>
            <div class="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
                <i class="pi pi-sun theme-icon" :class="{ 'theme-selected': theme === 'light' }"
                    @click="theme = 'light'" />
                <i class="pi pi-moon theme-icon" :class="{ 'theme-selected': theme === 'dark' }"
                    @click="theme = 'dark'" />
                <i class="pi pi-desktop theme-icon" :class="{ 'theme-selected': theme === 'system' }"
                    @click="theme = 'system'" />
            </div>
        </div>
        <div class="h-[1px] bg-gray-200" /> -->
        <div class="flex items-center justify-between p-2">
            <span>{{ $t('userdropdown.language') }}</span>
            <select :value="tolgee.getLanguage()" @change="changeLanguage"
                class="border border-gray-200 rounded-md px-2 py-1">
                <option v-for="lang in allLanguageCodes" :key="lang" :value="lang">
                    {{ getLanguageDisplayName(lang) }}
                </option>
            </select>
        </div>
        <div class="h-[1px] bg-gray-200" />
        <div class="p-2 text-red-500 flex items-center mt-2 hover:cursor-pointer hover:bg-gray-100 rounded-md"
            @click="logout"><i class="pi pi-sign-out pr-2" />{{ $t('userdropdown.logout') }}</div>
        <!-- <div class="p-2 text-center text-sm">user1@example.com</div> -->
    </div>
</template>
<script setup lang="ts">
import { useTolgee } from '@tolgee/vue';
import { userApi } from '@/api';
import { ref } from 'vue';

const theme = ref('light');
const tolgee = useTolgee(['language']);

const allLanguageCodes = [
    'en', 'zh-CN', 'ja', 'hi',
    'ru', 'de', 'fr', 'es', 'pt-BR',
    'it', 'pl', 'ko', 'zh-TW'
];

const getLanguageDisplayName = (code: string) => {
    const languageNames: Record<string, string> = {
        'en': 'English',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'ja': '日本語',
        'hi': 'हिन्दी',
        'ru': 'Русский',
        'de': 'Deutsch',
        'fr': 'Français',
        'es': 'Español',
        'pt-BR': 'Português (Brasil)',
        'it': 'Italiano',
        'pl': 'Polski',
        'ko': '한국어'
    };
    return languageNames[code] || code;
};

const changeLanguage = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    tolgee.value.changeLanguage(target.value);
};

const logout = async () => {
    await userApi.logout();
    window.location.reload();
};
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