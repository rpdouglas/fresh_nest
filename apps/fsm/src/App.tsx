import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StaffAuthProvider } from './context/StaffAuthProvider'
import { OfflineUploadProvider } from './context/OfflineUploadProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useStaffAuth } from './hooks/useStaffAuth'
import FsmLayout from './components/layout/FsmLayout'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ShiftBoardPage from './pages/ShiftBoardPage'
import MyJobsPage from './pages/MyJobsPage'
import JobPage from './pages/JobPage'
import MyLeadsPage from './pages/MyLeadsPage'
import LeadPage from './pages/LeadPage'

function NonContractorOnly({ children }: { children: React.ReactElement }) {
  const { staffProfile } = useStaffAuth()
  if (staffProfile?.role === 'contractor') {
    return <Navigate to="/leads" replace />
  }
  return children
}

function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
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
        element: <FsmLayout />,
        children: [
          {
            path: '/',
            element: (
              <NonContractorOnly>
                <PlaceholderPage titleKey="fsm.dashboard" />
              </NonContractorOnly>
            ),
          },
          {
            path: '/shifts',
            element: (
              <NonContractorOnly>
                <ShiftBoardPage />
              </NonContractorOnly>
            ),
          },
          {
            path: '/jobs',
            element: (
              <NonContractorOnly>
                <MyJobsPage />
              </NonContractorOnly>
            ),
          },
          {
            path: '/jobs/:id',
            element: (
              <NonContractorOnly>
                <JobPage />
              </NonContractorOnly>
            ),
          },
          {
            path: '/leads',
            element: <MyLeadsPage />,
          },
          {
            path: '/leads/:id',
            element: <LeadPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <StaffAuthProvider>
      <OfflineUploadProvider>
        <RouterProvider router={router} />
      </OfflineUploadProvider>
    </StaffAuthProvider>
  )
}


