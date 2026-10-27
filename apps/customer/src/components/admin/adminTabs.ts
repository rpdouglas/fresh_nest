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
  // P3-E36 (W0-2): Operational Settings & Policy (Owners edit, Managers view read-only)
  { key: 'settings', labelKey: 'admin.dashboard.tabs.settings' },
  // P3-E35: Owners only — who has office access (Owner / Manager)
  { key: 'team', labelKey: 'admin.dashboard.tabs.team', ownerOnly: true },
] as const

export type AdminTab = (typeof ADMIN_TABS)[number]['key']

/** Tabs this person can open: everyone in the office sees all tabs except the Owner-only ones. */
export function visibleAdminTabs(isOwner: boolean) {
  return ADMIN_TABS.filter((tab) => isOwner || !('ownerOnly' in tab))
}

export function parseAdminTab(value: string | null, isOwner = true): AdminTab {
  return visibleAdminTabs(isOwner).find((tab) => tab.key === value)?.key ?? 'bookings'
}
