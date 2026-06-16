import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Gallery from '@/pages/Gallery'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { CORNWALL_ON, AKWESASNE, SNYE_QC, LONG_SAULT, MORRISBURG } from '@/lib/data/locationData'
import LocationPage from '@/pages/LocationPage'
import LocationsOverview from '@/pages/LocationsOverview'
import FaqPage from '@/pages/FaqPage'
import BookingPage from '@/pages/BookingPage'
import PricingPage from '@/pages/PricingPage'
import AirbnbTurnoverPage from '@/pages/AirbnbTurnoverPage'
import ServicePage from '@/pages/ServicePage'
import ServicesOverview from '@/pages/ServicesOverview'
import { SERVICE_CONFIG_MAP } from '@/lib/data/serviceData'
import ThankYouPage from '@/pages/ThankYouPage'
import AdminPage from '@/pages/AdminPage'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import LoginPage from '@/pages/customer/LoginPage'
import LoginConfirmPage from '@/pages/customer/LoginConfirmPage'
import CustomerPortalLayout from '@/components/layout/CustomerPortalLayout'
import CustomerBookingsPage from '@/pages/customer/CustomerBookingsPage'
import CustomerUpcomingPage from '@/pages/customer/CustomerUpcomingPage'
import CustomerProfilePage from '@/pages/customer/CustomerProfilePage'
import { CustomerProtectedRoute } from '@/components/layout/CustomerProtectedRoute'
import { CustomerAuthProvider } from '@/components/layout/CustomerAuthContext'

/**
 * React Router v6 browser router.
 * All routes are nested under the root Layout (Navbar + Footer).
 * Placeholder routes will be replaced epic-by-epic through Phase 2–6.
 *
 * Route inventory:
 *  /                        — E04 Hero + homepage sections
 *  /services                — E07 Services Grid
 *  /services/:service       — E21 Individual service pages
 *  /services/airbnb-turnover— E20 Airbnb Turnover (Gallagher P6)
 *  /locations               — E13 Service Areas
 *  /locations/:location     — E13 Individual location pages
 *  /locations/akwesasne     — E13 (Kahnawà:ke P4)
 *  /locations/snye-qc       — E13 (Sophie P5)
 *  /pricing                 — E19 Pricing page
 *  /faq                     — E14 FAQ
 *  /gallery                 — E09 Before/After Gallery
 *  /booking                 — E15 Multi-Step Booking Form
 *  /thank-you               — E22 Thank You page
 *  /about                   — E10 How It Works + About
 *  /reviews                 — E12 Reviews
 *  /privacy                 — Static privacy policy
 *  /admin                   — E28 Admin Dashboard (Phase 5)
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ── Phase 1–2: Core pages ──
      { index: true, element: <Home /> },

      // ── Services ──
      { path: 'services',                    element: <ServicesOverview /> },
      { path: 'services/airbnb-turnover',    element: <AirbnbTurnoverPage /> },
      { path: 'services/standard-cleaning',  element: <ServicePage config={SERVICE_CONFIG_MAP.standard} /> },
      { path: 'services/deep-cleaning',      element: <ServicePage config={SERVICE_CONFIG_MAP.deep} /> },
      { path: 'services/move-out-cleaning',  element: <ServicePage config={SERVICE_CONFIG_MAP.moveout} /> },
      { path: 'services/post-construction',  element: <ServicePage config={SERVICE_CONFIG_MAP.postconstruction} /> },
      { path: 'services/commercial-cleaning', element: <ServicePage config={SERVICE_CONFIG_MAP.commercial} /> },

      // ── Locations ──
      { path: 'locations',             element: <LocationsOverview /> },
      { path: 'locations/cornwall-on', element: <LocationPage config={CORNWALL_ON} /> },
      { path: 'locations/akwesasne',   element: <LocationPage config={AKWESASNE} /> },
      { path: 'locations/snye-qc',     element: <LocationPage config={SNYE_QC} /> },
      { path: 'locations/long-sault',  element: <LocationPage config={LONG_SAULT} /> },
      { path: 'locations/morrisburg',  element: <LocationPage config={MORRISBURG} /> },

      // ── Phase 2–3 pages ──
      { path: 'pricing', element: <PricingPage /> },
      {
        path: 'faq',
        element: <FaqPage />,
      },
      {
        path: 'gallery',
        element: <Gallery />,
      },
      {
        path: 'booking',
        element: <BookingPage />,
      },
      {
        path: 'thank-you',
        element: <ThankYouPage />,
      },
      {
        path: 'about',
        element: (
          <PlaceholderPage
            titleKey="footer.aboutUs"
            epicNote="About Us / How It Works — built in E10."
          />
        ),
      },
      {
        path: 'reviews',
        element: (
          <PlaceholderPage
            titleKey="footer.reviews"
            epicNote="Client reviews page — built in E12."
          />
        ),
      },
      {
        path: 'privacy',
        element: (
          <PlaceholderPage
            titleKey="footer.privacy"
            epicNote="Privacy Policy — static page."
          />
        ),
      },
      {
        path: 'careers',
        element: (
          <PlaceholderPage
            titleKey="footer.careers"
            epicNote="Careers page — static page."
          />
        ),
      },

      // ── Phase 4: Blog ──
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogPost /> },

      // ── Phase 5: Admin ──
      {
        path: 'admin',
        element: <AdminPage />,
      },

      // ── Phase 2: Customer Portal ──
      { path: 'login', element: <LoginPage /> },
      { path: 'login-confirm', element: <LoginConfirmPage /> },
      {
        path: 'account',
        element: (
          <CustomerProtectedRoute>
            <CustomerPortalLayout />
          </CustomerProtectedRoute>
        ),
        children: [
          { index: true, element: <CustomerBookingsPage /> },
          { path: 'bookings', element: <CustomerBookingsPage /> },
          { path: 'upcoming', element: <CustomerUpcomingPage /> },
          { path: 'profile', element: <CustomerProfilePage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <CustomerAuthProvider>
      <RouterProvider router={router} />
    </CustomerAuthProvider>
  )
}
