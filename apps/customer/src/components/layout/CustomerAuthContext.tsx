/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode } from 'react'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import type { User } from 'firebase/auth'

interface CustomerAuthContextType {
  user: User | null
  role: string | null
  loading: boolean
  authError: string | null
  sendMagicLink: (email: string) => Promise<void>
  confirmMagicLink: () => Promise<User>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const authVal = useCustomerAuth()
  return (
    <CustomerAuthContext.Provider value={authVal}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuthContext() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuthContext must be used within a CustomerAuthProvider')
  }
  return context
}
