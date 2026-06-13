import { useContext } from 'react'
import { StaffAuthContext } from '../context/StaffAuthContext'

export function useStaffAuth() {
  const context = useContext(StaffAuthContext)
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider')
  }
  return context
}
