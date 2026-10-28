// E2E harness (F5): serves the real FSM staff app on :5191 with Firebase swapped for the emulators.
// No PWA plugin: a service worker would cache across tests.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { swapFirebase } from './swapFirebase'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../fsm')

export default defineConfig({
  root,
  plugins: [
    swapFirebase(path.resolve(root, 'src/lib/firebase/firebase.ts'), path.resolve(here, 'fsm-firebase.ts')),
    react(),
  ],
  resolve: { alias: [{ find: '@', replacement: path.resolve(root, 'src') }] },
  server: { port: 5191, strictPort: true, fs: { allow: [path.resolve(here, '../../../..')] } },
})
