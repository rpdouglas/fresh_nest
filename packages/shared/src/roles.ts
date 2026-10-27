/**
 * P3-E35: role claim helpers shared by the customer app (admin panel) and the staff app.
 * functions/src/lib/roles.ts holds the server-side rules (who may change roles).
 *
 * The legacy `admin` claim is no longer accepted (P3-E35 cleanup).
 */
export type OfficeRole = 'owner' | 'manager'

export function officeRoleOf(role: unknown): OfficeRole | null {
  if (role === 'owner') return 'owner'
  if (role === 'manager') return 'manager'
  return null
}

export const isOfficeRole = (role: unknown): boolean => officeRoleOf(role) !== null

/**
 * The role on an `admins/{email}` office-list entry. Old hand-made entries have no role or
 * `admin`; they count as Owner (the same reading as functions/src/lib/roles.ts allowlistRole).
 */
export function allowlistOfficeRole(role: unknown): OfficeRole | null {
  return officeRoleOf(role === undefined || role === null || role === 'admin' ? 'owner' : role)
}

/** Roles allowed into the staff app: staff, field supervisors and the office. */
export const isStaffAppRole = (role: unknown): boolean =>
  role === 'staff' || role === 'supervisor' || isOfficeRole(role)
