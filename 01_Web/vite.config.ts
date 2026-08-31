import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
// @ts-expect-error Node-only Vite plugin is intentionally kept outside the browser TypeScript project.
import { travelAtlasLocalEditor } from './scripts/local-editor-plugin.mjs'
// @ts-expect-error Node-only profile helper is intentionally kept outside the browser TypeScript project.
import { getPrivatePaths } from './scripts/private-profile.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const profile = mode === 'personal' ? 'personal' : 'public'
  const privatePaths = getPrivatePaths()

  return {
    // Public mode never reads repository-local .env files. Hosting variables from process.env still work.
    envDir: profile === 'personal' ? privatePaths.configRoot : false,
    plugins: [
      travelAtlasLocalEditor({ profile, privateRoot: privatePaths.root }),
      react(),
      tailwindcss(),
      cesium(),
    ],
    server: {
      watch: {
        ignored: [
          '**/public/media/user/**',
        ],
      },
    },
  }
})
