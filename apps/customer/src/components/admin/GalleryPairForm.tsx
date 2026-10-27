import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils/utils'
import { createGalleryPair, updateGalleryPair } from '@/lib/firebase/gallery'
import { processGalleryPhoto } from '@/lib/utils/imageProcessing'
import { GalleryPhotoPicker, type PickedPhoto } from '@/components/admin/GalleryPhotoPicker'
import type { GalleryPair } from '@/types'

const SERVICE_KEYS = ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial'] as const

// Messages are i18n keys, resolved with t() where they are shown.
const galleryPairSchema = z.object({
  serviceKey: z.enum(SERVICE_KEYS),
  captionEn: z.string().trim().min(1, 'galleryAdmin.form.errors.required').max(120, 'galleryAdmin.form.errors.captionTooLong'),
  captionFr: z.string().trim().min(1, 'galleryAdmin.form.errors.required').max(120, 'galleryAdmin.form.errors.captionTooLong'),
  consentConfirmed: z.boolean().refine((v) => v, 'galleryAdmin.form.errors.consentRequired'),
})
type GalleryPairFormData = z.infer<typeof galleryPairSchema>

interface GalleryPairFormProps {
  /** The pair being edited; omit to add a new one. */
  pair?: GalleryPair
  adminUid: string
  /** Display position for a new pair (after the last existing one). */
  nextOrder: number
  onDone: () => void
}

export function GalleryPairForm({ pair, adminUid, nextOrder, onDone }: GalleryPairFormProps) {
  const { t } = useTranslation()
  const [before, setBefore] = useState<PickedPhoto | null>(null)
  const [after, setAfter] = useState<PickedPhoto | null>(null)
  const [photosMissing, setPhotosMissing] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GalleryPairFormData>({
    resolver: zodResolver(galleryPairSchema),
    defaultValues: {
      serviceKey: pair?.serviceKey ?? 'standard',
      captionEn: pair?.captionEn ?? '',
      captionFr: pair?.captionFr ?? '',
      consentConfirmed: false,
    },
  })

  const onSubmit = async (data: GalleryPairFormData) => {
    setSaveFailed(false)
    if (!pair && (!before || !after)) {
      setPhotosMissing(true)
      return
    }
    setPhotosMissing(false)
    try {
      const [beforeBlob, afterBlob] = await Promise.all([
        before ? processGalleryPhoto(before.file, before.position) : undefined,
        after ? processGalleryPhoto(after.file, after.position) : undefined,
      ])
      if (pair) {
        await updateGalleryPair(pair, data, { before: beforeBlob, after: afterBlob })
      } else {
        await createGalleryPair(data, beforeBlob!, afterBlob!, adminUid, nextOrder)
      }
      onDone()
    } catch (err) {
      console.error('Failed to save gallery pair:', err)
      setSaveFailed(true)
    }
  }

  const labelClass = 'font-body text-base font-medium text-charcoal'
  const inputClass = cn(
    'w-full min-h-[48px] px-4 py-3 rounded border border-sand bg-white',
    'font-body text-base text-charcoal',
    'focus:outline-none focus:ring-2 focus:ring-slate-brand',
  )
  const errorClass = 'font-body text-base text-red-600'

  return (
    <form
      onSubmit={(e) => { void handleSubmit(onSubmit)(e) }}
      noValidate
      className="bg-white rounded border border-sand shadow-sm p-4 md:p-6 flex flex-col gap-6"
    >
      <h3 className="font-sub text-xl text-charcoal">
        {pair ? t('galleryAdmin.form.editTitle') : t('galleryAdmin.form.addTitle')}
      </h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="gp-service" className={labelClass}>{t('galleryAdmin.form.service')}</label>
        <select id="gp-service" {...register('serviceKey')} className={inputClass} disabled={isSubmitting}>
          {SERVICE_KEYS.map((key) => (
            <option key={key} value={key}>{t(`services.${key}.title`)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="gp-caption-en" className={labelClass}>{t('galleryAdmin.form.captionEn')}</label>
          <input
            id="gp-caption-en"
            type="text"
            lang="en"
            {...register('captionEn')}
            className={inputClass}
            disabled={isSubmitting}
            aria-describedby="gp-caption-hint"
          />
          {errors.captionEn?.message && <p role="alert" className={errorClass}>{t(errors.captionEn.message)}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="gp-caption-fr" className={labelClass}>{t('galleryAdmin.form.captionFr')}</label>
          <input
            id="gp-caption-fr"
            type="text"
            lang="fr"
            {...register('captionFr')}
            className={inputClass}
            disabled={isSubmitting}
            aria-describedby="gp-caption-hint"
          />
          {errors.captionFr?.message && <p role="alert" className={errorClass}>{t(errors.captionFr.message)}</p>}
        </div>
        <p id="gp-caption-hint" className="font-body text-base text-text-muted md:col-span-2">
          {t('galleryAdmin.form.captionHint')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GalleryPhotoPicker
          id="gp-before"
          label={t('galleryAdmin.form.beforePhoto')}
          value={before}
          onChange={setBefore}
          currentUrl={pair?.beforeUrl}
          disabled={isSubmitting}
        />
        <GalleryPhotoPicker
          id="gp-after"
          label={t('galleryAdmin.form.afterPhoto')}
          value={after}
          onChange={setAfter}
          currentUrl={pair?.afterUrl}
          disabled={isSubmitting}
        />
      </div>
      {photosMissing && <p role="alert" className={errorClass}>{t('galleryAdmin.form.errors.photosRequired')}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="gp-consent" className="flex items-start gap-3 min-h-[48px] cursor-pointer">
          <input
            id="gp-consent"
            type="checkbox"
            {...register('consentConfirmed')}
            disabled={isSubmitting}
            className="mt-1 w-6 h-6 shrink-0 accent-slate-brand"
          />
          <span className="font-body text-base text-charcoal">{t('galleryAdmin.form.consent')}</span>
        </label>
        {errors.consentConfirmed?.message && (
          <p role="alert" className={errorClass}>{t(errors.consentConfirmed.message)}</p>
        )}
      </div>

      {saveFailed && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
          {t('galleryAdmin.form.errors.saveFailed')}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'min-h-[48px] px-6 py-3 rounded bg-slate-brand text-white font-body font-medium text-base',
            'hover:bg-slate-dark transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            isSubmitting && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isSubmitting ? t('galleryAdmin.form.saving') : t('galleryAdmin.form.save')}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isSubmitting}
          className={cn(
            'min-h-[48px] px-6 py-3 rounded border border-sand text-charcoal font-body font-medium text-base',
            'hover:bg-cream transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand',
            isSubmitting && 'opacity-50 cursor-not-allowed',
          )}
        >
          {t('galleryAdmin.form.cancel')}
        </button>
      </div>
    </form>
  )
}
