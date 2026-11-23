import { useEffect, useMemo, useState } from 'react'
import { limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import {
  bookingsCollection,
  inferPipelineStageFromBooking,
  isOpenPipelineStage,
  isRecurringRenewalBooking,
  sortLeadsByPriority,
  type Booking,
  type PipelineStage,
  type PolicySettingsValues,
} from '@freshnest/shared'
import { db } from '@/lib/firebase/firebase'

export type PipelineOwnerFilter = 'my' | 'unassigned' | 'all'

export function usePipeline(
  isAuthorized: boolean,
  currentEmail: string,
  policy: PolicySettingsValues,
) {
  const [rawBookings, setRawBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ownerFilter, setOwnerFilter] = useState<PipelineOwnerFilter>('my')
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'open' | 'all'>('open')
  const [airbnbOnly, setAirbnbOnly] = useState(false)
  const [siteVisitOnly, setSiteVisitOnly] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAuthorized) return
    const q = query(bookingsCollection(db), orderBy('createdAt', 'desc'), limit(300))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => d.data())
          .filter((b) => !isRecurringRenewalBooking(b))
        setRawBookings(docs)
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error('Failed to subscribe to pipeline bookings:', err)
        setError(err.message)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [isAuthorized])

  const me = currentEmail.trim().toLowerCase()

  const counts = useMemo(() => {
    let myOpen = 0
    let unassignedOpen = 0
    let allOpen = 0
    for (const b of rawBookings) {
      const stage = inferPipelineStageFromBooking(b)
      if (!isOpenPipelineStage(stage)) continue
      allOpen++
      const owner = b.pipeline?.ownerEmail?.trim().toLowerCase() || null
      if (!owner) unassignedOpen++
      else if (owner === me) myOpen++
    }
    return { myOpen, unassignedOpen, allOpen }
  }, [rawBookings, me])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matches = rawBookings.filter((b) => {
      const stage = inferPipelineStageFromBooking(b)
      const owner = b.pipeline?.ownerEmail?.trim().toLowerCase() || null

      if (ownerFilter === 'my' && owner !== me) return false
      if (ownerFilter === 'unassigned' && owner !== null) return false

      if (stageFilter === 'open' && !isOpenPipelineStage(stage)) return false
      if (stageFilter !== 'open' && stageFilter !== 'all' && stage !== stageFilter) return false

      if (airbnbOnly && !b.isAirbnb && b.serviceType !== 'airbnb') return false
      if (siteVisitOnly && !b.pipeline?.needsSiteVisit) return false

      if (q) {
        const hay = `${b.firstName} ${b.lastName} ${b.email} ${b.phone} ${b.address}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    return sortLeadsByPriority(matches, {
      firstContactTargetMinutes: policy.leadFirstContactTargetMinutes,
      siteVisitTargetMinutes: policy.leadSiteVisitFirstContactTargetMinutes,
    })
  }, [rawBookings, ownerFilter, stageFilter, airbnbOnly, siteVisitOnly, search, me, policy])

  return {
    leads: filteredLeads,
    allLeads: rawBookings,
    counts,
    loading,
    error,
    ownerFilter,
    setOwnerFilter,
    stageFilter,
    setStageFilter,
    airbnbOnly,
    setAirbnbOnly,
    siteVisitOnly,
    setSiteVisitOnly,
    search,
    setSearch,
  }
}
