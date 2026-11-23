import { useCallback, useEffect, useState } from 'react'
import type { StaffLeadSummary } from '@freshnest/shared'
import { listMyLeads } from '../lib/firebase/leads'
import { useStaffAuth } from './useStaffAuth'

export function useMyLeads() {
  const { staffProfile } = useStaffAuth()
  const enabled = Boolean(staffProfile)

  const [leads, setLeads] = useState<StaffLeadSummary[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await listMyLeads()
      setLeads(res.leads)
      setOpenCount(res.openCount)
    } catch {
      setError('load_error')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let active = true
    void listMyLeads()
      .then((res) => {
        if (!active) return
        setLeads(res.leads)
        setOpenCount(res.openCount)
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('load_error')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enabled])

  return { leads, openCount, loading, error, reload }
}
