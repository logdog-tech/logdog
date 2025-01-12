import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
        wasm(),
        topLevelAwait(),
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: '/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            }
        }
    },
  server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        }
    },
    optimizeDeps: {
        exclude: ['libarchive.js']
  }
})
