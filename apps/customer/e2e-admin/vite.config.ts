// Admin visual harness (P3-E33): serves the real customer app with Firebase swapped for emulators.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { swapFirebase } from '../e2e/harness/swapFirebase'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

export default defineConfig({
  root,
  plugins: [swapFirebase(path.resolve(root, 'src/lib/firebase/firebase.ts'), path.resolve(here, 'firebase.ts')), react()],
  resolve: { alias: [{ find: '@', replacement: path.resolve(root, 'src') }] },
  server: { port: 5180, strictPort: true },
})
