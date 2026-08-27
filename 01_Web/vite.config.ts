import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
// @ts-expect-error Node-only Vite plugin is intentionally kept outside the browser TypeScript project.
import { travelAtlasLocalEditor } from './scripts/local-editor-plugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [travelAtlasLocalEditor(), react(), tailwindcss(), cesium()],
  server: {
    watch: {
      ignored: [
        '**/public/media/user/**',
      ],
    },
  },
})
