import { useState, useEffect } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase'

export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        void (async () => {
          try {
            // Force refresh token to ensure custom claims are read
            const idTokenResult = await currentUser.getIdTokenResult(true)
            const userRole = (idTokenResult.claims.role as string) || 'customer'
            setRole(userRole)
          } catch (err) {
            console.error('Error fetching custom claims:', err)
            setRole('customer') // Default fallback for customers
          } finally {
            setLoading(false)
          }
        })()
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const sendMagicLink = async (email: string) => {
    setLoading(true)
    setAuthError(null)
    const actionCodeSettings = {
      url: `${window.location.origin}/login-confirm`,
      handleCodeInApp: true,
    }
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
    } catch (err) {
      console.error('Error sending magic link:', err)
      const errMsg = err instanceof Error ? err.message : 'Failed to send login link'
      setAuthError(errMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const confirmMagicLink = async (): Promise<User> => {
    setLoading(true)
    setAuthError(null)
    const href = window.location.href
    if (!isSignInWithEmailLink(auth, href)) {
      setLoading(false)
      throw new Error('Invalid sign-in link')
    }

    let email = window.localStorage.getItem('emailForSignIn')
    if (!email) {
      email = window.prompt('Please confirm the email address you used to request the link:')
    }

    if (!email) {
      setLoading(false)
      throw new Error('Email verification required')
    }

    try {
      const result = await signInWithEmailLink(auth, email, href)
      window.localStorage.removeItem('emailForSignIn')
      setUser(result.user)
      const idTokenResult = await result.user.getIdTokenResult(true)
      setRole((idTokenResult.claims.role as string) || 'customer')
      return result.user
    } catch (err) {
      console.error('Error confirming magic link:', err)
      const errMsg = err instanceof Error ? err.message : 'Link confirmation failed'
      setAuthError(errMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setAuthError(null)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
      const idTokenResult = await result.user.getIdTokenResult(true)
      setRole((idTokenResult.claims.role as string) || 'customer')
    } catch (err) {
      console.error('Google sign-in error:', err)
      const errMsg = err instanceof Error ? err.message : 'Google login failed'
      setAuthError(errMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      setUser(null)
      setRole(null)
    } catch (err) {
      console.error('Sign-out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    role,
    loading,
    authError,
    sendMagicLink,
    confirmMagicLink,
    signInWithGoogle,
    signOutUser,
  }
}
