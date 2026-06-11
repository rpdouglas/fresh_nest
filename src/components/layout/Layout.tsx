import { Outlet, ScrollRestoration } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import JsonLd from '@/components/seo/JsonLd'
import { getLocalBusinessSchema } from '@/lib/utils/seo'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { logCustomEvent } from '@/lib/firebase/analytics'
import CookieBanner from './CookieBanner'
/**
 * Root layout wrapper.
 * All routes render their content via <Outlet /> between Navbar and Footer.
 * ScrollRestoration ensures the page scrolls to the top on route transitions.
 */
export default function Layout() {
  const { t } = useTranslation()
  const businessSchema = getLocalBusinessSchema(t)
  const location = useLocation()

  useEffect(() => {
    // Only logs if consent is granted and analytics is initialized
    logCustomEvent('page_view', { page_path: location.pathname })
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen bg-warm-white">
      <JsonLd schema={businessSchema} />
      <Navbar />
      <main
        id="main-content"
        role="main"
        className="flex-1"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
      <ScrollRestoration />
    </div>
  )
}

