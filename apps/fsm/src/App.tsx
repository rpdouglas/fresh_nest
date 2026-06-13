import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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
  {
    path: '/login',
    element: <PlaceholderPage titleKey="fsm.login" />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
