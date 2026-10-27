import { HttpsError } from 'firebase-functions/v2/https'

/**
 * P3-E35: role model (custom claim `role`).
 *
 * - owner   — everything, plus granting/revoking owner and manager
 * - manager — the same office access as owner, except granting/revoking owner and manager
 * - supervisor, staff — the staff app
 * - customer — the customer portal
 *
 * TRANSITION (P3-E35 strategy 2): the legacy `admin` claim is treated as `owner` until the
 * migration script has run and the cleanup PR removes it. New grants never write `admin`.
 */
export type Role = 'owner' | 'manager' | 'supervisor' | 'staff' | 'customer'

export const ASSIGNABLE_ROLES: readonly Role[] = ['owner', 'manager', 'supervisor', 'staff', 'customer']
export const OFFICE_ROLES: readonly Role[] = ['owner', 'manager']

/** Maps the legacy `admin` claim to `owner`; anything unknown becomes undefined. */
export function normalizeRole(role: unknown): Role | undefined {
  if (role === 'admin') return 'owner'
  return ASSIGNABLE_ROLES.includes(role as Role) ? (role as Role) : undefined
}

export const isOfficeRole = (role: unknown): boolean => OFFICE_ROLES.includes(normalizeRole(role) as Role)
export const isOwnerRole = (role: unknown): boolean => normalizeRole(role) === 'owner'

/** Higher outranks lower; used by the never-downgrade guard. */
export const ROLE_PRIORITY: Record<Role, number> = { owner: 5, manager: 4, supervisor: 3, staff: 2, customer: 1 }
export const rolePriority = (role: unknown): number => {
  const r = normalizeRole(role)
  return r ? ROLE_PRIORITY[r] : 0
}

/** The office role stored on an `admins/{email}` allowlist doc (legacy docs without a role are owners). */
export function allowlistRole(doc: { role?: unknown } | undefined): Role | undefined {
  if (!doc) return undefined
  const r = normalizeRole(doc.role ?? 'owner')
  return r && isOfficeRole(r) ? r : undefined
}

export interface RoleChange {
  callerUid: string
  callerRole: Role | undefined
  targetUid: string
  existingRole: unknown
  targetRole: unknown
  forceDowngrade: boolean
}

/**
 * Decides whether a role change is allowed. Returns null when allowed, or the HttpsError to throw.
 * Pure — no Firebase access — so every rule is unit-tested.
 */
export function checkRoleChange(change: RoleChange): HttpsError | null {
  const target = normalizeRole(change.targetRole)
  const existing = normalizeRole(change.existingRole)

  if (!isOfficeRole(change.callerRole)) {
    return new HttpsError('permission-denied', 'Only an Owner or Manager can change roles.')
  }
  if (!target || change.targetRole === 'admin') {
    return new HttpsError('invalid-argument', `Valid role is required (${ASSIGNABLE_ROLES.join(', ')}).`)
  }
  if (change.targetUid === change.callerUid) {
    return new HttpsError('failed-precondition', 'You cannot change your own role. Ask another Owner.')
  }
  const touchesOffice = isOfficeRole(target) || isOfficeRole(existing)
  if (touchesOffice && !isOwnerRole(change.callerRole)) {
    return new HttpsError('permission-denied', 'Only an Owner can give or take away the Owner or Manager role.')
  }
  if (!change.forceDowngrade && existing && rolePriority(existing) > rolePriority(target)) {
    return new HttpsError(
      'failed-precondition',
      `Cannot downgrade role from '${existing}' to '${target}' without explicit forceDowngrade flag.`,
    )
  }
  return null
}

interface AuthLike {
  uid: string
  token: { role?: unknown; email?: string }
}
interface AllowlistReader {
  collection: (name: string) => { doc: (id: string) => { get: () => Promise<{ exists: boolean; data: () => unknown }> } }
}

/**
 * The caller's office role from their claim, falling back to the `admins/{email}` allowlist
 * (covers a freshly granted role before the token refreshes).
 */
export async function resolveOfficeRole(auth: AuthLike, db: AllowlistReader): Promise<Role | undefined> {
  const fromClaim = normalizeRole(auth.token.role)
  if (fromClaim && isOfficeRole(fromClaim)) return fromClaim
  const email = auth.token.email?.trim().toLowerCase()
  if (!email) return undefined
  const snap = await db.collection('admins').doc(email).get()
  return snap.exists ? allowlistRole(snap.data() as { role?: unknown }) : undefined
}

/** Throws unless the caller is an Owner or Manager. Returns their role. */
export async function requireOffice(auth: AuthLike | undefined, db: AllowlistReader, action: string): Promise<Role> {
  if (!auth) throw new HttpsError('unauthenticated', 'User must be logged in.')
  const role = await resolveOfficeRole(auth, db)
  if (!role) throw new HttpsError('permission-denied', `Only an Owner or Manager can ${action}.`)
  return role
}
