import React, { useState } from 'react'
import { query, where, getDocs } from 'firebase/firestore'
import { jobsCollection, auditLogCollection } from '@freshnest/shared'
import { db, auth } from '@/lib/firebase/firebase'
import type { Staff } from '@/types'
import { useTranslation } from 'react-i18next'

interface ExportRecordModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
}

type ExportFormat = 'csv_payroll' | 'json_compliance'
type DateRangeOption = 'this_month' | 'last_month' | 'all_time'

export const ExportRecordModal: React.FC<ExportRecordModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const { t } = useTranslation()
  const [format, setFormat] = useState<ExportFormat>('csv_payroll')
  const [dateRange, setDateRange] = useState<DateRangeOption>('this_month')
  const [exporting, setExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen || !staff) return null

  const handleExport = async () => {
    setExporting(true)
    setErrorMessage(null)

    try {
      if (format === 'csv_payroll') {
        // Query completed jobs for this staff member
        const jobsQ = query(
          jobsCollection(db),
          where('assignedTo', '==', staff.id)
        )
        const jobsSnapshot = await getDocs(jobsQ)
        const rawJobs = jobsSnapshot.docs.map((docSnap) => docSnap.data())

        const completedJobs = rawJobs.filter((j) => j.status === 'completed')

        // Filter by date range
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() // 0-11

        let filteredJobs = completedJobs

        if (dateRange === 'this_month') {
          filteredJobs = completedJobs.filter((j) => {
            const [year, month] = j.scheduledDate.split('-').map(Number)
            return year === currentYear && (month - 1) === currentMonth
          })
        } else if (dateRange === 'last_month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          filteredJobs = completedJobs.filter((j) => {
            const [year, month] = j.scheduledDate.split('-').map(Number)
            return year === lastMonthYear && (month - 1) === lastMonth
          })
        }

        // Sort by date descending
        filteredJobs.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))

        // Build CSV Content
        let csvContent = '\uFEFF' // Add BOM for Excel UTF-8 support
        csvContent += 'Date,Job ID,Client Name,Client Address,Service Type,Check In,Check Out,Hours Worked,Pay Rate Snapshot ($/hr),Total Payout (CAD)\n'

        filteredJobs.forEach((job) => {
          let checkInStr = '—'
          let checkOutStr = '—'
          let hours = 0

          if (job.checkedInAt) {
            checkInStr = job.checkedInAt.toISOString()
          }
          if (job.completedAt) {
            checkOutStr = job.completedAt.toISOString()
          }

          if (job.checkedInAt && job.completedAt) {
            const inTime = job.checkedInAt.getTime()
            const outTime = job.completedAt.getTime()
            hours = Math.max(0, (outTime - inTime) / (1000 * 60 * 60))
          }

          const rate = job.payRateSnapshot?.amount || 0
          const grossPay = hours * rate

          // Escape commas in fields
          const clientName = `"${job.clientName.replace(/"/g, '""')}"`
          const clientAddress = `"${job.clientAddress.replace(/"/g, '""')}"`

          csvContent += `${job.scheduledDate},${job.id},${clientName},${clientAddress},${job.serviceType},${checkInStr},${checkOutStr},${hours.toFixed(2)},${rate.toFixed(2)},${grossPay.toFixed(2)}\n`
        })

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `${staff.firstName}_${staff.lastName}_payroll_${dateRange}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Query ALL jobs for this staff member (unassigned/assigned/completed/etc.)
        const jobsQ = query(
          jobsCollection(db),
          where('assignedTo', '==', staff.id)
        )
        const jobsSnapshot = await getDocs(jobsQ)
        const jobs = jobsSnapshot.docs.map((docSnap) => docSnap.data())

        // Query audit logs matching this staff member
        const auditQ = query(
          auditLogCollection(db),
          where('documentId', '==', staff.id)
        )
        const auditSnapshot = await getDocs(auditQ)
        const rawAuditEntries = auditSnapshot.docs.map((docSnap) => docSnap.data())

        // Sort data
        jobs.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
        rawAuditEntries.sort((a, b) => {
          const dateA = a.changedAt.getTime()
          const dateB = b.changedAt.getTime()
          return dateB - dateA
        })

        const CURRENT_TERMS_VERSION = (import.meta.env.VITE_CURRENT_TERMS_VERSION as string | undefined) || '2.1'

        // Build Compliance JSON
        const compliancePayload = {
          exportMetadata: {
            exportedAt: new Date().toISOString(),
            exportedBy: auth.currentUser?.email || 'Admin',
            termsVersionAtExport: CURRENT_TERMS_VERSION,
          },
          profile: {
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
            status: staff.status,
            preferences: staff.preferences || {},
            constraints: staff.constraints || {},
            financials: staff.financials || {},
            compliance: staff.compliance || {},
          },
          jobHistory: jobs.map((j) => ({
            id: j.id,
            bookingId: j.bookingId,
            serviceType: j.serviceType,
            scheduledDate: j.scheduledDate,
            scheduledStartTime: j.scheduledStartTime,
            scheduledEndTime: j.scheduledEndTime,
            status: j.status,
            checkedInAt: j.checkedInAt ? j.checkedInAt.toISOString() : null,
            completedAt: j.completedAt ? j.completedAt.toISOString() : null,
            payRateSnapshot: j.payRateSnapshot || null,
          })),
          auditLogs: rawAuditEntries.map((a) => ({
            id: a.id,
            collection: a.collection,
            documentId: a.documentId,
            field: a.field,
            oldValue: a.oldValue,
            newValue: a.newValue,
            changedBy: a.changedBy,
            changedAt: a.changedAt.toISOString(),
            reason: a.reason,
            overrideType: a.overrideType,
          })),
        }

        // Trigger Download
        const jsonContent = JSON.stringify(compliancePayload, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `${staff.firstName}_${staff.lastName}_compliance_history.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      setErrorMessage(t('admin.staff.exportError', { defaultValue: 'Failed to generate export file. Please try again.' }))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-charcoal/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div
        className="bg-white border border-sand rounded p-6 shadow-lg max-w-md w-full flex flex-col gap-6 my-8 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div>
          <h3 id="export-modal-title" className="font-display text-3xl font-bold text-charcoal">
            {t('admin.staff.exportModal.title', { defaultValue: 'Export Staff Record' })}
          </h3>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.staff.exportModal.subtitle', { defaultValue: 'Download payroll logs or full compliance details for' })} {staff.firstName} {staff.lastName}.
          </p>
        </div>

        {errorMessage && (
        <div className="p-3 bg-cream border border-sand-dark text-charcoal rounded font-body text-base">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Format Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-format" className="font-body text-base text-charcoal font-medium">
              {t('admin.staff.exportModal.formatLabel', { defaultValue: 'Export Format' })}
            </label>
            <select
              id="export-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              disabled={exporting}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="csv_payroll">
                {t('admin.staff.exportModal.optionCsv', { defaultValue: 'Payroll CSV (Completed Jobs)' })}
              </option>
              <option value="json_compliance">
                {t('admin.staff.exportModal.optionJson', { defaultValue: 'Full Compliance History (JSON)' })}
              </option>
            </select>
          </div>

          {/* Date Range Selection (Only for CSV Payroll) */}
          {format === 'csv_payroll' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="export-date-range" className="font-body text-base text-charcoal font-medium">
                {t('admin.staff.exportModal.dateRangeLabel', { defaultValue: 'Date Range' })}
              </label>
              <select
                id="export-date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                disabled={exporting}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              >
                <option value="this_month">
                  {t('admin.staff.exportModal.thisMonth', { defaultValue: 'This Month' })}
                </option>
                <option value="last_month">
                  {t('admin.staff.exportModal.lastMonth', { defaultValue: 'Last Month' })}
                </option>
                <option value="all_time">
                  {t('admin.staff.exportModal.allTime', { defaultValue: 'All Time' })}
                </option>
              </select>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-sand pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="min-h-[48px] px-5 py-2 rounded border border-sand font-body text-base font-medium text-charcoal hover:bg-cream transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            {t('admin.staff.exportModal.cancel', { defaultValue: 'Cancel' })}
          </button>

          <button
            type="button"
            onClick={() => { void handleExport() }}
            disabled={exporting}
            className="min-h-[48px] px-6 py-2 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('admin.staff.exportModal.exporting', { defaultValue: 'Exporting...' })}</span>
              </>
            ) : (
              <span>{t('admin.staff.exportModal.download', { defaultValue: 'Download Export' })}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
