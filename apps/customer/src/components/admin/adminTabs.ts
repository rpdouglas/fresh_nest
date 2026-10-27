// Order and labels match the original hand-written tab buttons (keys and fallbacks unchanged).
export const ADMIN_TABS = [
  { key: 'bookings', labelKey: 'admin.dashboard.tabs.bookings' },
  { key: 'dispatch', labelKey: 'admin.dashboard.tabs.dispatch', fallback: 'Dispatch Board' },
  { key: 'analytics', labelKey: 'admin.dashboard.tabs.analytics' },
  { key: 'staff', labelKey: 'admin.dashboard.tabs.staff' },
  { key: 'templates', labelKey: 'admin.dashboard.tabs.templates' },
  { key: 'payRates', labelKey: 'admin.dashboard.tabs.payRates' },
  { key: 'auditLogs', labelKey: 'admin.dashboard.tabs.auditLogs', fallback: 'Audit Logs' },
  { key: 'reviews', labelKey: 'admin.dashboard.tabs.reviews', fallback: 'Reviews' },
  { key: 'gallery', labelKey: 'admin.dashboard.tabs.gallery' },
] as const

export type AdminTab = (typeof ADMIN_TABS)[number]['key']

export function parseAdminTab(value: string | null): AdminTab {
  return ADMIN_TABS.find((tab) => tab.key === value)?.key ?? 'bookings'
}
