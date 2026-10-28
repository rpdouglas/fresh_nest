// E2E harness only (F5): replaces src/lib/firebase/firebase.ts so the customer site runs against
// the local emulators (Firestore 8080, Auth 9099). Signed out by default, like a real visitor.
// Never imported by the app build — only by e2e/harness/vite.customer.config.ts.
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
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

// No Functions emulator runs; callables fail fast and show their error state.
export const functions = getFunctions(app)
connectFunctionsEmulator(functions, '127.0.0.1', 5999)

export default app
