// E2E harness only (F5): replaces apps/fsm/src/lib/firebase/firebase.ts so the staff app runs
// against the local emulators (Firestore 8080, Auth 9099, Storage 9199). Keeps the app's offline
// cache so the job screens behave as on a phone. Never imported by the app build.
import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const app = initializeApp({
  apiKey: 'demo-key',
  projectId: 'freshnest-aa51e',
  authDomain: 'localhost',
  storageBucket: 'freshnest-aa51e.appspot.com',
  appId: '1:1:web:1',
})

export const db = initializeFirestore(app, { localCache: persistentLocalCache() })
connectFirestoreEmulator(db, '127.0.0.1', 8080)

export const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

export const storage = getStorage(app)
connectStorageEmulator(storage, '127.0.0.1', 9199)

// No Functions emulator runs; seeded users already carry their role claim, so syncMyRole isn't needed.
export const functions = getFunctions(app)
connectFunctionsEmulator(functions, '127.0.0.1', 5999)

export default app
