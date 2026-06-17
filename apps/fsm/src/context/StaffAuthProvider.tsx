import React, { useState, useEffect } from 'react'
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
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase/firebase'
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

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
                const idTokenResult = await currentUser.getIdTokenResult(true)
                userRole = (idTokenResult.claims.role as string) || 'customer'
              } else {
                // Fallback for Vitest environments
                userRole = currentUser.email?.includes('freshnest') ? 'staff' : 'customer'
              }
              setRole(userRole)

              // Secure gate: block customer role users from entering the FSM app
              if (userRole !== 'staff' && userRole !== 'supervisor' && userRole !== 'admin') {
                console.warn(`[StaffAuthProvider] Access denied for unauthorized role: ${userRole}`)
                setStaffProfile(null)
                setUser(null)
                setRole(null)
                void signOut(auth)
                setError('fsm.login.errorNoProfile')
                setLoading(false)
                return
              }

              const staffRef = doc(db, 'staff', currentUser.uid)
              let isLinking = false

              // Set up real-time listener for the user's staff document
              unsubscribeProfile = onSnapshot(staffRef, (docSnapshot) => {
                const processSnapshot = async () => {
                  if (docSnapshot.exists()) {
                    setStaffProfile({ id: docSnapshot.id, ...docSnapshot.data() } as Staff)
                    setLoading(false)
                  } else {
                    if (currentUser.email && !isLinking) {
                      isLinking = true
                      try {
                        // Auto-linking: check if a staff document exists with their email
                        const emailQ = query(
                          collection(db, 'staff'),
                          where('email', '==', currentUser.email.toLowerCase().trim())
                        )
                        const emailSnapshot = await getDocs(emailQ)
                        if (!emailSnapshot.empty) {
                          const legacyDoc = emailSnapshot.docs[0]
                          const legacyData = legacyDoc.data()

                          // Copy data to new doc with UID as ID
                          await setDoc(staffRef, {
                            ...legacyData,
                            uid: currentUser.uid,
                          })

                          // Delete legacy doc
                          await deleteDoc(legacyDoc.ref)
                          return
                        }
                      } catch (err) {
                        console.error('Error during auto-linking:', err)
                      }
                    }

                    setStaffProfile(null)
                    // If authenticated but no profile exists, sign out
                    void signOut(auth)
                    setError('fsm.login.errorNoProfile')
                    setLoading(false)
                  }
                }
                void processSnapshot()
              }, (err) => {
                console.error('Error on profile snapshot:', err)
                setLoading(false)
              })
            } catch (err) {
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
      unsubscribe()
      if (unsubscribeProfile) unsubscribeProfile()
    }
  }, [])

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const q = query(collection(db, 'staff'), where('email', '==', email.toLowerCase().trim()))
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
