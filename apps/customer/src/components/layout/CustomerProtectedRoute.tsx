import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuthContext } from './CustomerAuthContext'

interface Props {
  children: React.ReactNode
}

export function CustomerProtectedRoute({ children }: Props) {
  const { user, role, loading } = useCustomerAuthContext()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-warm-white">
        <div className="w-12 h-12 border-4 border-slate-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-body text-charcoal text-base">Loading portal...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Allow both customers and admin roles (for support / overrides)
  if (role !== 'customer' && role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-warm-white px-4 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-dark mb-2">Access Denied</h2>
        <p className="font-body text-charcoal text-base mb-4">
          This section is reserved for customers. If you are a cleaner or administrator, please use the appropriate panel.
        </p>
        <Navigate to="/" replace />
      </div>
    )
  }

  return <>{children}</>
}
