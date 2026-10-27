import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { ADMIN_TABS, parseAdminTab, type AdminTab } from './adminTabs'

interface AdminSectionNavProps {
  active: AdminTab
  onChange: (tab: AdminTab) => void
}

/**
 * P3-E33: admin section navigation.
 * md+ : the original tab strip, classes unchanged. Phones: one labelled select (any section in 2 taps).
 */
export function AdminSectionNav({ active, onChange }: AdminSectionNavProps) {
  const { t } = useTranslation()
  const label = (tab: (typeof ADMIN_TABS)[number]) =>
    'fallback' in tab ? t(tab.labelKey, tab.fallback) : t(tab.labelKey)

  return (
    <>
      <div className="md:hidden sticky top-16 z-30 -mx-4 px-4 py-3 bg-warm-white border-b border-sand">
        <label htmlFor="admin-section" className="block font-body text-base font-medium text-charcoal mb-1">
          {t('admin.nav.section')}
        </label>
        <select
          id="admin-section"
          value={active}
          onChange={(e) => onChange(parseAdminTab(e.target.value))}
          className="w-full min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {ADMIN_TABS.map((tab) => (
            <option key={tab.key} value={tab.key}>{label(tab)}</option>
          ))}
        </select>
      </div>

      <div className="flex border-b border-sand gap-2 overflow-x-auto max-md:hidden">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 shrink-0',
              active === tab.key
                ? 'border-slate-brand text-slate-brand'
                : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
            )}
          >
            {label(tab)}
          </button>
        ))}
      </div>
    </>
  )
}
