// E2E harness (F5): serves the real customer site on :5190 with Firebase swapped for the emulators.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { swapFirebase } from './swapFirebase'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

export default defineConfig({
  root,
  plugins: [
    swapFirebase(path.resolve(root, 'src/lib/firebase/firebase.ts'), path.resolve(here, 'customer-firebase.ts')),
    react(),
  ],
  resolve: { alias: [{ find: '@', replacement: path.resolve(root, 'src') }] },
  server: { port: 5190, strictPort: true },
})
