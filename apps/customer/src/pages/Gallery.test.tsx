import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { GalleryPair } from '@/types'
import Gallery from './Gallery'

const state = vi.hoisted(() => ({ language: 'en', pairs: [] as unknown[], isLoading: false }))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: state.language } }),
}))
vi.mock('@/components/seo/SEO', () => ({ default: () => null }))
vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('@/hooks/useGalleryPairs', () => ({
  useGalleryPairs: () => ({ data: state.pairs, isLoading: state.isLoading }),
}))
vi.mock('framer-motion', () => {
  const strip = ({ children, className }: { children?: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
  return { motion: { div: strip }, AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</> }
})

const pair: GalleryPair = {
  id: 'p1',
  serviceKey: 'deep',
  captionEn: 'Kitchen deep clean',
  captionFr: 'Grand nettoyage de cuisine',
  beforePath: 'gallery/p1/before-1.jpg',
  afterPath: 'gallery/p1/after-1.jpg',
  beforeUrl: 'https://example.test/before.jpg',
  afterUrl: 'https://example.test/after.jpg',
  published: true,
  featured: true,
  order: 0,
  consentConfirmed: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-uid',
}

const renderPage = () => render(<MemoryRouter><Gallery /></MemoryRouter>)

describe('Gallery page (P3-E32)', () => {
  beforeEach(() => {
    state.language = 'en'
    state.pairs = []
    state.isLoading = false
  })

  it('shows the empty message when there are no published pairs', () => {
    renderPage()
    expect(screen.getByText('gallery.empty')).toBeInTheDocument()
  })

  it('shows a loading status while pairs load', () => {
    state.isLoading = true
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('gallery.loading')
    expect(screen.queryByText('gallery.empty')).not.toBeInTheDocument()
  })

  it('shows each pair with its uploaded photos and English caption', () => {
    state.pairs = [pair]
    renderPage()
    expect(screen.getByText('Kitchen deep clean')).toBeInTheDocument()
    const srcs = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    expect(srcs).toEqual([pair.beforeUrl, pair.afterUrl])
  })

  it('shows the French caption to French visitors (P1 Diane, P5 Sophie)', () => {
    state.language = 'fr-CA'
    state.pairs = [pair]
    renderPage()
    expect(screen.getByText('Grand nettoyage de cuisine')).toBeInTheDocument()
    expect(screen.queryByText('Kitchen deep clean')).not.toBeInTheDocument()
  })
})
