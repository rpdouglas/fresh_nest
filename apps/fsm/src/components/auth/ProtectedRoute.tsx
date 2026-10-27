import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useStaffAuth } from '../../hooks/useStaffAuth'
import { isStaffAppRole } from '@freshnest/shared'

export const ProtectedRoute: React.FC = () => {
  const { staffProfile, role, loading } = useStaffAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  if (!staffProfile || !isStaffAppRole(role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
