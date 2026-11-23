import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineNotice from './components/OfflineNotice'
import { reportError } from './lib/clientError'
import { queryClient } from './lib/queries'

// Faults outside drawing: a click handler, a promise nobody caught.
window.addEventListener('error', (e) => reportError(e.error ?? e.message, { source: 'window' }))
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { source: 'promise' }))

// Faults while drawing: the ones ErrorBoundary caught, and any that got past it.
// Giving React these handlers replaces its own, which print to the console, so print too.
const drawingFault = (error: unknown, info: { componentStack?: string }) => {
  console.error(error)
  reportError(error, { source: 'render', componentStack: info.componentStack })
}

// The installed app (decision 0043): the service worker keeps the app's files so it opens with no signal. Only the
// built site has one; the dev server and the browser tests run without it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // without it the app still works online, as a plain website does, so a refusal is not a fault to report
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')!, { onCaughtError: drawingFault, onUncaughtError: drawingFault }).render(
  <StrictMode>
    {/* the report has its own boundary in App; this one is for a fault anywhere else, instead of a blank page */}
    <ErrorBoundary wholePage onRetry={() => window.location.reload()}>
      <QueryClientProvider client={queryClient}>
        <OfflineNotice />
        <Root />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
