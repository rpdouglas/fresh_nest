import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
})

// FSM uses persistentLocalCache for offline support (P8 Jasmine transit gaps, P11 Brenda basement photos)
// This replaces getFirestore(app, dbId) from the customer site.
const dbId = import.meta.env.VITE_FIRESTORE_DB_ID ?? '(default)'
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, dbId)

export const auth = getAuth(app)
export const storage = getStorage(app)  // P11 Brenda — photo evidence
export default app
