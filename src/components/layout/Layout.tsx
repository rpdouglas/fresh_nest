import { Outlet, ScrollRestoration } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import JsonLd from '@/components/seo/JsonLd'
import { getLocalBusinessSchema } from '@/lib/seo'
import { useTranslation } from 'react-i18next'

/**
 * Root layout wrapper.
 * All routes render their content via <Outlet /> between Navbar and Footer.
 * ScrollRestoration ensures the page scrolls to the top on route transitions.
 */
export default function Layout() {
  const { t } = useTranslation()
  const businessSchema = getLocalBusinessSchema(t)

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
      <ScrollRestoration />
    </div>
  )
}

