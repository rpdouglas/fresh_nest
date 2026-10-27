// Admin visual harness (P3-E33): serves the real customer app with Firebase swapped for emulators.
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const real = path.resolve(root, 'src/lib/firebase/firebase')
const harness = path.resolve(here, 'firebase.ts')

// Catches both `@/lib/firebase/firebase` and relative `./firebase` imports of the real setup.
const swapFirebase: Plugin = {
  name: 'admin-visual-swap-firebase',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source === '@/lib/firebase/firebase') return harness
    if (importer && importer !== harness && /^\.\/firebase(\.ts)?$/.test(source)) {
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (resolved && resolved.id.replace(/\.ts$/, '') === real) return harness
    }
    return null
  },
}

export default defineConfig({
  root,
  plugins: [swapFirebase, react()],
  resolve: { alias: [{ find: '@', replacement: path.resolve(root, 'src') }] },
  server: { port: 5180, strictPort: true },
})
