import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StaffAuthProvider } from './context/StaffAuthProvider'
import { OfflineUploadProvider } from './context/OfflineUploadProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { OnboardingSequenceGuard } from './components/auth/OnboardingSequenceGuard'
import FsmLayout from './components/layout/FsmLayout'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ShiftBoardPage from './pages/ShiftBoardPage'
import MyJobsPage from './pages/MyJobsPage'
import JobPage from './pages/JobPage'

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
        element: <OnboardingSequenceGuard />,
        children: [
          {
            element: <FsmLayout />,
            children: [
              {
                path: '/',
                element: <PlaceholderPage titleKey="fsm.dashboard" />,
              },
              {
                path: '/shifts',
                element: <ShiftBoardPage />,
              },
              {
                path: '/jobs',
                element: <MyJobsPage />,
              },
              {
                path: '/jobs/:id',
                element: <JobPage />,
              },
              {
                path: '/profile',
                element: <ProfilePage />,
              },
            ],
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


