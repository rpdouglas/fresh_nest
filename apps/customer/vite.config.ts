import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'stats.html', gzipSize: true, open: false }),
    VitePWA({
      registerType: 'prompt', // Prompts user to reload when a new service worker is available
      injectRegister: 'auto',
      manifest: false, // site.webmanifest is manually linked in index.html and stored in public/
      workbox: {
        // Precache only the customer app shell; exclude admin chunks, bundle stats, and large static images
        globPatterns: ['**/*.{js,css,html,ico,woff,woff2}'],
        globIgnores: [
          '**/stats.html',
          '**/AdminPage-*.js',
          '**/vendor-charts-*.js',
          'images/**',
          'icons/**',
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache for 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase'
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/@sentry')) {
            return 'vendor-sentry'
          }
        },
      },
    },
  },
})
