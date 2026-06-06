import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PlaceholderPageProps {
  titleKey: string
  epicNote: string
}

/**
 * Reusable placeholder used for all stub routes in E03.
 * Each page will be replaced by its real content in the corresponding epic.
 */
export default function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation()
  return (
    <div className="py-20 px-6 text-center max-w-content mx-auto">
      <h1 className="font-display text-4xl text-charcoal mb-4">
        {t(titleKey)}
      </h1>
      <Link
        to="/"
        className={cn(
          'bg-slate-brand text-white font-body font-medium rounded',
          'px-6 min-h-[48px] inline-flex items-center',
          'hover:bg-slate-dark transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
        )}
      >
        {t('nav.home')}
      </Link>
    </div>
  )
}
