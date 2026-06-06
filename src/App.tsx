import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Gallery from '@/pages/Gallery'
import PlaceholderPage from '@/pages/PlaceholderPage'

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
      {
        path: 'services',
        element: (
          <PlaceholderPage
            titleKey="footer.services"
            epicNote="Services grid — built in E07."
          />
        ),
      },
      {
        path: 'services/airbnb-turnover',
        element: (
          <PlaceholderPage
            titleKey="footer.airbnbTurnover"
            epicNote="Airbnb Turnover service page — built in E20."
          />
        ),
      },
      {
        path: 'services/standard-cleaning',
        element: (
          <PlaceholderPage
            titleKey="footer.standardCleaning"
            epicNote="Standard Cleaning service page — built in E21."
          />
        ),
      },
      {
        path: 'services/deep-cleaning',
        element: (
          <PlaceholderPage
            titleKey="footer.deepCleaning"
            epicNote="Deep Cleaning service page — built in E21."
          />
        ),
      },
      {
        path: 'services/move-out-cleaning',
        element: (
          <PlaceholderPage
            titleKey="footer.moveOutCleaning"
            epicNote="Move-Out Cleaning service page — built in E21."
          />
        ),
      },
      {
        path: 'services/post-construction',
        element: (
          <PlaceholderPage
            titleKey="footer.postConstruction"
            epicNote="Post-Construction service page — built in E21."
          />
        ),
      },
      {
        path: 'services/commercial-cleaning',
        element: (
          <PlaceholderPage
            titleKey="footer.commercialCleaning"
            epicNote="Commercial Cleaning service page — built in E21."
          />
        ),
      },

      // ── Locations ──
      {
        path: 'locations',
        element: (
          <PlaceholderPage
            titleKey="footer.locations"
            epicNote="Service areas overview — built in E13."
          />
        ),
      },
      {
        path: 'locations/cornwall',
        element: (
          <PlaceholderPage
            titleKey="footer.cornwallON"
            epicNote="Cornwall, ON location page — built in E13."
          />
        ),
      },
      {
        path: 'locations/akwesasne',
        element: (
          <PlaceholderPage
            titleKey="footer.akwesasne"
            epicNote="Akwesasne / Cornwall Island location page — built in E13. (Kahnawà:ke P4)"
          />
        ),
      },
      {
        path: 'locations/snye-qc',
        element: (
          <PlaceholderPage
            titleKey="footer.snyeQC"
            epicNote="Snye, QC (Akwesasne Quebec side) location page — built in E13. (Sophie P5)"
          />
        ),
      },
      {
        path: 'locations/long-sault',
        element: (
          <PlaceholderPage
            titleKey="footer.longSault"
            epicNote="Long Sault location page — built in E13."
          />
        ),
      },
      {
        path: 'locations/morrisburg',
        element: (
          <PlaceholderPage
            titleKey="footer.morrisburg"
            epicNote="Morrisburg location page — built in E13."
          />
        ),
      },

      // ── Phase 2–3 pages ──
      {
        path: 'pricing',
        element: (
          <PlaceholderPage
            titleKey="nav.pricing"
            epicNote="Pricing page — built in E19."
          />
        ),
      },
      {
        path: 'faq',
        element: (
          <PlaceholderPage
            titleKey="nav.faq"
            epicNote="FAQ page — built in E14."
          />
        ),
      },
      {
        path: 'gallery',
        element: <Gallery />,
      },
      {
        path: 'booking',
        element: (
          <PlaceholderPage
            titleKey="nav.booking"
            epicNote="Multi-step booking form — built in E15."
          />
        ),
      },
      {
        path: 'thank-you',
        element: (
          <PlaceholderPage
            titleKey="common.bookNow"
            epicNote="Thank You / confirmation page — built in E22."
          />
        ),
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

      // ── Phase 5: Admin ──
      {
        path: 'admin',
        element: (
          <PlaceholderPage
            titleKey="footer.company"
            epicNote="Admin Dashboard — built in E28 (Phase 5, requires Firebase Auth)."
          />
        ),
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
