// Fresh Nest (`freshnest-aa51e`) Firebase Auth client for office sign-in (ADR-022 / P3-E41 Strategy 2).
// Lazily initialized only when VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID are set so local dev
// and pretend-Camelo E2E tests work with zero Firebase network calls.
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut, type Auth } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

const config = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID ?? '').trim(),
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId)

let cachedApp: FirebaseApp | null = null

function getOpsApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Auth is not configured for this build (VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID missing).')
  }
  if (!cachedApp) {
    cachedApp = getApps().length ? getApps()[0] : initializeApp(config)
  }
  return cachedApp
}

function getOpsAuth(): Auth {
  return getAuth(getOpsApp())
}

/**
 * Signs in with Google via Fresh Nest Firebase Auth (`freshnest-aa51e`), self-heals a pre-approved
 * Owner/Manager claim via `syncMyRole` if not yet on the token, and returns a fresh Firebase ID token.
 */
export async function signInWithFirebaseGoogle(): Promise<string> {
  const app = getOpsApp()
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  const cred = await signInWithPopup(auth, provider)
  const tokenResult = await cred.user.getIdTokenResult(true)
  const role = tokenResult.claims.role

  if (role !== 'owner' && role !== 'manager') {
    try {
      const syncMyRole = httpsCallable<Record<string, never>, { role?: unknown; updated?: boolean }>(getFunctions(app), 'syncMyRole')
      await syncMyRole({})
    } catch {
      // Non-fatal: functions-ops also checks `admins/{email}` live on the server.
    }
  }

  return cred.user.getIdToken(true)
}

/** Silently refreshes the current Firebase user's ID token before its 1-hour expiry, or returns null. */
export async function refreshFirebaseToken(): Promise<string | null> {
  if (!isFirebaseConfigured || !getApps().length) return null
  const user = getOpsAuth().currentUser
  if (!user) return null
  try {
    return await user.getIdToken(true)
  } catch {
    return null
  }
}

/** Signs out of Firebase Auth if initialized. */
export async function signOutFirebase(): Promise<void> {
  if (!isFirebaseConfigured || !getApps().length) return
  try {
    await signOut(getOpsAuth())
  } catch {
    // ignore sign-out errors when offline
  }
}
