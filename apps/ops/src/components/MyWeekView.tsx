// My week: what a cleaner sees, and all they see (decisions 0037 and 0038). Their own visits, the days
// they are on call, and their own hours for the pay period. Built for a phone first.
// The office reaches the same page from the Schedule hub, with a list to choose whose week to look at.
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { clockAction, isSignInError } from '../api'
import { setErrorReporter } from '../lib/clientError'
import { type MyDay, type MyVisit, buildMyWeek } from '../lib/myWeek'
import { dayLabel, hours } from '../lib/payroll'
import { groupVisitPhotos, shrinkPhoto } from '../lib/photos'
import { employeesQuery, myWeekChanged, myWeekQuery, visitPhotosQuery } from '../lib/queries'
import { formatTime } from '../lib/schedule'
import { TZ, addDays, todayIn } from '../lib/week'
import Sparkle from './Sparkle'
import Spinner from './Spinner'
import { type PhotosOnPage, PhotosContext } from './photosContext'
import VisitPhotos from './VisitPhotos'
import type { Editor } from './useEditor'

/** The most shift ids the server takes from a cleaner at once (`MAX_LIST_CLEANER` in visit-photos.ts). */
const MAX_PHOTO_SHIFTS = 40

const muted = 'text-ink-muted'
const line = 'border-hairline'
const card = `rounded-xl border bg-surface-raised ${line}`

function warmGps(): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
  )
}

function readGps(): Promise<{ lat: number | null; lon: number | null }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ lat: null, lon: null })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: null, lon: null }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    )
  })
}

