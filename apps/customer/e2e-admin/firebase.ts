// Admin visual harness only (P3-E33): replaces src/lib/firebase/firebase.ts so the real admin UI
// runs against the local Firestore + Auth emulators, signed in as a seeded admin.
// Never imported by the app build — only by e2e-admin/vite.config.ts.
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const app = initializeApp({
  apiKey: 'demo-key',
  projectId: 'freshnest-aa51e',
  authDomain: 'localhost',
  storageBucket: 'freshnest-aa51e.appspot.com',
  appId: '1:1:web:1',
})

export const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

export const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

// No Functions emulator runs; callables (e.g. marketing analytics) fail fast and show their error state.
export const functions = getFunctions(app)
connectFunctionsEmulator(functions, '127.0.0.1', 5999)

await signInWithEmailAndPassword(auth, 'lauren@freshnest.test', 'password123')

export default app
