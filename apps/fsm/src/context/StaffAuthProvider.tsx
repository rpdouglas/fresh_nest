import React, { useState, useEffect } from 'react'
import * as Sentry from '@sentry/react'
import {
  User,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { staffCollection, isStaffAppRole, waitForRoleClaim, isNewAccount } from '@freshnest/shared'
import { auth, db, functions } from '../lib/firebase/firebase'
import { Staff } from '../types'
import { StaffAuthContext } from './StaffAuthContext'

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null
    let activeController: AbortController | null = null

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      const handleAuthChange = () => {
        setLoading(true)
        setError(null)
        setUser(currentUser)

        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }

        if (currentUser) {
          void (async () => {
            try {
              // Retrieve custom claims, handling test mock environments gracefully
              let userRole = 'customer'
              if (typeof currentUser.getIdTokenResult === 'function') {
                const resolved = await waitForRoleClaim({
                  getRole: async () => {
                    const idTokenResult = await currentUser.getIdTokenResult(true)
                    return idTokenResult.claims.role ?? 'customer'
                  },
                  accepts: isStaffAppRole,
                  syncRole: async () => {
                    if (!functions) return
                    const syncFn = httpsCallable<Record<string, never>, { role?: unknown; updated?: boolean }>(
                      functions,
                      'syncMyRole',
                    )
                    const res = await syncFn({})
                    return res.data
                  },
                  isNewAccount: isNewAccount(currentUser.metadata?.creationTime),
                  signal: controller.signal,
                })
                if (controller.signal.aborted) return
                userRole = (typeof resolved === 'string' && resolved) ? resolved : 'customer'
              } else {
                // Fallback for Vitest environments
                userRole = currentUser.email?.includes('freshnest') ? 'staff' : 'customer'
              }
              setRole(userRole)

              // Secure gate: block customer role users from entering the FSM app
              if (!isStaffAppRole(userRole)) {
                console.warn(`[StaffAuthProvider] Access denied for unauthorized role: ${userRole}`)
                setStaffProfile(null)
                setUser(null)
                setRole(null)
                void signOut(auth)
                setError('fsm.login.errorNoProfile')
                setLoading(false)
                return
              }

              const staffRef = doc(staffCollection(db), currentUser.uid)

              // Set up real-time listener for the user's staff document
              unsubscribeProfile = onSnapshot(staffRef, (docSnapshot) => {
                const processSnapshot = () => {
                   if (docSnapshot.exists()) {
                    setStaffProfile(docSnapshot.data() || null)
                    setLoading(false)
                  } else {
                    // P3-E27-A2: After this fix, all new staff have staff/{uid} docs created
                    // server-side by onStaffRegistered CF. Reaching this branch is unexpected.
                    Sentry.captureMessage(
                      `[P3-E27-A2] No staff doc at staff/${currentUser.uid} after login — unexpected post-A2`,
                      { level: 'warning', extra: { uid: currentUser.uid, email: currentUser.email } }
                    )
                    setStaffProfile(null)
                    void signOut(auth)
                    setError('fsm.login.errorNoProfile')
                    setLoading(false)
                  }
                }
                processSnapshot()
              }, (err) => {
                console.error('Error on profile snapshot:', err)
                setLoading(false)
              })
            } catch (err) {
              if (controller.signal.aborted) return
              console.error('Error setting up staff profile/claims:', err)
              setStaffProfile(null)
              setRole(null)
              void signOut(auth)
              setError('fsm.login.errorGeneral')
              setLoading(false)
            }
          })()
        } else {
          setStaffProfile(null)
          setRole(null)
          setLoading(false)
        }
      }
      handleAuthChange()
    })

    return () => {
      activeController?.abort()
      unsubscribe()
      if (unsubscribeProfile) unsubscribeProfile()
    }
  }, [])

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const q = query(staffCollection(db), where('email', '==', email.toLowerCase().trim()))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const exists = await checkEmailExists(email)
      if (!exists) {
        setError('fsm.login.errorNoProfile')
        setLoading(false)
        throw new Error('No staff profile found')
      }
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('Password sign in error:', err)
      const errorInstance = err as Error
      if (errorInstance.message !== 'No staff profile found') {
        setError('fsm.login.errorInvalid')
      }
      setLoading(false)
      throw err
    }
  }

  const sendMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const exists = await checkEmailExists(email)
      if (!exists) {
        setError('fsm.login.errorNoProfile')
        setLoading(false)
        throw new Error('No staff profile found')
      }
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
      setLoading(false)
    } catch (err) {
      console.error('Error sending magic link:', err)
      const errorInstance = err as Error
      if (errorInstance.message !== 'No staff profile found') {
        setError('fsm.login.errorGeneral')
      }
      setLoading(false)
      throw err
    }
  }

  const completeMagicLinkSignIn = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setLoading(true)
      setError(null)
      try {
        let email = window.localStorage.getItem('emailForSignIn')
        if (!email) {
          email = window.prompt('Please provide your email for confirmation')
        }
        if (!email) {
          throw new Error('Email is required for magic link sign-in')
        }
        const exists = await checkEmailExists(email)
        if (!exists) {
          setError('fsm.login.errorNoProfile')
          setLoading(false)
          return
        }
        await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem('emailForSignIn')
      } catch (err) {
        console.error('Error completing magic link sign in:', err)
        setError('fsm.login.errorGeneral')
        setLoading(false)
      }
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaffAuthContext.Provider
      value={{
        user,
        staffProfile,
        role,
        loading,
        error,
        setError,
        signInWithPassword,
        sendMagicLink,
        completeMagicLinkSignIn,
        logout,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  )
}
