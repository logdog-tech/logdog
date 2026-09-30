import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  base: process.env.DOCS_BASE_PATH || '/docs/',
  build: {
    outDir: 'dist-docs',
    rollupOptions: { input: resolve(__dirname, 'docs/index.html') },
  },
})
