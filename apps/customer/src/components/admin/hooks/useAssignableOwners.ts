import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {
  allowlistOfficeRole,
  staffCollection,
  type LeadOwnerRole,
} from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'

export interface AssignableLeadOwner {
  email: string
  displayName: string
  role: LeadOwnerRole
  phone: string
  language: 'en' | 'fr'
}

const ROLE_ORDER: Record<LeadOwnerRole, number> = {
  owner: 0,
  manager: 1,
  supervisor: 2,
  lead: 3,
  cleaner: 4,
  contractor: 5,
}

/**
 * P3-E40: Loads all people eligible to own a lead:
 * `admins` (owner, manager) + active `staff` (cleaner, lead, supervisor, contractor).
 */
export function useAssignableOwners(isAuthorized: boolean) {
  const [owners, setOwners] = useState<AssignableLeadOwner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthorized) return
    let active = true

    const load = async () => {
      try {
        const [adminsSnap, staffSnap] = await Promise.all([
          getDocs(collection(db, 'admins')),
          getDocs(staffCollection(db)),
        ])
        if (!active) return

        const byEmail = new Map<string, AssignableLeadOwner>()

        for (const d of adminsSnap.docs) {
          if (!d.id.includes('@')) continue
          const data = d.data() as { role?: unknown; phone?: unknown; language?: unknown }
          const officeRole = allowlistOfficeRole(data.role)
          if (!officeRole) continue
          const email = d.id.trim().toLowerCase()
          byEmail.set(email, {
            email,
            displayName: email,
            role: officeRole,
            phone: typeof data.phone === 'string' ? data.phone : '',
            language: data.language === 'fr' ? 'fr' : 'en',
          })
        }

        for (const d of staffSnap.docs) {
          const s = d.data()
          if (s.status !== 'active') continue
          const email = s.email.trim().toLowerCase()
          if (!email) continue
          const fullName = `${s.firstName} ${s.lastName}`.trim() || email
          const existing = byEmail.get(email)
          if (existing) {
            // Enrich office user's display name if they also have a staff profile
            existing.displayName = fullName
            if (!existing.phone && s.phone) existing.phone = s.phone
          } else {
            byEmail.set(email, {
              email,
              displayName: fullName,
              role: s.role,
              phone: s.phone ?? '',
              language: s.preferences?.language === 'fr' ? 'fr' : 'en',
            })
          }
        }

        const list = Array.from(byEmail.values()).sort((a, b) => {
          const r = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
          return r !== 0 ? r : a.displayName.localeCompare(b.displayName)
        })
        setOwners(list)
      } catch (err) {
        console.error('Failed to load assignable lead owners:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [isAuthorized])

  return { owners, loading }
}
