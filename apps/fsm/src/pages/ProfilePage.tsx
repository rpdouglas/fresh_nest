import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc } from 'firebase/firestore'
import { staffCollection, cn } from '@freshnest/shared'
import { db } from '../lib/firebase/firebase'
import { useStaffAuth } from '../hooks/useStaffAuth'
import type { TransportMode, BlockedWindow } from '../types'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const { staffProfile } = useStaffAuth()

  // Profile fields state
  const [transportMode, setTransportMode] = useState<TransportMode>(
    () => staffProfile?.constraints?.transportMode || 'personal_vehicle'
  )
  const [transitBufferMinutes, setTransitBufferMinutes] = useState<number>(
    () => staffProfile?.constraints?.transitBufferMinutes ?? 60
  )
  const [monthlyEarningsLimit, setMonthlyEarningsLimit] = useState<string>(
    () => staffProfile?.financials?.monthlyEarningsLimit !== null && 
          staffProfile?.financials?.monthlyEarningsLimit !== undefined
            ? staffProfile.financials.monthlyEarningsLimit.toString()
            : ''
  )
  const [blockedWindows, setBlockedWindows] = useState<BlockedWindow[]>(
    () => staffProfile?.constraints?.blockedWindows || []
  )

  // Blocked Window Form State
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1) // Monday
  const [newStartTime, setNewStartTime] = useState<string>('09:00')
  const [newEndTime, setNewEndTime] = useState<string>('17:00')
  const [newLabel, setNewLabel] = useState<string>('')
  const [blockedWindowError, setBlockedWindowError] = useState<string | null>(null)

  // Status & Feedback States
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!staffProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  // Handle adding a blocked window in local state
  const handleAddBlockedWindow = (e: React.FormEvent) => {
    e.preventDefault()
    setBlockedWindowError(null)

    const label = newLabel.trim()
    if (!label) {
      setBlockedWindowError('Label is required.')
      return
    }

    if (!newStartTime || !newEndTime) {
      setBlockedWindowError('Start and end times are required.')
      return
    }

    // Compare times (HH:MM)
    if (newStartTime >= newEndTime) {
      setBlockedWindowError('Start time must be before end time.')
      return
    }

    const newWindow: BlockedWindow = {
      id: crypto.randomUUID(),
      dayOfWeek: newDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: newStartTime,
      endTime: newEndTime,
      recurring: true,
      label,
    }

    // Check for duplicate day/time overlaps in local list
    const hasOverlap = blockedWindows.some(
      (w) =>
        w.dayOfWeek === newWindow.dayOfWeek &&
        ((newStartTime >= w.startTime && newStartTime < w.endTime) ||
          (newEndTime > w.startTime && newEndTime <= w.endTime) ||
          (newStartTime <= w.startTime && newEndTime >= w.endTime))
    )

    if (hasOverlap) {
      setBlockedWindowError('This window overlaps with an existing blocked window.')
      return
    }

    setBlockedWindows([...blockedWindows, newWindow])
    setNewLabel('')
    setBlockedWindowError(null)
  }

  // Handle deleting a blocked window in local state
  const handleRemoveBlockedWindow = (id: string) => {
    setBlockedWindows(blockedWindows.filter((w) => w.id !== id))
  }

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const parsedLimit = monthlyEarningsLimit.trim() === '' ? null : Number(monthlyEarningsLimit)
      if (parsedLimit !== null && (isNaN(parsedLimit) || parsedLimit < 0)) {
        throw new Error('Monthly earnings limit must be a positive number.')
      }

      const staffRef = doc(staffCollection(db), staffProfile.id)
      await updateDoc(staffRef, {
        'constraints.transportMode': transportMode,
        'constraints.transitBufferMinutes': Number(transitBufferMinutes),
        'constraints.blockedWindows': blockedWindows,
        'financials.monthlyEarningsLimit': parsedLimit,
      })

      setSuccessMsg(t('fsm.profile.saveSuccess'))
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error(err)
      const errorInstance = err as Error
      setErrorMsg(errorInstance.message || t('fsm.profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  // Calculate ODSP limit status
  const currentEarnings = staffProfile.financials?.currentMonthEarnings ?? 0
  const limitValue = monthlyEarningsLimit.trim() === '' ? null : Number(monthlyEarningsLimit)
  const isCapConfigured = limitValue !== null && !isNaN(limitValue) && limitValue > 0
  
  let percentage = 0
  let safetyState: 'safe' | 'caution' | 'at_limit' = 'safe'

  if (isCapConfigured && limitValue) {
    percentage = Math.min((currentEarnings / limitValue) * 100, 100)
    // Carla (P7) cap warning rules:
    // Amber/Caution: within $100 of limit or 75%-90%. Red: > 90% or exceeded.
    const remaining = limitValue - currentEarnings
    if (percentage > 90 || remaining <= 0) {
      safetyState = 'at_limit'
    } else if (percentage >= 75 || remaining <= 100) {
      safetyState = 'caution'
    } else {
      safetyState = 'safe'
    }
  }

  return (
    <main className="min-h-screen bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="font-display text-5xl text-charcoal">
            {t('fsm.profile.title')}
          </h1>
          <p className="font-body text-base text-text-muted mt-1">
            {t('fsm.profile.subtitle')}
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-body text-base">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => { void handleSaveProfile(e) }} className="flex flex-col gap-8">
          
          {/* Card 1: Read-Only Personal Details */}
          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
            <h2 className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
              {t('fsm.profile.personalInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-body text-sm text-text-muted block">
                  {t('fsm.profile.firstName')}
                </span>
                <span className="font-body text-base text-charcoal font-medium">
                  {staffProfile.firstName}
                </span>
              </div>
              <div>
                <span className="font-body text-sm text-text-muted block">
                  {t('fsm.profile.lastName')}
                </span>
                <span className="font-body text-base text-charcoal font-medium">
                  {staffProfile.lastName}
                </span>
              </div>
              <div>
                <span className="font-body text-sm text-text-muted block">
                  {t('fsm.profile.email')}
                </span>
                <span className="font-body text-base text-charcoal font-medium">
                  {staffProfile.email}
                </span>
              </div>
              <div>
                <span className="font-body text-sm text-text-muted block">
                  {t('fsm.profile.phone')}
                </span>
                <span className="font-body text-base text-charcoal font-medium">
                  {staffProfile.phone}
                </span>
              </div>
              <div>
                <span className="font-body text-sm text-text-muted block">
                  {t('fsm.profile.role')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-slate-pale text-slate-brand mt-1 capitalize">
                  {t(`fsm.profile.roles.${staffProfile.role}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Transit & Commute Constraints */}
          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
            <h2 className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
              {t('fsm.profile.transport.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transport Mode */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="transportMode" className="font-body text-base text-charcoal font-medium">
                  {t('fsm.profile.transport.mode')}
                </label>
                <select
                  id="transportMode"
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                  className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  <option value="personal_vehicle">{t('fsm.profile.transport.modes.personal_vehicle')}</option>
                  <option value="transit">{t('fsm.profile.transport.modes.transit')}</option>
                  <option value="rideshare">{t('fsm.profile.transport.modes.rideshare')}</option>
                  <option value="walk">{t('fsm.profile.transport.modes.walk')}</option>
                </select>
              </div>

              {/* Transit Buffer */}
              {transportMode === 'transit' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="transitBuffer" className="font-body text-base text-charcoal font-medium">
                    {t('fsm.profile.transport.buffer')}
                  </label>
                  <input
                    id="transitBuffer"
                    type="number"
                    min="0"
                    value={transitBufferMinutes}
                    onChange={(e) => setTransitBufferMinutes(Number(e.target.value))}
                    className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                  <p className="font-body text-sm text-text-muted">
                    {t('fsm.profile.transport.bufferHelp')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Blocked Windows Manager */}
          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
                {t('fsm.profile.blockedWindows.title')}
              </h2>
              <p className="font-body text-base text-text-muted mt-2">
                {t('fsm.profile.blockedWindows.subtitle')}
              </p>
            </div>

            {/* List of current windows */}
            <div className="flex flex-col gap-3">
              {blockedWindows.length === 0 ? (
                <p className="font-body text-base text-text-muted italic py-2">
                  {t('fsm.profile.blockedWindows.noWindows')}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {blockedWindows.map((w) => (
                    <li 
                      key={w.id} 
                      className="flex items-center justify-between p-4 bg-warm-white border border-sand rounded"
                    >
                      <div className="flex flex-col">
                        <span className="font-body text-base font-medium text-charcoal">
                          {w.label}
                        </span>
                        <span className="font-body text-sm text-text-muted">
                          {t(`fsm.profile.blockedWindows.days.${w.dayOfWeek}`)}, {w.startTime} - {w.endTime}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedWindow(w.id)}
                        className={cn(
                          'min-h-[48px] px-4 text-red-600 hover:bg-red-50 border border-transparent rounded',
                          'font-body text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                        )}
                      >
                        {t('fsm.profile.blockedWindows.deleteBtn')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Blocked Window Creator */}
            <div className="border-t border-sand pt-6 flex flex-col gap-4">
              <h3 className="font-sub text-xl text-charcoal">
                {t('fsm.profile.blockedWindows.addBtn')}
              </h3>

              {blockedWindowError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded font-body text-base">
                  {blockedWindowError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Day */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="dayOfWeek" className="font-body text-base text-charcoal font-medium">
                    {t('fsm.profile.blockedWindows.day')}
                  </label>
                  <select
                    id="dayOfWeek"
                    value={newDayOfWeek}
                    onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                    className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <option key={day} value={day}>
                        {t(`fsm.profile.blockedWindows.days.${day}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="startTime" className="font-body text-base text-charcoal font-medium">
                    {t('fsm.profile.blockedWindows.start')}
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                </div>

                {/* End Time */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="endTime" className="font-body text-base text-charcoal font-medium">
                    {t('fsm.profile.blockedWindows.end')}
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                </div>

                {/* Label */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="label" className="font-body text-base text-charcoal font-medium">
                    {t('fsm.profile.blockedWindows.label')}
                  </label>
                  <input
                    id="label"
                    type="text"
                    placeholder={t('fsm.profile.blockedWindows.labelPlaceholder')}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddBlockedWindow}
                className={cn(
                  'border border-slate-brand text-slate-brand font-body font-medium rounded',
                  'min-h-[48px] px-6 py-2 text-base self-start mt-2 transition-colors duration-200 hover:bg-slate-pale',
                  'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                )}
              >
                {t('fsm.profile.blockedWindows.addBtn')}
              </button>
            </div>
          </div>

          {/* Card 4: ODSP Earnings Tracker */}
          <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
                {t('fsm.profile.odsp.title')}
              </h2>
              <p className="font-body text-base text-text-muted mt-2">
                {t('fsm.profile.odsp.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Input limit */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="monthlyEarningsLimit" className="font-body text-base text-charcoal font-medium">
                  {t('fsm.profile.odsp.limitLabel')}
                </label>
                <input
                  id="monthlyEarningsLimit"
                  type="number"
                  placeholder={t('fsm.profile.odsp.limitPlaceholder')}
                  value={monthlyEarningsLimit}
                  onChange={(e) => setMonthlyEarningsLimit(e.target.value)}
                  className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                />
              </div>

              {/* Visual Gauge */}
              {isCapConfigured && (
                <div className="flex flex-col items-center gap-4 p-4 border border-sand rounded bg-warm-white">
                  <div className="text-center">
                    <span className="font-body text-sm text-text-muted block">
                      {t('fsm.profile.odsp.currentEarnings')}
                    </span>
                    <span className="font-display text-3xl text-charcoal font-bold">
                      ${currentEarnings} / ${limitValue}
                    </span>
                  </div>

                  {/* SVG circular or bar progress */}
                  <div className="w-full bg-slate-pale rounded h-6 overflow-hidden border border-sand">
                    <div 
                      className={cn(
                        'h-full transition-all duration-300',
                        safetyState === 'safe' && 'bg-emerald-500',
                        safetyState === 'caution' && 'bg-amber-500',
                        safetyState === 'at_limit' && 'bg-red-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="text-center font-body text-base font-semibold">
                    <span className={cn(
                      safetyState === 'safe' && 'text-emerald-700',
                      safetyState === 'caution' && 'text-amber-700',
                      safetyState === 'at_limit' && 'text-red-700'
                    )}>
                      {t(`fsm.profile.odsp.gauge.${safetyState}`)}
                    </span>
                    <p className="font-body text-sm text-text-muted font-normal mt-1 leading-relaxed">
                      {t(`fsm.profile.odsp.messages.${safetyState}`)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'min-h-[48px] px-8 py-3 bg-slate-brand text-white font-body font-medium rounded text-base',
                'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                'disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[150px]'
              )}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('fsm.profile.saving', { defaultValue: 'Save Settings' })
              )}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}

export default ProfilePage
