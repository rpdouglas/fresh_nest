import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect, useState } from 'react'
import { isSignInError, visitPhotosAction } from '../api'
import { photosForVisit, shrinkPhoto } from '../lib/photos'
import { visitPhotoQuery, visitPhotosChanged } from '../lib/queries'
import { TZ } from '../lib/week'
import type { VisitPhoto } from '../types'
import { type PhotosOnPage, PhotosContext } from './photosContext'
import Spinner from './Spinner'

const EXPIRED = 'Your Google sign-in has expired. Sign in again to continue.'

/** Only a sign-in that has run out sends someone back to sign in; any other refusal is said beside the photo. */
const signInExpired = (e: unknown) => isSignInError(e) && e.reason === 'not_signed_in'

function Thumb({ photo, ctx, onOpen }: { photo: VisitPhoto; ctx: PhotosOnPage; onOpen: (photo: VisitPhoto, src: string) => void }) {
  const q = useQuery(visitPhotoQuery(photo.id, ctx.token))
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState('')
  const label = photo.kind === 'before' ? 'Before' : 'After'
  const remove = async () => {
    setBusy(true)
    setFailed('')
    try {
      await visitPhotosAction({ action: 'delete', id: photo.id }, ctx.token)
      visitPhotosChanged()
    } catch (e) {
      if (signInExpired(e)) ctx.onExpired(EXPIRED)
      setFailed(e instanceof Error && e.message ? e.message : 'Not deleted, try again.')
      setConfirm(false)
    } finally {
      setBusy(false)
    }
  }
  return (
    <figure className="flex w-24 flex-col gap-1">
      <div className="flex aspect-square w-24 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-surface-sunken">
        {q.data ? (
          <button
            type="button"
            onClick={() => onOpen(photo, q.data)}
            className="size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <img src={q.data} alt={`${label} photo`} className="size-full object-cover" />
          </button>
        ) : q.isError ? (
          <button type="button" onClick={() => void q.refetch()} className="px-1 text-xs font-semibold text-accent">
            Not loaded, try again
          </button>
        ) : (
          <Spinner className="size-5 text-ink-muted" />
        )}
      </div>
      <figcaption className="flex items-center justify-between text-xs font-semibold text-ink-muted">
        {label}
        {photo.canDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={() => (confirm ? void remove() : setConfirm(true))}
            className={`min-h-8 px-1 font-semibold ${confirm ? 'text-red-700 dark:text-red-400' : 'text-accent'} disabled:opacity-50`}
          >
            {confirm ? 'Sure?' : 'Delete'}
          </button>
        )}
      </figcaption>
      {failed && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {failed}
        </p>
      )}
    </figure>
  )
}

function Lightbox({ photo, src, onClose }: { photo: VisitPhoto; src: string; onClose: () => void }) {
  const label = photo.kind === 'before' ? 'Before' : 'After'
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const when = new Date(photo.takenAt).toLocaleString('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} photo`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 print:hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] max-w-3xl flex-col gap-3 rounded-2xl border border-hairline bg-surface-raised p-4 shadow-soft"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-ink">{label} photo</span>
            <span className="ml-2 text-ink-muted">· {when}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 rounded-full border border-hairline bg-surface px-3.5 text-sm font-semibold text-ink hover:border-accent"
          >
            Close
          </button>
        </div>
        <img src={src} alt={`${label} photo, full size`} className="max-h-[75vh] w-auto rounded-lg object-contain" />
      </div>
    </div>
  )
}

function AddButton({ visitId, kind, ctx }: { visitId: string; kind: 'before' | 'after'; ctx: PhotosOnPage }) {
  const [state, setState] = useState<'idle' | 'busy' | 'failed'>('idle')
  const add = async (file: File | undefined) => {
    if (!file) return
    setState('busy')
    try {
      const image = await shrinkPhoto(file)
      await visitPhotosAction({ action: 'add', shiftId: visitId, kind, image }, ctx.token)
      visitPhotosChanged()
      setState('idle')
    } catch (e) {
      if (signInExpired(e)) ctx.onExpired(EXPIRED)
      setState('failed')
    }
  }
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-hairline bg-surface-raised px-4 text-sm font-semibold text-ink hover:border-accent ${
        state === 'busy' ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {/* opens the camera on a phone (the back one), or a file chooser on a laptop */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={state === 'busy'}
        onChange={(e) => {
          void add(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {state === 'busy' && <Spinner className="size-4" />}
      {kind === 'before' ? 'Before photo' : 'After photo'}
      {state === 'failed' && <span className="text-xs font-normal text-red-700 dark:text-red-400">· not saved, try again</span>}
    </label>
  )
}

/** A visit's photos of the home, before and after (decision 0044); on My week and on the office's reports. */
export default function VisitPhotos({ visitId }: { visitId: string }) {
  const ctx = useContext(PhotosContext)
  const [open, setOpen] = useState<{ photo: VisitPhoto; src: string } | null>(null)
  if (!ctx) return null
  const canAdd = ctx.canAdd ?? true
  if (canAdd && !ctx.byVisit.has(visitId)) return null
  const photos = photosForVisit(ctx.byVisit, visitId)
  if (!canAdd && photos.length === 0) return null
  return (
    <div className="mt-2.5 grid gap-2 print:hidden" aria-label="Photos of the home">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <Thumb key={p.id} photo={p} ctx={ctx} onOpen={(photo, src) => setOpen({ photo, src })} />
          ))}
        </div>
      )}
      {canAdd && ctx.failed && (
        <p role="alert" className="flex flex-wrap items-center gap-x-2 text-sm text-red-700 dark:text-red-400">
          The photos could not be loaded.
          <button type="button" onClick={ctx.retry} className="min-h-8 font-semibold text-accent">
            Try again
          </button>
        </p>
      )}
      {canAdd && (
        <div className="flex flex-wrap gap-2">
          <AddButton visitId={visitId} kind="before" ctx={ctx} />
          <AddButton visitId={visitId} kind="after" ctx={ctx} />
        </div>
      )}
      {open && <Lightbox photo={open.photo} src={open.src} onClose={() => setOpen(null)} />}
    </div>
  )
}
