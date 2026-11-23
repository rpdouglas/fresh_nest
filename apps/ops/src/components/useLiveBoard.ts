import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchLive, isSignInError, saveLiveHandled } from '../api'
import { type LiveBoard, buildLiveBoard } from '../lib/live'
import { liveHandledChanged, liveHandledQuery, placesQuery } from '../lib/queries'
import { TZ, todayIn } from '../lib/week'
import type { Editor } from './useEditor'

const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

/**
 * Today's live board: loaded, kept up to date and marked handled the same way on the Live board and on the Dashboard
 * (decision 0043), so the two always agree. The rules are in lib/live.ts.
 */
export function useLiveBoard({
  editor,
  onExpired,
  graceMinutes = 15,
}: {
  editor: Editor
  onExpired: (message: string) => void
  graceMinutes?: number
}) {
  const token = editor.token
  const [now, setNow] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [localOverrides, setLocalOverrides] = useState<Map<string, boolean>>(() => new Map())

  // Keep `now` updated every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  // Live query auto-refreshes every 3 minutes while tab is visible
  const liveQ = useQuery({
    queryKey: ['live'],
    queryFn: ({ signal }) => fetchLive(token, false, signal),
    refetchInterval: 180_000,
    refetchIntervalInBackground: false,
  })

  const liveData = liveQ.data ?? null
  const error = liveQ.error

  const today = liveData?.today ?? todayIn(TZ, new Date(now))

  // Persisted handled red visits from Firestore (scheduleLiveHandled)
  const handledQ = useQuery(liveHandledQuery(today, token))

  useEffect(() => {
    if (!isSignInError(error) && !isSignInError(handledQ.error)) return
    onExpired(EXPIRED)
  }, [error, handledQ.error, onExpired])

  const handledShiftIds = useMemo(() => {
    const combined = new Set(handledQ.data ?? [])
    for (const [id, handled] of localOverrides) {
      if (handled) combined.add(id)
      else combined.delete(id)
    }
    return combined
  }, [handledQ.data, localOverrides])

  // Extract job-site addresses for places / drive-time calculation
  const addresses = useMemo(() => {
    if (!liveData?.shifts) return []
    const set = new Set<string>()
    for (const s of liveData.shifts) {
      const addr = s.jobSite?.address?.trim()
      if (addr) set.add(addr)
    }
    return [...set].sort()
  }, [liveData?.shifts])

  const placesQ = useQuery({ ...placesQuery(addresses, token), enabled: addresses.length > 0 })
  const placesMap = useMemo(() => new Map(Object.entries(placesQ.data?.places ?? {})), [placesQ.data])

  // Manual refresh bypasses the 60s memory cache
  const refresh = useCallback(() => {
    setRefreshing(true)
    fetchLive(token, true)
      .then(() => {
        liveHandledChanged(today)
        liveQ.refetch()
        handledQ.refetch()
        setNow(Date.now())
      })
      .catch((err) => {
        if (isSignInError(err)) onExpired(EXPIRED)
      })
      .finally(() => setRefreshing(false))
  }, [token, today, liveQ, handledQ, onExpired])

  const toggleHandled = useCallback(
    (shiftId: string) => {
      const nextHandled = !handledShiftIds.has(shiftId)

      // Optimistic update
      setLocalOverrides((prev) => new Map(prev).set(shiftId, nextHandled))

      saveLiveHandled(shiftId, today, nextHandled, token)
        .then(() => {
          liveHandledChanged(today)
          setLocalOverrides((prev) => {
            const next = new Map(prev)
            next.delete(shiftId)
            return next
          })
        })
        .catch((err) => {
          setLocalOverrides((prev) => {
            const next = new Map(prev)
            next.delete(shiftId)
            return next
          })
          if (isSignInError(err)) onExpired(EXPIRED)
        })
    },
    [handledShiftIds, today, token, onExpired],
  )

  const board: LiveBoard | null = useMemo(() => {
    if (!liveData) return null
    return buildLiveBoard({
      shifts: liveData.shifts,
      timesheets: liveData.timesheets,
      now,
      graceMinutes,
      places: placesMap,
      handledShiftIds,
      today: liveData.today,
    })
  }, [liveData, now, graceMinutes, placesMap, handledShiftIds])

  return { board, liveData, loading: liveQ.isLoading, error, now, today, refreshing, refresh, toggleHandled, handledShiftIds }
}
