import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { serviceWorkerSource } from './src/lib/serviceWorker.ts'

/** Writes sw.js into the build, listing the build's own files, so the installed app opens offline (decision 0043). */
function serviceWorker(): Plugin {
  return {
    name: 'fnc-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(Object.keys(bundle)) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  test: {
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
  server: {
    // `npm run dev` in functions-ops/ serves the API locally
    proxy: { '/api': 'http://localhost:8787' },
  },
})