function ConnectCamelo({ email, token, onExpired }: { email: string; token: string; onExpired: (message: string) => void }) {
  const [sessionToken, setSessionToken] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const requestCode = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await clockAction<{ sessionToken: string }>({ action: 'requestCode' }, token)
      setSessionToken(r.sessionToken)
      setCode('')
    } catch (e) {
      if (isSignInError(e))
        onExpired(e.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to continue.' : e.message)
      else setErr(e instanceof Error ? e.message : 'Could not ask Camelo for a code.')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async () => {
    if (!code.trim()) return
    setBusy(true)
    setErr('')
    try {
      await clockAction({ action: 'verifyCode', sessionToken, code }, token)
      myWeekChanged()
    } catch (e) {
      if (isSignInError(e))
        onExpired(e.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to continue.' : e.message)
      else setErr(e instanceof Error ? e.message : 'Could not verify the code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Connect Camelo" className={`mt-3 p-4 ${card}`}>
      <h2 className="font-display text-lg font-semibold">Connect your Camelo account</h2>
      <p className={`mt-1 text-sm ${muted}`}>
        Connect once so you can clock in and out from here. Camelo will email a one-time code to {email}.
      </p>
      {!sessionToken ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void requestCode()}
          className="mt-3 min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
        >
          {busy ? 'Sending code…' : 'Email me a code'}
        </button>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void verifyCode()
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-semibold">
            One-time code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
              className="min-h-11 w-40 rounded-lg border border-outline bg-transparent px-3 py-1.5 font-normal tabular-nums"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Connect Camelo'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void requestCode()}
            className="min-h-11 rounded-full border border-hairline bg-surface-sunken/40 px-3.5 text-sm font-semibold hover:border-accent disabled:opacity-50"
          >
            Send a new code
          </button>
        </form>
      )}
      {err && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {err}
        </p>
      )}
    </section>
  )
}

function VisitClock({
  v,
  isToday,
  canClock,
  token,
  onExpired,
}: {
  v: MyVisit
  isToday: boolean
  canClock: boolean
  token: string
  onExpired: (message: string) => void
}) {
  const [busy, setBusy] = useState<'' | 'in' | 'out' | 'photo-in' | 'photo-out'>('')
  const [err, setErr] = useState('')
  const tz = v.timezone || TZ
  const clock = v.clock

  const handleErr = (e: unknown, fallback: string) => {
    if (isSignInError(e))
      onExpired(e.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to continue.' : e.message)
    else setErr(e instanceof Error ? e.message : fallback)
  }

  const punch = async (type: 'in' | 'out', file?: File) => {
    setBusy(type)
    setErr('')
    try {
      const [{ lat, lon }, image] = await Promise.all([readGps(), file ? shrinkPhoto(file) : Promise.resolve(undefined)])
      await clockAction({ action: 'punch', shiftId: v.id, type, lat, lon, ...(image ? { image } : {}) }, token)
      myWeekChanged()
    } catch (e) {
      handleErr(e, type === 'in' ? 'Could not clock in.' : 'Could not clock out.')
    } finally {
      setBusy('')
    }
  }

  const addDoorPhoto = async (type: 'in' | 'out', file: File | undefined) => {
    if (!file) return
    setBusy(type === 'in' ? 'photo-in' : 'photo-out')
    setErr('')
    try {
      const image = await shrinkPhoto(file)
      await clockAction({ action: 'photo', shiftId: v.id, type, image }, token)
      myWeekChanged()
    } catch (e) {
      handleErr(e, 'Could not save the door photo.')
    } finally {
      setBusy('')
    }
  }

  const canPunchIn = canClock && isToday && clock && !clock.inAt && clock.state === 'READY'
  const canPunchOut = canClock && isToday && clock && Boolean(clock.inAt) && !clock.outAt && clock.state !== 'FINISHED'
  const missingInPhoto = Boolean(clock?.inAt && !clock.inPhoto)
  const missingOutPhoto = Boolean(clock?.outAt && !clock.outPhoto)
  const waitingForWindow = canClock && isToday && !clock

  if (!clock?.inAt && !canPunchIn && !waitingForWindow) return null

  return (
    <div className="mt-2.5 grid gap-2 print:hidden" aria-label="Clock in and out">
      {clock?.inAt && (
        <p className="text-sm font-semibold tabular-nums">
          Clocked in {formatTime(clock.inAt, tz)}
          {clock.outAt ? ` – ${formatTime(clock.outAt, tz)}` : ''}
        </p>
      )}
      {waitingForWindow && <p className={`text-sm ${muted}`}>Clock-in opens 4 hours before start</p>}
      {canPunchIn && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            onClick={warmGps}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:opacity-95 ${
              busy ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={Boolean(busy)}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void punch('in', f)
              }}
            />
            {busy === 'in' && <Spinner className="size-4" />}
            {busy === 'in' ? 'Clocking in…' : 'Clock in'}
          </label>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void punch('in')}
            className="min-h-11 rounded-full border border-hairline bg-surface-sunken/40 px-3.5 text-sm font-semibold hover:border-accent disabled:opacity-50"
          >
            Clock in without photo
          </button>
        </div>
      )}
      {canPunchOut && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            onClick={warmGps}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:opacity-95 ${
              busy ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={Boolean(busy)}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void punch('out', f)
              }}
            />
            {busy === 'out' && <Spinner className="size-4" />}
            {busy === 'out' ? 'Clocking out…' : 'Clock out'}
          </label>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void punch('out')}
            className="min-h-11 rounded-full border border-hairline bg-surface-sunken/40 px-3.5 text-sm font-semibold hover:border-accent disabled:opacity-50"
          >
            Clock out without photo
          </button>
        </div>
      )}
      {missingInPhoto && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Clock-in door photo missing</span>
          {canClock && (
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-hairline bg-surface-raised px-4 text-sm font-semibold text-ink hover:border-accent ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={Boolean(busy)}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  void addDoorPhoto('in', f)
                }}
              />
              {busy === 'photo-in' && <Spinner className="size-4" />}
              Add clock-in door photo
            </label>
          )}
        </div>
      )}
      {missingOutPhoto && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Clock-out door photo missing</span>
          {canClock && (
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-hairline bg-surface-raised px-4 text-sm font-semibold text-ink hover:border-accent ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={Boolean(busy)}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  void addDoorPhoto('out', f)
                }}
              />
              {busy === 'photo-out' && <Spinner className="size-4" />}
              Add clock-out door photo
            </label>
          )}
        </div>
      )}
      {err && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {err}
        </p>
      )}
    </div>
  )
}

function Visit({
  v,
  isToday,
  canClock,
  token,
  onExpired,
}: {
  v: MyVisit
  isToday: boolean
  canClock: boolean
  token: string
  onExpired: (message: string) => void
}) {
  const tz = v.timezone || TZ
  const where =
    v.site && v.site !== v.client ? `${v.client ?? ''}${v.client ? ' · ' : ''}${v.site}` : (v.client ?? v.site ?? 'No client on this visit')
  return (
    <li className={`border-t px-4 py-3 first:border-t-0 ${line}`}>
      <p className="font-semibold tabular-nums">
        {formatTime(v.start, tz)}
        {v.end ? ` – ${formatTime(v.end, tz)}` : ''}
      </p>
      <p className="text-[17px] font-semibold text-accent dark:text-accent-dark">{where}</p>
      {v.address && <p className="text-sm">{v.address}</p>}
      <p className={`text-sm ${muted}`}>{v.with.length ? `With ${v.with.join(' and ')}` : 'On your own'}</p>
      {v.note && (
        <p className="mt-1.5 rounded-lg bg-surface-sunken/40 px-2.5 py-1.5 text-sm">
          <span className="font-semibold">Visit note: </span>
          {v.note}
        </p>
      )}
      {v.siteNote && (
        <p className="mt-1.5 rounded-lg bg-surface-sunken/40 px-2.5 py-1.5 text-sm">
          <span className="font-semibold">About this place: </span>
          {v.siteNote}
        </p>
      )}
      <VisitClock v={v} isToday={isToday} canClock={canClock} token={token} onExpired={onExpired} />
      <VisitPhotos visitId={v.id} />
    </li>
  )
}

