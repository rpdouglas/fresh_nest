import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { officeRoleOf, waitForRoleClaim, isNewAccount, type OfficeRole } from '@freshnest/shared'
import { auth, functions } from '@/lib/firebase/firebase'

export function useAdminAuth() {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  // P3-E35: owner or manager (both get the full admin panel; owners also manage office roles)
  const [officeRole, setOfficeRole] = useState<OfficeRole | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let activeController: AbortController | null = null

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      const handleAuthChange = async () => {
        setUser(currentUser)
        if (currentUser) {
          try {
            // Force refresh token to retrieve latest custom claims
            const idTokenResult = await currentUser.getIdTokenResult(true)
            if (controller.signal.aborted) return

            let role = officeRoleOf(idTokenResult.claims.role)

            if (role === null && (currentUser.uid || currentUser.metadata)) {
              setCheckingAccess(true)
              const resolvedClaim = await waitForRoleClaim({
                initialRole: idTokenResult.claims.role,
                getRole: async () => (await currentUser.getIdTokenResult(true)).claims.role,
                accepts: (r) => officeRoleOf(r) !== null,
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
              role = officeRoleOf(resolvedClaim)
            }

            const authorized = role !== null
            setOfficeRole(role)
            setIsAuthorized(authorized)

            if (!authorized) {
              setAuthError(tRef.current('admin.login.errorMessage', { email: currentUser.email }))
            } else {
              setAuthError(null)
            }
          } catch (err) {
            if (controller.signal.aborted) return
            console.error('Error verifying admin custom claims:', err)
            setOfficeRole(null)
            setIsAuthorized(false)
            setAuthError(tRef.current('admin.login.errorMessage', { email: currentUser.email }))
          } finally {
            if (!controller.signal.aborted) {
              setCheckingAccess(false)
              setLoading(false)
            }
          }
        } else {
          setOfficeRole(null)
          setIsAuthorized(false)
          setAuthError(null)
          setCheckingAccess(false)
          setLoading(false)
        }
      }
      void handleAuthChange()
    })

    return () => {
      activeController?.abort()
      unsubscribe()
    }
  }, [])

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
    checkingAccess,
    isAuthorized,
    officeRole,
    isOwner: officeRole === 'owner',
    authError,
    handleSignIn,
    handleSignOut,
  }
}
