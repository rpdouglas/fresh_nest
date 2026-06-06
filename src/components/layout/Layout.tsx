import { Outlet, ScrollRestoration } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * Root layout wrapper.
 * All routes render their content via <Outlet /> between Navbar and Footer.
 * ScrollRestoration ensures the page scrolls to the top on route transitions.
 */
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-warm-white">
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
