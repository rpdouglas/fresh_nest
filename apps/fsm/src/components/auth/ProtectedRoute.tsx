import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useStaffAuth } from '../../hooks/useStaffAuth'

export const ProtectedRoute: React.FC = () => {
  const { staffProfile, role, loading } = useStaffAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  if (!staffProfile || (role !== 'staff' && role !== 'supervisor' && role !== 'admin')) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
