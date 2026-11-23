import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { ADMIN_TABS, visibleAdminTabs, parseAdminTab, type AdminTab } from './adminTabs'

interface AdminSectionNavProps {
  active: AdminTab
  onChange: (tab: AdminTab) => void
  /** P3-E35: Owners also see the Team & roles tab. */
  isOwner?: boolean
}

const OPS_HUB_URL = (import.meta.env.VITE_OPS_URL as string | undefined)?.trim() || 'https://ops.freshnestco.ca'

/**
 * P3-E33: admin section navigation.
 * md+ : the original tab strip, classes unchanged. Phones: one labelled select (any section in 2 taps).
 * P3-E41 (ADR-022): links directly to the Ops Hub (`ops.freshnestco.ca`) for Owners and Managers.
 */
export function AdminSectionNav({ active, onChange, isOwner = false }: AdminSectionNavProps) {
  const { t } = useTranslation()
  const tabs = visibleAdminTabs(isOwner)
  const label = (tab: (typeof ADMIN_TABS)[number]) =>
    'fallback' in tab ? t(tab.labelKey, tab.fallback) : t(tab.labelKey)

  return (
    <>
      <div className="md:hidden sticky top-16 z-30 -mx-4 px-4 py-3 bg-warm-white border-b border-sand">
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="admin-section" className="block font-body text-base font-medium text-charcoal">
            {t('admin.nav.section')}
          </label>
          <a
            href={OPS_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-[48px] px-3 rounded border border-slate-brand font-body text-base font-medium text-slate-brand hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            {t('admin.nav.operations')} ↗
          </a>
        </div>
        <select
          id="admin-section"
          value={active}
          onChange={(e) => onChange(parseAdminTab(e.target.value, isOwner))}
          className="w-full min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>{label(tab)}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center border-b border-sand gap-2 overflow-x-auto max-md:hidden">
        {tabs.map((tab) => (
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
        <a
          href={OPS_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto my-1 min-h-[48px] inline-flex items-center px-4 rounded border border-slate-brand font-body font-medium text-base text-slate-brand hover:bg-slate-pale transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand shrink-0"
        >
          {t('admin.nav.operations')} ↗
        </a>
      </div>
    </>
  )
}
