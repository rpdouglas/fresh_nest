import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface GalleryImageProps {
  src: string | null
  alt: string
  className?: string
}

export default function GalleryImage({ src, alt, className }: GalleryImageProps) {
  const { t } = useTranslation()

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        width={400}
        height={300}
        loading="lazy"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'w-full h-full flex items-center justify-center bg-slate-pale',
        className,
      )}
    >
      <span className="font-body text-sm text-charcoal">
        {t('gallery.photoComingSoon')}
      </span>
    </div>
  )
}
