import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { SHOW_GALLERY } from '@/lib/config'
import { useGalleryAdmin } from '@/components/admin/hooks/useGalleryAdmin'
import { GalleryPairForm } from '@/components/admin/GalleryPairForm'
import {
  deleteGalleryPair,
  galleryCaption,
  setGalleryPairFlag,
  swapGalleryPairOrder,
} from '@/lib/firebase/gallery'
import type { GalleryPair } from '@/types'

interface GalleryManagerTabProps {
  isAuthorized: boolean
  adminUid: string
}

const primaryButton = cn(
  'min-h-[48px] px-6 py-3 rounded bg-slate-brand text-white font-body font-medium text-base',
  'hover:bg-slate-dark transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
)
const secondaryButton = cn(
  'min-h-[48px] px-4 py-3 rounded border border-sand text-charcoal font-body font-medium text-base',
  'hover:bg-cream transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-slate-brand',
  'disabled:opacity-50 disabled:cursor-not-allowed',
)

export function GalleryManagerTab({ isAuthorized, adminUid }: GalleryManagerTabProps) {
  const { t, i18n } = useTranslation()
  const { pairs, loading, loadFailed } = useGalleryAdmin(isAuthorized)
  // 'new' = add form open; a pair id = that pair is being edited.
  const [formFor, setFormFor] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionFailed, setActionFailed] = useState(false)

  const run = async (pairId: string, action: () => Promise<void>) => {
    setBusyId(pairId)
    setActionFailed(false)
    try {
      await action()
    } catch (err) {
      console.error(`Gallery action failed on pair ${pairId}:`, err)
      setActionFailed(true)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nextOrder = pairs.length === 0 ? 0 : Math.max(...pairs.map((p) => p.order)) + 1
  const busy = busyId !== null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="font-sub text-2xl text-charcoal mb-2">{t('galleryAdmin.title')}</h2>
          <p className="font-body text-base text-text-muted max-w-2xl">{t('galleryAdmin.subtitle')}</p>
        </div>
        {formFor === null && !loadFailed && (
          <button type="button" onClick={() => setFormFor('new')} className={cn(primaryButton, 'shrink-0')}>
            {t('galleryAdmin.addPair')}
          </button>
        )}
      </div>

      {!SHOW_GALLERY && (
        <p className="p-4 bg-cream border border-sand rounded font-body text-base text-charcoal">
          {t('galleryAdmin.hiddenNotice')}
        </p>
      )}

      {loadFailed && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
          {t('galleryAdmin.loadFailed')}
        </div>
      )}

      {actionFailed && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
          {t('galleryAdmin.actionFailed')}
        </div>
      )}

      {formFor === 'new' && (
        <GalleryPairForm adminUid={adminUid} nextOrder={nextOrder} onDone={() => setFormFor(null)} />
      )}

      {!loadFailed && pairs.length === 0 && formFor === null && (
        <div className="bg-white rounded border border-sand p-8 text-center">
          <p className="font-body text-base text-text-muted">{t('galleryAdmin.empty')}</p>
        </div>
      )}

      <ul className="flex flex-col gap-4 list-none m-0 p-0">
        {pairs.map((pair: GalleryPair, idx) => {
          const id = pair.id!
          if (formFor === id) {
            return (
              <li key={id}>
                <GalleryPairForm pair={pair} adminUid={adminUid} nextOrder={nextOrder} onDone={() => setFormFor(null)} />
              </li>
            )
          }
          return (
            <li key={id} className="bg-white rounded border border-sand shadow-sm p-4 md:p-6 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid grid-cols-2 gap-2 w-full md:w-80 shrink-0">
                  {([['before', pair.beforeUrl], ['after', pair.afterUrl]] as const).map(([slot, url]) => (
                    <figure key={slot} className="m-0">
                      <img
                        src={url}
                        alt={t(slot === 'before' ? 'gallery.beforeAlt' : 'gallery.afterAlt', {
                          service: t(`services.${pair.serviceKey}.title`),
                        })}
                        loading="lazy"
                        className="aspect-square w-full object-cover rounded border border-sand bg-slate-pale"
                      />
                      <figcaption className="font-body text-base text-text-muted mt-1">
                        {t(slot === 'before' ? 'gallery.beforeLabel' : 'gallery.afterLabel')}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="font-body text-base font-medium text-charcoal break-words">
                    {galleryCaption(pair, i18n.language)}
                  </p>
                  <p className="font-body text-base text-text-muted break-words">
                    {galleryCaption(pair, i18n.language.startsWith('fr') ? 'en' : 'fr')}
                  </p>
                  <p className="font-body text-base text-text-muted">{t(`services.${pair.serviceKey}.title`)}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center font-body text-sm font-semibold px-2.5 py-0.5 rounded',
                        pair.published ? 'bg-slate-pale text-slate-dark' : 'bg-cream text-charcoal',
                      )}
                    >
                      {pair.published ? t('galleryAdmin.card.published') : t('galleryAdmin.card.draft')}
                    </span>
                    {pair.featured && (
                      <span className="inline-flex items-center font-body text-sm font-semibold px-2.5 py-0.5 rounded bg-sand text-charcoal">
                        {t('galleryAdmin.card.featured')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {confirmDeleteId === id ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-body text-base text-charcoal">{t('galleryAdmin.card.confirmDelete')}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { void run(id, () => deleteGalleryPair(pair)).then(() => setConfirmDeleteId(null)) }}
                    className={primaryButton}
                  >
                    {t('galleryAdmin.card.confirmDeleteYes')}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setConfirmDeleteId(null)} className={secondaryButton}>
                    {t('galleryAdmin.form.cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { void run(id, () => setGalleryPairFlag(id, 'published', !pair.published)) }}
                    className={pair.published ? secondaryButton : primaryButton}
                  >
                    {pair.published ? t('galleryAdmin.card.unpublish') : t('galleryAdmin.card.publish')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { void run(id, () => setGalleryPairFlag(id, 'featured', !pair.featured)) }}
                    className={secondaryButton}
                  >
                    {pair.featured ? t('galleryAdmin.card.unfeature') : t('galleryAdmin.card.feature')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx === 0}
                    onClick={() => { void run(id, () => swapGalleryPairOrder(pair, pairs[idx - 1])) }}
                    className={secondaryButton}
                  >
                    {t('galleryAdmin.card.moveUp')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx === pairs.length - 1}
                    onClick={() => { void run(id, () => swapGalleryPairOrder(pair, pairs[idx + 1])) }}
                    className={secondaryButton}
                  >
                    {t('galleryAdmin.card.moveDown')}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setFormFor(id)} className={secondaryButton}>
                    {t('galleryAdmin.card.edit')}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setConfirmDeleteId(id)} className={secondaryButton}>
                    {t('galleryAdmin.card.delete')}
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
