import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FALLBACK_CORNWALL_COORDS,
  buildDefaultClientComment,
  type Booking,
  type CameloGeoSource,
  type PrepareLeadForCameloResult,
  type PushLeadToCameloResult,
} from '@freshnest/shared'
import { prepareLeadForCamelo, pushLeadToCamelo } from '@/lib/firebase/camelo'
import { cn } from '@/lib/utils/utils'

interface CameloSyncModalProps {
  lead: Booking
  onClose: () => void
  onSynced: (result: PushLeadToCameloResult) => void
}

const INPUT_CLASS =
  'w-full min-h-[48px] px-3 py-2 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

const TEXTAREA_CLASS =
  'w-full min-h-[112px] px-3 py-2.5 bg-white border border-sand rounded font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand'

export function CameloSyncModal({ lead, onClose, onSynced }: CameloSyncModalProps) {
  const { t } = useTranslation()
  const bookingId = lead.id ?? ''

  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dryRunBanner, setDryRunBanner] = useState<string | null>(null)
  const [prepared, setPrepared] = useState<PrepareLeadForCameloResult | null>(null)

  const [clientMode, setClientMode] = useState<'new' | 'existing'>('new')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [extraClients, setExtraClients] = useState<Array<{ id: string; name: string; email?: string | null }>>([])

  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [clientNumber, setClientNumber] = useState('')

  const [jobSiteName, setJobSiteName] = useState('')
  const [jobSiteAddress, setJobSiteAddress] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const [geoLat, setGeoLat] = useState('')
  const [geoLong, setGeoLong] = useState('')
  const [geoSource, setGeoSource] = useState<CameloGeoSource | null>(null)

  const [jobSiteNote, setJobSiteNote] = useState('')
  const [clientComment, setClientComment] = useState('')
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])

  useEffect(() => {
    let active = true
    if (!bookingId) return
    prepareLeadForCamelo({ bookingId })
      .then((res) => {
        if (!active) return
        setPrepared(res)
        if (res.matches.length > 0) {
          setClientMode('existing')
          setSelectedClientId(res.matches[0].client.id)
        } else {
          setClientMode('new')
          setSelectedClientId(res.clients[0]?.id ?? '')
        }
        setClientName(res.defaults.clientName)
        setEmail(res.defaults.email)
        setPhoneNumber(res.defaults.phoneNumber)
        setBillingAddress(res.defaults.billingAddress)
        setJobSiteName(res.defaults.jobSiteName)
        setJobSiteAddress(res.defaults.jobSiteAddress)
        setScheduleId(res.defaultScheduleId ?? '')
        if (res.geocode.found && res.geocode.lat !== null && res.geocode.lon !== null) {
          setGeoLat(String(res.geocode.lat))
          setGeoLong(String(res.geocode.lon))
          setGeoSource('nominatim')
        } else {
          setGeoLat('')
          setGeoLong('')
          setGeoSource(null)
        }
        setJobSiteNote(res.defaults.jobSiteNote)
        setClientComment(res.defaults.clientComment)
        setSelectedNoteIds(new Set(res.leadNotes.map((n) => n.id)))
      })
      .catch((err: unknown) => {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : t('admin.pipeline.camelo.loadError'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [bookingId, t])

  const allSelectableClients = useMemo(() => {
    const base = prepared?.clients ?? []
    const seen = new Set(base.map((c) => c.id))
    return [...extraClients.filter((c) => !seen.has(c.id)), ...base]
  }, [prepared, extraClients])

  const rebuildClientComment = (nextSelectedIds: Set<string>) => {
    if (!prepared) return
    const picked = prepared.leadNotes.filter((n) => nextSelectedIds.has(n.id))
    const rebuilt = buildDefaultClientComment(
      {
        serviceType: lead.serviceType,
        frequency: lead.frequency,
        preferredDate: lead.preferredDate,
        language: lead.language,
        leadSource: lead.leadSource,
        quotedPriceCents: lead.pipeline?.quotedPriceCents ?? null,
      },
      picked,
    )
    setClientComment(rebuilt)
  }

  const handleToggleLeadNote = (noteId: string) => {
    const next = new Set(selectedNoteIds)
    if (next.has(noteId)) next.delete(noteId)
    else next.add(noteId)
    setSelectedNoteIds(next)
    rebuildClientComment(next)
  }

  const handleRegeocode = async () => {
    const trimmed = jobSiteAddress.trim()
    if (trimmed.length < 5) return
    setGeocoding(true)
    setSubmitError(null)
    try {
      const res = await prepareLeadForCamelo({ bookingId, addressOverride: trimmed })
      if (res.geocode.found && res.geocode.lat !== null && res.geocode.lon !== null) {
        setGeoLat(String(res.geocode.lat))
        setGeoLong(String(res.geocode.lon))
        setGeoSource('nominatim')
      } else {
        setGeoSource(null)
        setSubmitError(t('admin.pipeline.camelo.geocodeMiss'))
      }
    } catch {
      setSubmitError(t('admin.pipeline.camelo.geocodeMiss'))
    } finally {
      setGeocoding(false)
    }
  }

  const handleUseFallbackPin = () => {
    setGeoLat(String(FALLBACK_CORNWALL_COORDS.lat))
    setGeoLong(String(FALLBACK_CORNWALL_COORDS.lon))
    setGeoSource('fallback')
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setDryRunBanner(null)

    const lat = Number(geoLat)
    const lon = Number(geoLong)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setSubmitError(t('admin.pipeline.camelo.coordsRequired'))
      return
    }
    if (!scheduleId) {
      setSubmitError(t('admin.pipeline.camelo.scheduleRequired'))
      return
    }
    if (clientMode === 'existing' && !selectedClientId) {
      setSubmitError(t('admin.pipeline.camelo.selectClientRequired'))
      return
    }

    const chosenExisting =
      clientMode === 'existing'
        ? allSelectableClients.find((c) => c.id === selectedClientId)
        : null

    setSubmitting(true)
    try {
      const result = await pushLeadToCamelo({
        bookingId,
        existingClientId: clientMode === 'existing' ? selectedClientId : null,
        clientName: (chosenExisting?.name || clientName).trim(),
        email: clientMode === 'new' ? email.trim() || null : null,
        phoneNumber: clientMode === 'new' ? phoneNumber.trim() || null : null,
        billingAddress: clientMode === 'new' ? billingAddress.trim() || null : null,
        clientNumber: clientMode === 'new' ? clientNumber.trim() || null : null,
        jobSiteName: jobSiteName.trim(),
        jobSiteAddress: jobSiteAddress.trim(),
        jobSiteNote: jobSiteNote.trim() || null,
        scheduleId,
        geoLat: lat,
        geoLong: lon,
        geoSource: geoSource ?? 'manual',
        clientComment: clientComment.trim() || null,
      })

      if (result.dryRun) {
        setDryRunBanner(t('admin.pipeline.camelo.dryRunSuccess'))
        return
      }
      onSynced(result)
    } catch (err: unknown) {
      const details =
        err && typeof err === 'object' && 'details' in err
          ? (err as { details?: { partialClientId?: string; partialClientName?: string } }).details
          : undefined

      if (details?.partialClientId) {
        const partialId = details.partialClientId
        const partialName = details.partialClientName || clientName.trim()
        setExtraClients((prev) => [{ id: partialId, name: partialName }, ...prev])
        setClientMode('existing')
        setSelectedClientId(partialId)
        setSubmitError(
          t('admin.pipeline.camelo.partialClientError', {
            name: partialName,
            message: err instanceof Error ? err.message : '',
          }),
        )
      } else {
        setSubmitError(err instanceof Error ? err.message : t('admin.pipeline.camelo.pushError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camelo-sync-modal-title"
      className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-warm-white border border-sand rounded shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-sand">
          <div>
            <h3 id="camelo-sync-modal-title" className="font-display text-3xl text-charcoal">
              {t('admin.pipeline.camelo.modalTitle')}
            </h3>
            <p className="font-body text-base text-text-muted">
              {t('admin.pipeline.camelo.modalSubtitle', { name: `${lead.firstName} ${lead.lastName}`.trim() })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[48px] px-4 border border-sand rounded font-body text-base font-medium text-charcoal hover:bg-cream"
          >
            {t('admin.pipeline.detail.close')}
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {loading && (
            <p role="status" className="font-body text-base text-text-muted">
              {t('admin.pipeline.camelo.loading')}
            </p>
          )}

          {loadError && (
            <p role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded p-4 font-body text-base">
              {loadError}
            </p>
          )}

          {!loading && prepared && (
            <form id="camelo-sync-form" onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
              {prepared.isDevDryRun && (
                <div role="status" className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-4 font-body text-base">
                  {t('admin.pipeline.camelo.devDryRunNotice')}
                </div>
              )}

              {dryRunBanner && (
                <p role="status" className="bg-slate-pale border border-slate-brand text-charcoal rounded p-4 font-body text-base">
                  {dryRunBanner}
                </p>
              )}

              {submitError && (
                <p role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded p-4 font-body text-base">
                  {submitError}
                </p>
              )}

              {/* Section 1: Client (existing match or create new) */}
              <section className="bg-white border border-sand rounded p-5 space-y-4">
                <h4 className="font-sub text-xl text-charcoal">{t('admin.pipeline.camelo.clientSection')}</h4>

                {prepared.matches.length > 0 && (
                  <div className="bg-slate-pale border border-slate-brand rounded p-4 space-y-2">
                    <p className="font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.matchesFound', { count: prepared.matches.length })}
                    </p>
                    <ul className="space-y-1 font-body text-base text-charcoal">
                      {prepared.matches.slice(0, 3).map((m) => (
                        <li key={m.client.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>{m.client.name}</strong>
                            {m.client.email ? ` · ${m.client.email}` : ''}
                            {m.client.phoneNumber ? ` · ${m.client.phoneNumber}` : ''}
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-sand rounded font-body text-sm text-slate-dark">
                            {t('admin.pipeline.camelo.matchedBy', {
                              reasons: m.reasons
                                .map((r) => t(`admin.pipeline.camelo.matchReasons.${r}`, { defaultValue: r }))
                                .join(', '),
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={cn(
                      'flex items-center gap-3 min-h-[48px] px-4 py-2 rounded border cursor-pointer font-body text-base',
                      clientMode === 'new' ? 'bg-slate-pale border-slate-brand text-charcoal font-medium' : 'bg-cream border-sand text-charcoal',
                    )}
                  >
                    <input
                      type="radio"
                      name="camelo-client-mode"
                      checked={clientMode === 'new'}
                      onChange={() => setClientMode('new')}
                      className="h-5 w-5"
                    />
                    <span>{t('admin.pipeline.camelo.createNewClient')}</span>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-3 min-h-[48px] px-4 py-2 rounded border cursor-pointer font-body text-base',
                      clientMode === 'existing' ? 'bg-slate-pale border-slate-brand text-charcoal font-medium' : 'bg-cream border-sand text-charcoal',
                      allSelectableClients.length === 0 && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <input
                      type="radio"
                      name="camelo-client-mode"
                      checked={clientMode === 'existing'}
                      disabled={allSelectableClients.length === 0}
                      onChange={() => setClientMode('existing')}
                      className="h-5 w-5"
                    />
                    <span>{t('admin.pipeline.camelo.linkExistingClient')}</span>
                  </label>
                </div>

                {clientMode === 'existing' ? (
                  <div className="space-y-1">
                    <label htmlFor="camelo-existing-client" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.existingClientLabel')}
                    </label>
                    <select
                      id="camelo-existing-client"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">{t('admin.pipeline.camelo.selectClientPlaceholder')}</option>
                      {allSelectableClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {typeof c.email === 'string' && c.email ? ` (${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="camelo-client-name" className="block font-body text-base font-medium text-charcoal">
                        {t('admin.pipeline.camelo.clientNameLabel')} *
                      </label>
                      <input
                        id="camelo-client-name"
                        type="text"
                        required
                        aria-required="true"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="camelo-client-email" className="block font-body text-base font-medium text-charcoal">
                        {t('admin.pipeline.camelo.clientEmailLabel')}
                      </label>
                      <input
                        id="camelo-client-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="camelo-client-phone" className="block font-body text-base font-medium text-charcoal">
                        {t('admin.pipeline.camelo.clientPhoneLabel')}
                      </label>
                      <input
                        id="camelo-client-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="camelo-client-number" className="block font-body text-base font-medium text-charcoal">
                        {t('admin.pipeline.camelo.clientNumberLabel')}
                      </label>
                      <input
                        id="camelo-client-number"
                        type="text"
                        value={clientNumber}
                        onChange={(e) => setClientNumber(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label htmlFor="camelo-billing-address" className="block font-body text-base font-medium text-charcoal">
                        {t('admin.pipeline.camelo.billingAddressLabel')}
                      </label>
                      <input
                        id="camelo-billing-address"
                        type="text"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Section 2: Job Site & Geocoding */}
              <section className="bg-white border border-sand rounded p-5 space-y-4">
                <h4 className="font-sub text-xl text-charcoal">{t('admin.pipeline.camelo.jobSiteSection')}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="camelo-site-name" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.jobSiteNameLabel')} *
                    </label>
                    <input
                      id="camelo-site-name"
                      type="text"
                      required
                      aria-required="true"
                      value={jobSiteName}
                      onChange={(e) => setJobSiteName(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="camelo-schedule-select" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.scheduleLabel')} *
                    </label>
                    <select
                      id="camelo-schedule-select"
                      required
                      aria-required="true"
                      value={scheduleId}
                      onChange={(e) => setScheduleId(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">{t('admin.pipeline.camelo.selectSchedulePlaceholder')}</option>
                      {prepared.schedules.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label htmlFor="camelo-site-address" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.jobSiteAddressLabel')} *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="camelo-site-address"
                        type="text"
                        required
                        aria-required="true"
                        value={jobSiteAddress}
                        onChange={(e) => setJobSiteAddress(e.target.value)}
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => { void handleRegeocode() }}
                        disabled={geocoding || jobSiteAddress.trim().length < 5}
                        className="min-h-[48px] px-4 shrink-0 border border-slate-brand text-slate-brand hover:bg-slate-pale disabled:opacity-50 font-body font-medium text-base rounded"
                      >
                        {geocoding ? t('admin.pipeline.camelo.geocoding') : t('admin.pipeline.camelo.lookupCoords')}
                      </button>
                    </div>
                  </div>
                </div>

                {geoSource === null ? (
                  <div role="status" className="bg-amber-50 border border-amber-200 rounded p-4 space-y-3">
                    <p className="font-body text-base text-amber-900">
                      {t('admin.pipeline.camelo.geocodeMissHelp')}
                    </p>
                    <button
                      type="button"
                      onClick={handleUseFallbackPin}
                      className="min-h-[48px] px-4 bg-white border border-amber-700 text-amber-900 hover:bg-amber-100 font-body font-medium text-base rounded"
                    >
                      {t('admin.pipeline.camelo.useFallbackPin')}
                    </button>
                  </div>
                ) : (
                  <p className="font-body text-base text-text-muted">
                    {t(`admin.pipeline.camelo.geoStatus.${geoSource}`)}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="camelo-geo-lat" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.geoLatLabel')} *
                    </label>
                    <input
                      id="camelo-geo-lat"
                      type="number"
                      step="any"
                      required
                      aria-required="true"
                      value={geoLat}
                      onChange={(e) => {
                        setGeoLat(e.target.value)
                        setGeoSource('manual')
                      }}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="camelo-geo-lon" className="block font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.geoLonLabel')} *
                    </label>
                    <input
                      id="camelo-geo-lon"
                      type="number"
                      step="any"
                      required
                      aria-required="true"
                      value={geoLong}
                      onChange={(e) => {
                        setGeoLong(e.target.value)
                        setGeoSource('manual')
                      }}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Notes (Cleaner-visible Job Site Note + Office-visible Client Comment) */}
              <section className="bg-white border border-sand rounded p-5 space-y-5">
                <h4 className="font-sub text-xl text-charcoal">{t('admin.pipeline.camelo.notesSection')}</h4>

                <div className="space-y-1">
                  <label htmlFor="camelo-site-note" className="block font-body text-base font-medium text-charcoal">
                    {t('admin.pipeline.camelo.jobSiteNoteLabel')}
                  </label>
                  <p className="font-body text-base text-text-muted">
                    {t('admin.pipeline.camelo.jobSiteNoteHelp')}
                  </p>
                  <textarea
                    id="camelo-site-note"
                    maxLength={2000}
                    value={jobSiteNote}
                    onChange={(e) => setJobSiteNote(e.target.value)}
                    className={TEXTAREA_CLASS}
                  />
                </div>

                {prepared.leadNotes.length > 0 && (
                  <div className="bg-cream border border-sand rounded p-4 space-y-2">
                    <p className="font-body text-base font-medium text-charcoal">
                      {t('admin.pipeline.camelo.includeLeadNotesLabel')}
                    </p>
                    <div className="space-y-1">
                      {prepared.leadNotes.map((n) => (
                        <label
                          key={n.id}
                          className="flex items-start gap-3 min-h-[48px] py-2 cursor-pointer font-body text-base text-charcoal"
                        >
                          <input
                            type="checkbox"
                            checked={selectedNoteIds.has(n.id)}
                            onChange={() => handleToggleLeadNote(n.id)}
                            className="h-5 w-5 mt-0.5 rounded border-sand-dark text-slate-brand"
                          />
                          <span>
                            <strong>[{t(`admin.pipeline.notes.kinds.${n.kind}`, { defaultValue: n.kind })}]</strong> {n.body}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="camelo-client-comment" className="block font-body text-base font-medium text-charcoal">
                    {t('admin.pipeline.camelo.clientCommentLabel')}
                  </label>
                  <p className="font-body text-base text-text-muted">
                    {t('admin.pipeline.camelo.clientCommentHelp')}
                  </p>
                  <textarea
                    id="camelo-client-comment"
                    maxLength={1900}
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </section>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 bg-white border-t border-sand">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[48px] px-5 border border-sand text-charcoal hover:bg-cream font-body font-medium text-base rounded"
          >
            {t('admin.pipeline.camelo.cancelButton')}
          </button>
          <button
            type="submit"
            form="camelo-sync-form"
            disabled={loading || submitting || !prepared || Boolean(loadError)}
            className="min-h-[48px] px-6 bg-slate-brand hover:bg-slate-dark disabled:opacity-50 text-white font-body font-medium text-base rounded"
          >
            {submitting
              ? t('admin.pipeline.camelo.sendingButton')
              : prepared?.isDevDryRun
                ? t('admin.pipeline.camelo.dryRunButton')
                : t('admin.pipeline.camelo.confirmSendButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
