import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app under the repo name: https://<user>.github.io/<repo>/.
// The deploy workflow sets BASE_PATH from the repo name; locally it defaults to /hifz-tracker/.
// The same base feeds the asset URLs, the manifest's start_url and scope, and the service worker's scope.
const base = process.env.BASE_PATH ?? '/hifz-tracker/'

// Each build is named by its version (package.json) and the time it was built. The running app knows its own, and
// version.json tells it the newest one deployed. version.json isn't precached, so it's always fetched from the server.
const version: string = JSON.parse(readFileSync('package.json', 'utf8')).version
const build = new Date().toISOString()
const versionJson: Plugin = {
  name: 'version-json',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version, build }) })
  },
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(version), __APP_BUILD__: JSON.stringify(build) },
  // The Mushaf page data is one large chunk on purpose (it loads only when a page opens).
  build: { chunkSizeWarningLimit: 1700 },
  plugins: [
    react(),
    versionJson,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      // Precache the bundled fonts too, so Arabic names render offline.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ttf,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // the Mushaf page data is about 1.6 MB
      },
      manifest: {
        name: 'Hifz Tracker',
        short_name: 'Hifz',
        description: "Today's Hifz, Rabt and Muraja'a, logged in one tap.",
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        // Android paints an installed app's navigation bar and splash screen from these, and a
        // manifest can't switch with dark mode. Dark --paper from src/theme.css suits the phone's dark mode.
        background_color: '#17130f',
        theme_color: '#17130f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
