import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'
import { useJob } from '../hooks/useJob'
import { useStaffAuth } from '../hooks/useStaffAuth'
import { useOfflineUploads } from '../hooks/useOfflineUploads'
import { TaskIcon } from '../components/ui/TaskIcon'
import { cn } from '@freshnest/shared'
import { getQueuedPhotos } from '../lib/utils/indexedDb'
import type { ChecklistTemplate, ChecklistTask, JobPhoto, ChecklistCompletion } from '../types'

export const JobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { staffProfile } = useStaffAuth()
  const { job, isLoading: isJobLoading, error: jobError } = useJob(id)
  const { queuePhotoUpload, pendingCount, isOnline, isSyncing } = useOfflineUploads()

  // Checklist template subscription
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null)
  const [templateLoading, setTemplateLoading] = useState(true)
  const [prevChecklistTemplate, setPrevChecklistTemplate] = useState<string | undefined>(undefined)

  if (job?.checklistTemplate !== prevChecklistTemplate) {
    setPrevChecklistTemplate(job?.checklistTemplate)
    if (job?.checklistTemplate) {
      setTemplateLoading(true)
      setTemplate(null)
    } else {
      setTemplateLoading(false)
      setTemplate(null)
    }
  }

  // UI state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [capturingTaskId, setCapturingTaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [localPhotoUrls, setLocalPhotoUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadQueuedPhotoUrls = async () => {
      if (typeof indexedDB === 'undefined') return
      try {
        const queued = await getQueuedPhotos()
        const urls: Record<string, string> = {}
        queued.forEach((qp) => {
          if (qp.jobId === id) {
            urls[`temp:${qp.id}`] = URL.createObjectURL(qp.blob)
          }
        })
        setLocalPhotoUrls((prev) => ({ ...prev, ...urls }))
      } catch (err) {
        console.error('Failed to load queued photos for preview:', err)
      }
    }
    void loadQueuedPhotoUrls()
  }, [id])

  useEffect(() => {
    if (!job?.checklistTemplate) {
      return
    }

    const templateRef = doc(db, 'checklistTemplates', job.checklistTemplate)
    const unsubscribe = onSnapshot(
      templateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTemplate({ id: docSnap.id, ...docSnap.data() } as ChecklistTemplate)
        } else {
          setTemplate(null)
        }
        setTemplateLoading(false)
      },
      (err) => {
        console.error('Error subscribing to checklist template:', err)
        setTemplateLoading(false)
      }
    )

    return () => unsubscribe()
  }, [job?.checklistTemplate])

  if (isJobLoading || templateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-brand"></div>
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <main className="min-h-screen bg-warm-white py-12 px-4 text-center">
        <div className="max-w-md mx-auto bg-white border border-sand rounded p-8 shadow-sm space-y-4">
          <h1 className="font-display text-3xl text-charcoal font-bold">{t('fsm.myJobs.jobCard.errorTitle', { defaultValue: 'Job Not Found' })}</h1>
          <p className="font-body text-base text-text-muted">{jobError?.message || t('fsm.myJobs.jobCard.errorMessage', { defaultValue: 'This job could not be loaded.' })}</p>
          <Link
            to="/jobs"
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-2 bg-slate-brand text-white font-medium rounded hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            {t('fsm.myJobs.jobCard.backToList', { defaultValue: 'Back to My Jobs' })}
          </Link>
        </div>
      </main>
    )
  }

  const formatShiftDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : i18n.language === 'ar' ? 'ar-EG' : 'en-CA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Handle Geolocation Check-in
  const handleCheckIn = () => {
    if (!job.id) return
    const jobId = job.id
    setActionLoading(true)
    setErrorMessage(null)

    const performCheckIn = (lat: number | null, lng: number | null) => {
      const runUpdate = async () => {
        try {
          const jobRef = doc(db, 'jobs', jobId)
          await updateDoc(jobRef, {
            status: 'in_progress',
            checkedInAt: serverTimestamp(),
            checkedInGeo: lat !== null && lng !== null ? { lat, lng } : null,
            checklistCompletions: [],
          })
        } catch (err) {
          console.error('Check in write failed:', err)
          setErrorMessage('fsm.myJobs.jobCard.checkInError')
        } finally {
          setActionLoading(false)
        }
      }
      void runUpdate()
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performCheckIn(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.warn('Geolocation capture failed or denied:', error)
          // Allow check in even if geo fails per P11 spec, geoTagged flag will handle status
          performCheckIn(null, null)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      performCheckIn(null, null)
    }
  }

  // Handle Camera Photo Trigger
  const triggerCamera = (taskId: string) => {
    setCapturingTaskId(taskId)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle Photo File Capture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !capturingTaskId || !staffProfile || !job.id || !staffProfile.uid) return
    const jobId = job.id
    const staffId = staffProfile.uid

    setActionLoading(true)
    setErrorMessage(null)

    const processUpload = (lat: number | null, lng: number | null) => {
      const runQueue = async () => {
        try {
          const tempUrl = await queuePhotoUpload(
            jobId,
            capturingTaskId,
            file,
            staffId,
            lat !== null && lng !== null ? { lat, lng } : null
          )
          const objectUrl = URL.createObjectURL(file)
          setLocalPhotoUrls((prev) => ({ ...prev, [tempUrl]: objectUrl }))
        } catch (err) {
          console.error('Queue photo failed:', err)
          setErrorMessage('fsm.myJobs.jobCard.photoUploadError')
        } finally {
          setActionLoading(false)
          setCapturingTaskId(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      void runQueue()
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          processUpload(position.coords.latitude, position.coords.longitude)
        },
        () => {
          processUpload(null, null)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      processUpload(null, null)
    }
  }

  // Handle Task Completion Toggle
  const handleConfirmTask = async (taskId: string) => {
    if (!staffProfile || !job.id) return
    setActionLoading(true)
    setErrorMessage(null)

    try {
      const currentCompletions: ChecklistCompletion[] = job.checklistCompletions || []
      const taskPhotos: JobPhoto[] = (job.photos || []).filter((p) => p.taskId === taskId)

      const alreadyCompleted = currentCompletions.some((comp) => comp.taskId === taskId)
      let updatedCompletions: ChecklistCompletion[] = []

      if (alreadyCompleted) {
        updatedCompletions = currentCompletions.filter((comp) => comp.taskId !== taskId)
      } else {
        const newCompletion: ChecklistCompletion = {
          taskId,
          completedAt: new Date(),
          photos: taskPhotos,
        }
        updatedCompletions = [...currentCompletions, newCompletion]
      }

      const jobRef = doc(db, 'jobs', job.id)
      await updateDoc(jobRef, {
        checklistCompletions: updatedCompletions,
      })

      // Collapse task
      setExpandedTaskId(null)
    } catch (err) {
      console.error('Error confirming task completion:', err)
      setErrorMessage('fsm.myJobs.jobCard.taskConfirmError')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Job Check-out
  const handleCheckOut = async () => {
    if (!job.id) return
    setActionLoading(true)
    setErrorMessage(null)

    try {
      const jobRef = doc(db, 'jobs', job.id)
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
      })
      void navigate('/jobs')
    } catch (err) {
      console.error('Check out failed:', err)
      setErrorMessage('fsm.myJobs.jobCard.checkOutError')
      setActionLoading(false)
    }
  }

  const tasks: ChecklistTask[] = template?.tasks || []
  const completions: ChecklistCompletion[] = job.checklistCompletions || []

  // Check if a specific task is completed
  const isTaskCompleted = (taskId: string) => {
    return completions.some((comp) => comp.taskId === taskId)
  }

  // Check if checkout is allowed (all tasks complete)
  const isCheckoutAllowed = tasks.length > 0 && tasks.every((task: ChecklistTask) => isTaskCompleted(task.id))

  // Estimate total pay
  const getShiftDurationHours = (startTime: string, endTime: string): number => {
    try {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const diff = (endH + endM / 60) - (startH + startM / 60)
      return diff > 0 ? diff : 2
    } catch {
      return 2
    }
  }
  const duration = getShiftDurationHours(job.scheduledStartTime, job.scheduledEndTime)
  const rate = job.payRateSnapshot?.amount || 0
  const estPay = rate * duration

  return (
    <main className="min-h-screen bg-warm-white py-6 px-4 md:py-12 md:px-6">
      {/* Hidden file input for camera trigger */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Navigation back */}
        <div className="flex justify-between items-center">
          <Link
            to="/jobs"
            className="min-h-[48px] flex items-center font-body font-medium text-slate-brand hover:text-slate-dark transition-colors gap-1"
          >
            {i18n.language === 'ar' ? '→' : '←'} {t('fsm.myJobs.jobCard.backToList', { defaultValue: 'Back to My Jobs' })}
          </Link>

          {/* Connection sync status banner */}
          <div className="flex items-center gap-2 font-body text-sm">
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 animate-pulse font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                {t('fsm.myJobs.syncStatus.pending', { count: pendingCount, defaultValue: `Syncing... ${pendingCount} photos pending` })}
              </span>
            ) : isSyncing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                {t('fsm.myJobs.syncStatus.uploading', { defaultValue: 'Uploading photos...' })}
              </span>
            ) : !isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-50 border border-red-200 text-red-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                {t('fsm.myJobs.syncStatus.offline', { defaultValue: 'Offline Mode' })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {t('fsm.myJobs.syncStatus.online', { defaultValue: 'Online' })}
              </span>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
            {t(errorMessage)}
          </div>
        )}

        {/* Job Heading Details Card */}
        <section className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-charcoal">
                {t(`booking.fields.propertyType.options.${job.serviceType}`, { defaultValue: job.serviceType })}
              </h1>
              <p className="font-body text-lg text-text-muted mt-0.5">
                {formatShiftDate(job.scheduledDate)}
              </p>
            </div>
            <span className={cn(
              'px-3 py-1 rounded text-xs font-bold font-body uppercase border',
              job.status === 'assigned' && 'bg-blue-50 text-blue-700 border-blue-200',
              job.status === 'acknowledged' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
              job.status === 'in_progress' && 'bg-amber-50 text-amber-700 border-amber-200',
              job.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
              job.status === 'disputed' && 'bg-red-50 text-red-700 border-red-200'
            )}>
              {t(`fsm.myJobs.jobCard.status.${job.status}`, { defaultValue: job.status })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-sand/50 font-body text-base">
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                {t('fsm.myJobs.jobCard.estPayLabel', { defaultValue: 'Estimated Pay' })}
              </span>
              <span className="text-charcoal font-semibold mt-0.5 block">
                ${estPay} <span className="text-text-muted font-normal">({duration}h @ ${rate}/h)</span>
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                {t('admin.dashboard.details.address')}
              </span>
              <span className="text-charcoal font-medium mt-0.5 block leading-snug">
                {job.clientAddress}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                {t('fsm.myJobs.jobCard.contactClient', { defaultValue: 'Client Contact' })}
              </span>
              <a href={`tel:${job.clientPhone}`} className="text-slate-brand hover:underline font-medium mt-0.5 block">
                {job.clientPhone}
              </a>
            </div>
          </div>

          {job.clientNotes && (
            <div className="pt-4 border-t border-sand/50 font-body text-base">
              <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">
                {t('booking.fields.notes', { defaultValue: 'Client Notes' })}
              </span>
              <p className="text-charcoal mt-1 bg-cream/35 p-3 rounded border border-sand/40 italic">
                {job.clientNotes}
              </p>
            </div>
          )}
        </section>

        {/* Check In Gating Panel */}
        {job.status === 'assigned' || job.status === 'acknowledged' ? (
          <div className="bg-white border border-sand rounded p-8 shadow-sm text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-charcoal">
              {t('fsm.myJobs.jobCard.welcomeTitle', { defaultValue: 'Ready to start your shift?' })}
            </h2>
            <p className="font-body text-base text-text-muted max-w-md mx-auto">
              {t('fsm.myJobs.jobCard.checkInPrompt', { defaultValue: 'Please check in when you arrive at the client address to unlock the cleaning checklist.' })}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-slate-brand text-white font-body text-lg font-bold rounded hover:bg-slate-dark focus:outline-none focus:ring-2 focus:ring-slate-brand transition-colors duration-200 disabled:opacity-60"
              >
                {actionLoading ? t('fsm.myJobs.jobCard.checkingIn', { defaultValue: 'Checking In...' }) : t('fsm.myJobs.jobCard.checkInBtn', { defaultValue: 'Check In' })}
              </button>
            </div>
          </div>
        ) : null}

        {/* Checklist tasks Panel */}
        {job.status === 'in_progress' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl font-bold text-charcoal">
                {t('fsm.myJobs.jobCard.checklistTitle', { defaultValue: 'Cleaning Tasks' })}
              </h2>
              <span className="font-body text-sm font-semibold text-text-muted bg-white border border-sand px-3 py-1 rounded shadow-inner">
                {completions.length} / {tasks.length} {t('fsm.myJobs.jobCard.completedLabel', { defaultValue: 'Completed' })}
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white border border-sand rounded p-8 text-center text-text-muted italic font-body text-base shadow-sm">
                {t('fsm.myJobs.jobCard.noTasks', { defaultValue: 'No tasks configured in this template.' })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task: ChecklistTask) => {
                  const completed = isTaskCompleted(task.id)
                  const expanded = expandedTaskId === task.id
                  const photosForTask: JobPhoto[] = (job.photos || []).filter((p) => p.taskId === task.id)
                  const hasPhoto = photosForTask.length > 0
                  const isPhotoRequired = task.requiresPhoto
                  const canConfirm = !isPhotoRequired || hasPhoto

                  return (
                    <article
                      key={task.id}
                      className={cn(
                        'bg-white border rounded shadow-sm transition-all duration-200 overflow-hidden flex flex-col',
                        completed ? 'border-emerald-100 bg-emerald-50/10' : 'border-sand',
                        expanded && 'ring-2 ring-slate-brand'
                      )}
                    >
                      {/* Summary Row */}
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                        className="w-full min-h-[48px] px-5 py-4 flex items-center justify-between gap-4 focus:outline-none hover:bg-cream/15 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          {/* Task Icon */}
                          <div className={cn(
                            'p-2 rounded',
                            completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-pale/40 text-slate-brand'
                          )}>
                            <TaskIcon type={task.icon || 'check'} className="w-6 h-6" />
                          </div>
                          <span className={cn(
                            'font-body text-base md:text-lg font-semibold',
                            completed ? 'text-emerald-800 line-through' : 'text-charcoal',
                            i18n.language === 'ar' && 'text-right'
                          )}>
                            {i18n.language === 'fr' ? task.labelFr : task.labelEn}
                          </span>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-2">
                          {isPhotoRequired && !hasPhoto && (
                            <span className="p-1 rounded bg-amber-50 border border-amber-200 text-amber-600" title={t('fsm.myJobs.jobCard.photoRequired', { defaultValue: 'Photo Required' })}>
                              <TaskIcon type="photo" className="w-4 h-4" />
                            </span>
                          )}
                          <div className={cn(
                            'w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200',
                            completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-sand-dark bg-white'
                          )}>
                            {completed && <TaskIcon type="check" className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Section (Two-tap confirmation drawer) */}
                      {expanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-sand/50 bg-cream/10 flex flex-col gap-4">
                          
                          {/* Instructions */}
                          <p className="font-body text-base text-text-muted">
                            {t('fsm.myJobs.jobCard.completeTask', { defaultValue: `Complete all elements related to this task.` })}
                          </p>

                          {/* Photos upload area if required */}
                          {isPhotoRequired && (
                            <div className="border border-sand/70 rounded p-4 bg-white space-y-3">
                              <span className="text-xs text-text-muted uppercase tracking-wider block font-bold">
                                {t('fsm.myJobs.jobCard.verificationPhoto', { defaultValue: 'Verification Photo' })}
                              </span>
                              
                              {/* Photo Preview List */}
                              {photosForTask.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                  {photosForTask.map((p) => {
                                    const isOfflinePhoto = p.url.startsWith('temp:')
                                    const previewUrl = isOfflinePhoto 
                                      ? (localPhotoUrls[p.url] || '')
                                      : p.url

                                    return (
                                      <div key={p.id} className="relative w-28 h-20 border border-sand rounded overflow-hidden shadow-sm group">
                                        {previewUrl ? (
                                          <img src={previewUrl} alt="task proof" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full bg-slate-pale/40 flex items-center justify-center text-slate-brand">
                                            <TaskIcon type="photo" className="w-6 h-6 animate-pulse" />
                                          </div>
                                        )}
                                        {isOfflinePhoto && (
                                          <span className="absolute bottom-1 left-1 right-1 text-center bg-amber-600/90 text-white text-[10px] py-0.5 rounded font-bold uppercase tracking-wide">
                                            {t('fsm.myJobs.syncStatus.offlineBadge', { defaultValue: 'Offline' })}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <p className="font-body text-sm text-amber-700 italic">
                                  {t('fsm.myJobs.jobCard.photoRequiredWarning', { defaultValue: 'A photo is required before this task can be checked off.' })}
                                </p>
                              )}

                              {/* Capture Button */}
                              <button
                                type="button"
                                onClick={() => triggerCamera(task.id)}
                                disabled={actionLoading}
                                className="min-h-[48px] inline-flex items-center justify-center px-4 py-2 border border-slate-brand text-slate-brand font-body text-base font-semibold rounded hover:bg-slate-pale/40 transition-colors gap-2 focus:outline-none"
                              >
                                <TaskIcon type="photo" className="w-5 h-5" />
                                {photosForTask.length > 0 
                                  ? t('fsm.myJobs.jobCard.retakePhoto', { defaultValue: 'Retake Photo' }) 
                                  : t('fsm.myJobs.jobCard.takePhoto', { defaultValue: 'Take Photo' })}
                              </button>
                            </div>
                          )}

                          {/* Confirm Action Button */}
                          <div className="flex justify-end pt-2 border-t border-sand/40">
                            <button
                              type="button"
                              onClick={() => { void handleConfirmTask(task.id) }}
                              disabled={actionLoading || !canConfirm}
                              className={cn(
                                'min-h-[48px] px-6 py-2 rounded font-body text-base font-bold transition-all focus:outline-none',
                                completed
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-slate-brand hover:bg-slate-dark text-white disabled:opacity-40 disabled:hover:bg-slate-brand'
                              )}
                            >
                              {completed 
                                ? t('fsm.myJobs.jobCard.undoComplete', { defaultValue: 'Mark Incomplete' }) 
                                : t('fsm.myJobs.jobCard.confirmDone', { defaultValue: 'Confirm Done' })}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            {/* Check Out Gate Button */}
            <div className="pt-6 border-t border-sand/50">
              <button
                type="button"
                onClick={() => { void handleCheckOut() }}
                disabled={actionLoading || !isCheckoutAllowed}
                className={cn(
                  'w-full min-h-[48px] py-4 bg-slate-brand text-white font-body text-lg font-bold rounded shadow hover:bg-slate-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand disabled:opacity-50 disabled:hover:bg-slate-brand'
                )}
              >
                {actionLoading ? t('fsm.myJobs.jobCard.checkingOut', { defaultValue: 'Checking Out...' }) : t('fsm.myJobs.jobCard.checkOutBtn', { defaultValue: 'Complete Clean & Check Out' })}
              </button>
              {!isCheckoutAllowed && tasks.length > 0 && (
                <p className="font-body text-sm text-center text-text-muted mt-2">
                  {t('fsm.myJobs.jobCard.checkoutDisabledWarning', { defaultValue: 'Please complete all tasks to check out.' })}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Completed/History Job detail */}
        {job.status === 'completed' && (
          <div className="bg-white border border-sand rounded p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <TaskIcon type="check" className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal">
              {t('fsm.myJobs.jobCard.completedTitle', { defaultValue: 'Job Completed!' })}
            </h2>
            <p className="font-body text-base text-text-muted max-w-sm mx-auto">
              {t('fsm.myJobs.jobCard.completedMessage', { defaultValue: 'This shift has been completed and verified. Thank you for your work!' })}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-4 font-body text-base text-left border-t border-sand/40">
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">{t('fsm.myJobs.jobCard.checkedInAtLabel', { defaultValue: 'Checked In' })}</span>
                <span className="text-charcoal font-semibold">{job.checkedInAt ? job.checkedInAt.toLocaleTimeString() : '-'}</span>
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">{t('fsm.myJobs.jobCard.checkedOutAtLabel', { defaultValue: 'Checked Out' })}</span>
                <span className="text-charcoal font-semibold">{job.completedAt ? job.completedAt.toLocaleTimeString() : '-'}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default JobPage
