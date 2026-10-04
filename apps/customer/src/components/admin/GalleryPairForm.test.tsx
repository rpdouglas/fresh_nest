import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GalleryPairForm } from './GalleryPairForm'
import * as gallery from '@/lib/firebase/gallery'
import type { GalleryPair } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/lib/firebase/gallery', () => ({
  createGalleryPair: vi.fn(),
  updateGalleryPair: vi.fn(),
}))
vi.mock('@/lib/utils/imageProcessing', () => ({
  processGalleryPhoto: vi.fn(),
  checkGalleryPhoto: vi.fn(),
  GalleryImageError: class extends Error {},
  GALLERY_ACCEPTED_TYPES: ['image/jpeg'],
}))

const existing: GalleryPair = {
  id: 'p1',
  serviceKey: 'deep',
  captionEn: 'Kitchen deep clean',
  captionFr: 'Grand nettoyage de cuisine',
  beforePath: 'gallery/p1/before-1.jpg',
  afterPath: 'gallery/p1/after-1.jpg',
  beforeUrl: 'https://example.test/before.jpg',
  afterUrl: 'https://example.test/after.jpg',
  published: true,
  featured: false,
  order: 0,
  consentConfirmed: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-uid',
}

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const save = () => fireEvent.click(screen.getByRole('button', { name: 'galleryAdmin.form.save' }))

describe('GalleryPairForm (P3-E32)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires both captions and the consent tick before saving', async () => {
    render(<GalleryPairForm adminUid="admin-uid" nextOrder={0} onDone={vi.fn()} />)
    save()
    expect(await screen.findByText('galleryAdmin.form.errors.consentRequired')).toBeInTheDocument()
    expect(screen.getAllByText('galleryAdmin.form.errors.required')).toHaveLength(2)
    expect(gallery.createGalleryPair).not.toHaveBeenCalled()
  })

  it('requires a before and an after photo for a new pair', async () => {
    render(<GalleryPairForm adminUid="admin-uid" nextOrder={0} onDone={vi.fn()} />)
    fill('galleryAdmin.form.captionEn', 'Kitchen deep clean')
    fill('galleryAdmin.form.captionFr', 'Grand nettoyage de cuisine')
    fireEvent.click(screen.getByLabelText('galleryAdmin.form.consent'))
    save()
    expect(await screen.findByText('galleryAdmin.form.errors.photosRequired')).toBeInTheDocument()
    expect(gallery.createGalleryPair).not.toHaveBeenCalled()
  })

  it('saves caption edits on an existing pair without new photos', async () => {
    const onDone = vi.fn()
    render(<GalleryPairForm pair={existing} adminUid="admin-uid" nextOrder={1} onDone={onDone} />)
    fill('galleryAdmin.form.captionFr', 'Cuisine impeccable')
    fireEvent.click(screen.getByLabelText('galleryAdmin.form.consent'))
    save()
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(gallery.updateGalleryPair).toHaveBeenCalledWith(
      existing,
      { serviceKey: 'deep', captionEn: 'Kitchen deep clean', captionFr: 'Cuisine impeccable', consentConfirmed: true },
      { before: undefined, after: undefined },
    )
  })

  it('tells the admin when saving fails', async () => {
    vi.mocked(gallery.updateGalleryPair).mockRejectedValueOnce(new Error('permission-denied'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onDone = vi.fn()
    render(<GalleryPairForm pair={existing} adminUid="admin-uid" nextOrder={1} onDone={onDone} />)
    fireEvent.click(screen.getByLabelText('galleryAdmin.form.consent'))
    save()
    expect(await screen.findByText('galleryAdmin.form.errors.saveFailed')).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()
  })
})
