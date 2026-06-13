import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/firebase'

export function useAdminAuth() {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const handleAuthChange = async () => {
        setUser(currentUser)
        if (currentUser) {
          const userEmail = currentUser.email?.trim().toLowerCase()
          if (userEmail) {
            try {
              const adminDocRef = doc(db, 'admins', userEmail)
              const adminSnap = await getDoc(adminDocRef)
              const authorized = adminSnap.exists()
              setIsAuthorized(authorized)

              if (!authorized) {
                setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
              } else {
                setAuthError(null)
              }
            } catch (err) {
              console.error('Error verifying admin authorization:', err)
              setIsAuthorized(false)
              setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
            }
          } else {
            setIsAuthorized(false)
            setAuthError(t('admin.login.authFailed'))
          }
        } else {
          setIsAuthorized(false)
          setAuthError(null)
        }
        setLoading(false)
      }
      void handleAuthChange()
    })

    return () => unsubscribe()
  }, [t])

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign-in error:', err)
      setAuthError(t('admin.login.authFailed'))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    isAuthorized,
    authError,
    handleSignIn,
    handleSignOut,
  }
}
