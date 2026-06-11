import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CookieBanner from './CookieBanner'
import * as analytics from '@/lib/firebase/analytics'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/lib/firebase/analytics', () => ({
  initializeAnalytics: vi.fn(),
  revokeAnalytics: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}))

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders correctly if no consent is set', () => {
    render(<CookieBanner />)
    expect(screen.getByText('cookieBanner.message')).toBeInTheDocument()
  })

  it('does not render if consent is already granted', () => {
    localStorage.setItem('freshnest_consent', 'granted')
    render(<CookieBanner />)
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
    expect(analytics.initializeAnalytics).toHaveBeenCalled()
  })

  it('accepts cookies and initializes analytics', () => {
    render(<CookieBanner />)
    const acceptBtn = screen.getByText('cookieBanner.accept')
    fireEvent.click(acceptBtn)
    expect(localStorage.getItem('freshnest_consent')).toBe('granted')
    expect(analytics.initializeAnalytics).toHaveBeenCalled()
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
  })

  it('declines cookies and revokes analytics', () => {
    render(<CookieBanner />)
    const declineBtn = screen.getByText('cookieBanner.decline')
    fireEvent.click(declineBtn)
    expect(localStorage.getItem('freshnest_consent')).toBe('denied')
    expect(analytics.revokeAnalytics).toHaveBeenCalled()
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
  })
})
