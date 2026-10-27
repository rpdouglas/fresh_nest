/**
 * P3-E35: role claim helpers shared by the customer app (admin panel) and the staff app.
 * functions/src/lib/roles.ts holds the server-side rules (who may change roles).
 *
 * TRANSITION: the legacy `admin` claim is treated as `owner` until the cleanup PR removes it.
 */
export type OfficeRole = 'owner' | 'manager'

export function officeRoleOf(role: unknown): OfficeRole | null {
  if (role === 'owner' || role === 'admin') return 'owner'
  if (role === 'manager') return 'manager'
  return null
}

export const isOfficeRole = (role: unknown): boolean => officeRoleOf(role) !== null

/** Roles allowed into the staff app: staff, field supervisors and the office. */
export const isStaffAppRole = (role: unknown): boolean =>
  role === 'staff' || role === 'supervisor' || isOfficeRole(role)