function Day({
  day,
  today,
  canClock,
  token,
  onExpired,
}: {
  day: MyDay
  today: string
  canClock: boolean
  token: string
  onExpired: (message: string) => void
}) {
  const name = day.date === today ? 'Today' : day.date === addDays(today, 1) ? 'Tomorrow' : dayLabel(day.date)
  return (
    <section aria-label={name} className={`mt-3 overflow-hidden ${card}`}>
      <h2
        className={`flex flex-wrap items-baseline gap-x-2 border-b bg-surface-sunken/40 px-4 py-2 font-display text-lg font-semibold ${line}`}
      >
        {name}
        {name !== dayLabel(day.date) && <span className={`font-sans text-sm font-normal ${muted}`}>{dayLabel(day.date)}</span>}
      </h2>
      {day.onCall && <p className={`border-b px-4 py-2.5 font-semibold ${line} last:border-b-0`}>You are on call</p>}
      {day.visits.length ? (
        <ul>
          {day.visits.map((v) => (
            <Visit key={v.id} v={v} isToday={day.date === today} canClock={canClock} token={token} onExpired={onExpired} />
          ))}
        </ul>
      ) : (
        !day.onCall && <p className={`px-4 py-3 ${muted}`}>No visits</p>
      )}
    </section>
  )
}

