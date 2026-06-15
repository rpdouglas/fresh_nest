import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

/**
 * Initializes or retrieves the shared Firebase App instance.
 */
export function getSharedFirebaseApp(config: FirebaseConfig): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(config)
  }
  return getApp()
}

/**
 * Retrieves the Auth instance for the given Firebase App.
 */
export function getSharedAuth(app: FirebaseApp): Auth {
  return getAuth(app)
}
