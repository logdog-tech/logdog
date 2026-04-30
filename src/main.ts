import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'

import App from './App.vue'
import router from './router'
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes'

import ToastService from 'primevue/toastservice';
import { Tolgee, DevTools, VueTolgee, FormatSimple, DevBackend, ObserverPlugin, BackendFetch, LanguageStorage, LanguageDetector } from '@tolgee/vue';


const languageCodes = {
    priority1: ['en', 'zh-CN', 'ja', 'hi'],
    priority2: ['ru', 'de', 'fr', 'es', 'pt-BR'],
    priority3: ['it', 'pl', 'ko', 'zh-TW']
};
const allLanguageCodes = [...languageCodes.priority1, ...languageCodes.priority2, ...languageCodes.priority3];


const tolgee = Tolgee()
    .use(DevTools())
    .use(FormatSimple())
    .use(BackendFetch())
    .use(ObserverPlugin())
    .use(LanguageDetector())
    .use(LanguageStorage())
    .init({
        // language: 'zh',
        availableLanguages: allLanguageCodes,
        defaultLanguage: 'en',
        fallbackLanguage: 'en'
    });



const app = createApp(App)


const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'   
        }
    }
});


app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
  },
})
app.use(ToastService);
app.use(VueTolgee, { tolgee });

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');

const syncSystemTheme = () => {
    const isDark = darkModeMedia.matches;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

syncSystemTheme();
darkModeMedia.addEventListener('change', syncSystemTheme);

const shouldBlockHorizontalGesture = (event: WheelEvent) => {
    if (event.defaultPrevented) return false;
    if (event.ctrlKey) return false;

    const absDeltaX = Math.abs(event.deltaX);
    const absDeltaY = Math.abs(event.deltaY);

    return absDeltaX > absDeltaY && absDeltaX > 0;
};

const isInsideHorizontalScrollRegion = (event: WheelEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return false;

    return !!target.closest('.hl-hscroll');
};

const blockBrowserHorizontalSwipe = (event: WheelEvent) => {
    if (isInsideHorizontalScrollRegion(event)) return;
    if (!shouldBlockHorizontalGesture(event)) return;
    event.preventDefault();
};

window.addEventListener('wheel', blockBrowserHorizontalSwipe, { passive: false, capture: true });

app.mount('#app')
