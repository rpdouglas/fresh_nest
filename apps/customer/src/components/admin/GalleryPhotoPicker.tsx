import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import {
  checkGalleryPhoto,
  GalleryImageError,
  GALLERY_ACCEPTED_TYPES,
  type ImageProcessingError,
} from '@/lib/utils/imageProcessing'

export interface PickedPhoto {
  file: File
  /** 0–1 along the photo's long side; see computeSquareCrop. */
  position: number
}

interface GalleryPhotoPickerProps {
  id: string
  label: string
  value: PickedPhoto | null
  onChange: (value: PickedPhoto | null) => void
  /** Photo already saved on the pair, shown until a new one is picked. */
  currentUrl?: string
  disabled?: boolean
}

export function GalleryPhotoPicker({ id, label, value, onChange, currentUrl, disabled }: GalleryPhotoPickerProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<ImageProcessingError | null>(null)

  const file = value?.file ?? null
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    try {
      await checkGalleryPhoto(picked)
      setError(null)
      onChange({ file: picked, position: 0.5 })
    } catch (err) {
      setError(err instanceof GalleryImageError ? err.code : 'unreadable')
      onChange(null)
    }
  }

  const shownUrl = previewUrl ?? currentUrl ?? null
  const percent = Math.round((value?.position ?? 0.5) * 100)

  return (
    <div className="flex flex-col gap-3">
      <span className="font-body text-base font-medium text-charcoal">{label}</span>

      {shownUrl && (
        <div className="relative aspect-square w-full max-w-xs rounded overflow-hidden border border-sand bg-slate-pale">
          <img
            src={shownUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${percent}% ${percent}%` }}
          />
          {/* The grid view shows the centre two-thirds of the square. */}
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1/6 bg-charcoal/40 pointer-events-none" />
          <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/6 bg-charcoal/40 pointer-events-none" />
        </div>
      )}

      {value && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label htmlFor={`${id}-position`} className="font-body text-base text-charcoal">
            {t('galleryAdmin.picker.position')}
          </label>
          <input
            id={`${id}-position`}
            type="range"
            min={0}
            max={100}
            value={percent}
            disabled={disabled}
            onChange={(e) => onChange({ file: value.file, position: Number(e.target.value) / 100 })}
            className="w-full min-h-[48px] accent-slate-brand"
          />
          <p className="font-body text-base text-text-muted">{t('galleryAdmin.picker.cropNote')}</p>
        </div>
      )}

      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center justify-center self-start min-h-[48px] px-6 py-3 rounded cursor-pointer',
          'border border-sand bg-white font-body font-medium text-base text-charcoal',
          'hover:bg-cream transition-colors duration-150',
          'focus-within:ring-2 focus-within:ring-slate-brand',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          id={id}
          type="file"
          accept={GALLERY_ACCEPTED_TYPES.join(',')}
          onChange={(e) => { void handleFile(e) }}
          disabled={disabled}
          className="sr-only"
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {shownUrl ? t('galleryAdmin.picker.change') : t('galleryAdmin.picker.choose')}
      </label>

      {error && (
        <p id={`${id}-error`} role="alert" className="font-body text-base text-red-600">
          {t(`galleryAdmin.picker.errors.${error}`)}
        </p>
      )}
    </div>
  )
}
