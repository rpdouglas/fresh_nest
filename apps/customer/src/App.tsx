import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { CORNWALL_ON, AKWESASNE, SNYE_QC, LONG_SAULT, MORRISBURG } from '@/lib/data/locationData'
import { SERVICE_CONFIG_MAP } from '@/lib/data/serviceData'
import CustomerPortalLayout from '@/components/layout/CustomerPortalLayout'
import { CustomerProtectedRoute } from '@/components/layout/CustomerProtectedRoute'
import { CustomerAuthProvider } from '@/components/layout/CustomerAuthContext'
import PageLoader from '@/components/common/PageLoader'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const Home                 = lazy(() => import('@/pages/Home'))
const Gallery              = lazy(() => import('@/pages/Gallery'))
const LocationPage         = lazy(() => import('@/pages/LocationPage'))
const LocationsOverview    = lazy(() => import('@/pages/LocationsOverview'))
const FaqPage              = lazy(() => import('@/pages/FaqPage'))
const BookingPage          = lazy(() => import('@/pages/BookingPage'))
const PricingPage          = lazy(() => import('@/pages/PricingPage'))
const AirbnbTurnoverPage   = lazy(() => import('@/pages/AirbnbTurnoverPage'))
const ServicePage          = lazy(() => import('@/pages/ServicePage'))
const ServicesOverview     = lazy(() => import('@/pages/ServicesOverview'))
const ThankYouPage         = lazy(() => import('@/pages/ThankYouPage'))
const AdminPage            = lazy(() => import('@/pages/AdminPage'))
const Blog                 = lazy(() => import('@/pages/Blog'))
const BlogPost             = lazy(() => import('@/pages/BlogPost'))
const LeaveReviewPage      = lazy(() => import('@/pages/LeaveReviewPage'))
const ReviewsPage          = lazy(() => import('@/pages/ReviewsPage'))
const AboutPage            = lazy(() => import('@/pages/AboutPage'))
const CareersPage          = lazy(() => import('@/pages/CareersPage'))
const PrivacyPage          = lazy(() => import('@/pages/PrivacyPage'))
const OfflinePage          = lazy(() => import('@/pages/OfflinePage'))
const LoginPage            = lazy(() => import('@/pages/customer/LoginPage'))
const LoginConfirmPage     = lazy(() => import('@/pages/customer/LoginConfirmPage'))
const CustomerBookingsPage = lazy(() => import('@/pages/customer/CustomerBookingsPage'))
const CustomerUpcomingPage = lazy(() => import('@/pages/customer/CustomerUpcomingPage'))
const CustomerProfilePage  = lazy(() => import('@/pages/customer/CustomerProfilePage'))
const CustomerRewardsPage  = lazy(() => import('@/pages/customer/CustomerRewardsPage'))

/**
 * React Router v6 browser router.
 * All routes are nested under the root Layout (Navbar + Footer).
 *
 * Route inventory:
 *  /                        — Hero + homepage sections
 *  /services                — Services Grid
 *  /services/:service       — Individual service pages
 *  /services/airbnb-turnover— Airbnb Turnover (Gallagher P6)
 *  /locations               — Service Areas
 *  /locations/:location     — Individual location pages
 *  /locations/akwesasne     — (Kahnawà:ke P4)
 *  /locations/snye-qc       — (Sophie P5)
 *  /pricing                 — Pricing page
 *  /faq                     — FAQ
 *  /gallery                 — Before/After Gallery
 *  /booking                 — Multi-Step Booking Form
 *  /thank-you               — Thank You page
 *  /about                   — How It Works + About
 *  /reviews                 — Reviews
 *  /privacy                 — Static privacy policy
 *  /admin                   — Admin Dashboard
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ── Core pages ──
      { index: true, element: <Home /> },

      // ── Services ──
      { path: 'services',                     element: <ServicesOverview /> },
      { path: 'services/airbnb-turnover',     element: <AirbnbTurnoverPage /> },
      { path: 'services/standard-cleaning',   element: <ServicePage config={SERVICE_CONFIG_MAP.standard} /> },
      { path: 'services/deep-cleaning',       element: <ServicePage config={SERVICE_CONFIG_MAP.deep} /> },
      { path: 'services/move-out-cleaning',   element: <ServicePage config={SERVICE_CONFIG_MAP.moveout} /> },
      { path: 'services/post-construction',   element: <ServicePage config={SERVICE_CONFIG_MAP.postconstruction} /> },
      { path: 'services/commercial-cleaning', element: <ServicePage config={SERVICE_CONFIG_MAP.commercial} /> },

      // ── Locations ──
      { path: 'locations',             element: <LocationsOverview /> },
      { path: 'locations/cornwall-on', element: <LocationPage config={CORNWALL_ON} /> },
      { path: 'locations/akwesasne',   element: <LocationPage config={AKWESASNE} /> },
      { path: 'locations/snye-qc',     element: <LocationPage config={SNYE_QC} /> },
      { path: 'locations/long-sault',  element: <LocationPage config={LONG_SAULT} /> },
      { path: 'locations/morrisburg',  element: <LocationPage config={MORRISBURG} /> },

      // ── Marketing & info pages ──
      { path: 'pricing',      element: <PricingPage /> },
      { path: 'faq',          element: <FaqPage /> },
      { path: 'gallery',      element: <Gallery /> },
      { path: 'booking',      element: <BookingPage /> },
      { path: 'thank-you',    element: <ThankYouPage /> },
      { path: 'about',        element: <AboutPage /> },
      { path: 'reviews',      element: <ReviewsPage /> },
      { path: 'leave-review', element: <LeaveReviewPage /> },
      { path: 'privacy',      element: <PrivacyPage /> },
      { path: 'careers',      element: <CareersPage /> },
      { path: 'offline',      element: <OfflinePage /> },

      // ── Blog ──
      { path: 'blog',       element: <Blog /> },
      { path: 'blog/:slug', element: <BlogPost /> },

      // ── Admin ──
      { path: 'admin', element: <AdminPage /> },

      // ── Customer Portal ──
      { path: 'login',         element: <LoginPage /> },
      { path: 'login-confirm', element: <LoginConfirmPage /> },
      {
        path: 'account',
        element: (
          <CustomerProtectedRoute>
            <CustomerPortalLayout />
          </CustomerProtectedRoute>
        ),
        children: [
          { index: true,         element: <CustomerBookingsPage /> },
          { path: 'bookings',    element: <CustomerBookingsPage /> },
          { path: 'upcoming',    element: <CustomerUpcomingPage /> },
          { path: 'rewards',     element: <CustomerRewardsPage /> },
          { path: 'profile',     element: <CustomerProfilePage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <CustomerAuthProvider>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </CustomerAuthProvider>
  )
}
