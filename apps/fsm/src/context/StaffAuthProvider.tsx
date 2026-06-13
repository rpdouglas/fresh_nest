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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../lib/firebase/firebase'
import { Staff } from '../types'
import { StaffAuthContext } from './StaffAuthContext'

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const handleAuthChange = async () => {
        setLoading(true)
        setError(null)
        setUser(currentUser)
        if (currentUser) {
          try {
            const staffDoc = await getDoc(doc(db, 'staff', currentUser.uid))
            if (staffDoc.exists()) {
              setStaffProfile({ id: staffDoc.id, ...staffDoc.data() } as Staff)
            } else {
              setStaffProfile(null)
              // Log out if authenticated in Auth but no staff profile exists
              await signOut(auth)
              setError('fsm.login.errorNoProfile')
            }
          } catch (err) {
            console.error('Error fetching staff profile:', err)
            setStaffProfile(null)
            await signOut(auth)
            setError('fsm.login.errorGeneral')
          }
        } else {
          setStaffProfile(null)
        }
        setLoading(false)
      }
      void handleAuthChange()
    })

    return () => unsubscribe()
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
