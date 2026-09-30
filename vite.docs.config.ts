import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  base: process.env.DOCS_BASE_PATH || '/',
  build: {
    outDir: 'dist-docs',
    rollupOptions: { input: resolve(__dirname, 'docs/index.html') },
  },
})