export default function MyWeekView({
  editor,
  onExpired,
  onSignOut,
}: {
  editor: Editor
  onExpired: (message: string) => void
  /** Given for a cleaner, whose whole screen this is; the office has its own header and menu. */
  onSignOut?: () => void
}) {
  const office = editor.role === 'office'
  const today = useMemo(() => todayIn(TZ), [])
  const [chosen, setChosen] = useState('')
  const peopleQ = useQuery({ ...employeesQuery(editor.token), enabled: office })
  const weekQ = useQuery({ ...myWeekQuery(editor.token, office ? chosen : undefined), enabled: !office || !!chosen })
  const week = useMemo(() => (weekQ.data ? buildMyWeek(weekQ.data, today) : null), [weekQ.data, today])
  // photos of the home (decision 0044): on today's visits and earlier ones in this pay period, the latest 20, with
  // the photos their partners took on the same visit (owner, 2026-10-22)
  const photoVisits = useMemo(
    () => (week ? [...week.earlier, ...week.ahead.filter((d) => d.date === today)].flatMap((d) => d.visits).slice(-20) : []),
    [week, today],
  )
  const photoShiftIds = useMemo(() => photoVisits.flatMap((v) => [v.id, ...v.partnerShiftIds]).slice(-MAX_PHOTO_SHIFTS), [photoVisits])
  const photosQ = useQuery({ ...visitPhotosQuery(photoShiftIds, editor.token), enabled: photoShiftIds.length > 0 })
  const refetchPhotos = photosQ.refetch
  const photos = useMemo((): PhotosOnPage => {
    const shared = groupVisitPhotos(
      photoVisits.map((v) => ({ id: v.id, shiftPartners: v.partnerShiftIds.map((id) => ({ id })) })),
      photosQ.data ?? [],
    )
    // a visit cut off by the server's limit gets no photos, as the older visits beyond the latest 20
    const byVisit = new Map(photoVisits.filter((v) => photoShiftIds.includes(v.id)).map((v) => [v.id, shared.get(v.id) ?? []]))
    return {
      token: editor.token,
      byVisit,
      loading: photosQ.isLoading,
      onExpired,
      // any refusal but a sign-in that ran out is said on the page, a partner's shift just moved to someone else included
      failed: photosQ.isError && !(isSignInError(photosQ.error) && photosQ.error.reason === 'not_signed_in'),
      retry: () => void refetchPhotos(),
    }
  }, [photoVisits, photoShiftIds, photosQ.data, photosQ.isLoading, photosQ.isError, photosQ.error, refetchPhotos, editor.token, onExpired])

  const failure = weekQ.error ?? peopleQ.error
  useEffect(() => {
    if (isSignInError(failure))
      onExpired(failure.reason === 'not_signed_in' ? 'Your Google sign-in has expired. Sign in again to continue.' : failure.message)
  }, [failure, onExpired])
  // a fault on a cleaner's page is reported like any other; the office's reports set this themselves
  useEffect(() => {
    if (office) return
    document.title = 'My week · FNC Landing'
    setErrorReporter(editor.token, 'myweek')
  }, [office, editor.token])

  const body = (
    <PhotosContext.Provider value={photos}>
      {office && (
        <div className={`mb-4 p-4 ${card}`}>
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-semibold">
            Whose week
            <select
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-outline bg-transparent px-2.5 py-1.5 font-normal"
            >
              <option value="">Choose someone…</option>
              {(peopleQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className={`mt-2 text-sm ${muted}`}>
            This is what that person sees when they sign in, and all they see: their own visits and hours. Shifts not yet released in Camelo
            are left out.
          </p>
        </div>
      )}
      {failure && !isSignInError(failure) && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {failure instanceof Error ? failure.message : 'Your week could not be loaded.'}{' '}
          <button className="font-semibold underline" onClick={() => void weekQ.refetch()}>
            Try again
          </button>
        </p>
      )}
      {weekQ.isLoading && (
        <div role="status" className={`flex flex-col items-center gap-4 py-16 ${muted}`}>
          <Spinner className="size-10 text-accent dark:text-accent-dark" />
          <p>Loading your week…</p>
        </div>
      )}
      {week && weekQ.data && (
        <>
          {!office && !weekQ.data.cameloConnected && <ConnectCamelo email={editor.email} token={editor.token} onExpired={onExpired} />}
          {week.ahead.map((d) => (
            <Day
              key={d.date}
              day={d}
              today={today}
              canClock={!office && Boolean(weekQ.data.cameloConnected)}
              token={editor.token}
              onExpired={onExpired}
            />
          ))}

          <section aria-label="Hours this pay period" className={`mt-6 overflow-hidden ${card}`}>
            <h2 className={`border-b bg-surface-sunken/40 px-4 py-2 font-display text-lg font-semibold ${line}`}>
              Hours this pay period
              <span className={`ml-2 font-sans text-sm font-normal ${muted}`}>
                {dayLabel(weekQ.data.periodStart)} – {dayLabel(addDays(weekQ.data.periodStart, 6))}
              </span>
            </h2>
            <table className="w-full text-left tabular-nums">
              <thead className={`text-sm ${muted}`}>
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Day
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Approved
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Waiting
                  </th>
                </tr>
              </thead>
              <tbody>
                {week.hours.days
                  .filter((d) => d.approved || d.waiting)
                  .map((d) => (
                    <tr key={d.date} className={`border-t ${line}`}>
                      <th scope="row" className="px-4 py-2 font-normal">
                        {dayLabel(d.date)}
                      </th>
                      <td className="px-4 py-2 text-right">{d.approved ? hours(d.approved) : '–'}</td>
                      <td className="px-4 py-2 text-right">{d.waiting ? hours(d.waiting) : '–'}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className={`border-t font-semibold ${line}`}>
                  <th scope="row" className="px-4 py-2">
                    Total
                  </th>
                  <td className="px-4 py-2 text-right">{hours(week.hours.approved)}</td>
                  <td className="px-4 py-2 text-right">{week.hours.waiting ? hours(week.hours.waiting) : '–'}</td>
                </tr>
              </tfoot>
            </table>
            <p className={`border-t px-4 py-2.5 text-sm ${muted} ${line}`}>
              Hours are from your clock-ins, each day rounded to the nearest quarter hour. Waiting means logged and not yet approved by the
              office. If a clock-in is missing or wrong, tell the office.
            </p>
          </section>

          {week.earlier.length > 0 && (
            <details className="mt-6">
              <summary className={`cursor-pointer px-1 font-semibold ${muted}`}>Earlier this pay period</summary>
              {week.earlier.map((d) => (
                <Day
                  key={d.date}
                  day={d}
                  today={today}
                  canClock={!office && Boolean(weekQ.data.cameloConnected)}
                  token={editor.token}
                  onExpired={onExpired}
                />
              ))}
            </details>
          )}
        </>
      )}
    </PhotosContext.Provider>
  )

  if (office) return body
  return (
    <>
      <header className={`border-b bg-surface pt-[env(safe-area-inset-top)] ${line}`}>
        <div className="mx-auto flex max-w-xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <img src="/pwa-icon-192.png" alt="" width="40" height="40" className="size-10 flex-none" />
          <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-accent">
            FNC Landing <Sparkle size={16} className="text-clay" />
          </span>
          <button
            className="ml-auto min-h-11 rounded-full border border-hairline bg-surface-raised px-4 text-sm font-semibold hover:border-accent"
            onClick={onSignOut}
          >
            Sign out
          </button>
          <h1 className="w-full font-display text-2xl font-semibold">My week</h1>
          <p className={`w-full text-sm ${muted}`}>{weekQ.data?.name ?? editor.name ?? editor.email}</p>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-12">{body}</main>
    </>
  )
}
