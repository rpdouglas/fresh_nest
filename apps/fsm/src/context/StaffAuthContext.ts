import { createContext } from 'react'
import { User } from 'firebase/auth'
import { Staff } from '../types'

export interface StaffAuthContextType {
  user: User | null
  staffProfile: Staff | null
  role?: string | null
  loading: boolean
  error: string | null
  setError: (error: string | null) => void
  signInWithPassword: (email: string, password: string) => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  completeMagicLinkSignIn: () => Promise<void>
  logout: () => Promise<void>
}

export const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined)
