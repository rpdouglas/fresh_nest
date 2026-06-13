import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StaffAuthProvider } from './context/StaffAuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'

function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white p-4">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-charcoal">{t(titleKey)}</h1>
        <p className="mt-2 font-body text-text-muted">{t('fsm.portal')}</p>
        <p className="mt-4 font-body text-sm text-text-muted">{t('fsm.epicInProgress')}</p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <PlaceholderPage titleKey="fsm.dashboard" />,
      },
      {
        path: '/shifts',
        element: <PlaceholderPage titleKey="fsm.shifts" />,
      },
      {
        path: '/jobs',
        element: <PlaceholderPage titleKey="fsm.myJobs" />,
      },
    ],
  },
])

export default function App() {
  return (
    <StaffAuthProvider>
      <RouterProvider router={router} />
    </StaffAuthProvider>
  )
}
