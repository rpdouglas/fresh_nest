import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { StaffRole, StaffStatus, Staff, BackgroundCheckStatus } from '@/types'
import { RegisterStaffModal } from './RegisterStaffModal'
import { ExportRecordModal } from './ExportRecordModal'
import { useStaff, RegisterStaffInput } from './hooks/useStaff'

interface StaffTableProps {
  isAuthorized: boolean
}

export const StaffTable: React.FC<StaffTableProps> = ({ isAuthorized }) => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Export modal state
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const {
    filteredStaff,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    registerStaff,
    resendWelcome,
    updateBackgroundCheckStatus,
  } = useStaff(isAuthorized)

  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  // P3-E27-B2: background check status/provider/notes editor
  const [editingBgCheckId, setEditingBgCheckId] = useState<string | null>(null)
  const [bgDraft, setBgDraft] = useState<{ status: BackgroundCheckStatus; provider: string; notes: string }>({
    status: 'not_started',
    provider: '',
    notes: '',
  })
  const [bgSaving, setBgSaving] = useState(false)
  const [bgError, setBgError] = useState<string | null>(null)

  const handleRegister = async (input: RegisterStaffInput) => {
    await registerStaff(input)
    setSuccessMessage(t('admin.staff.modal.success'))
    setTimeout(() => {
      setSuccessMessage(null)
    }, 4000)
  }

  const handleResendInvite = async (uid: string) => {
    setResendingId(uid)
    setResendError(null)
    try {
      await resendWelcome(uid)
      setSuccessMessage(t('admin.staff.resendSuccess', { defaultValue: 'Invitation email resent successfully.' }))
      setTimeout(() => {
        setSuccessMessage(null)
      }, 4000)
    } catch (err) {
      console.error('[handleResendInvite] Error resending invite:', err)
      setResendError(t('admin.staff.resendError', { defaultValue: 'Failed to resend invitation email. Please try again.' }))
      setTimeout(() => {
        setResendError(null)
      }, 5000)
    } finally {
      setResendingId(null)
    }
  }

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'cleaner':
        return t('admin.staff.modal.roleOption.cleaner', { defaultValue: 'Cleaner' })
      case 'lead':
        return t('admin.staff.modal.roleOption.lead', { defaultValue: 'Lead Cleaner' })
      case 'supervisor':
        return t('admin.staff.modal.roleOption.supervisor', { defaultValue: 'Supervisor' })
      default:
        return role
    }
  }

  const getBgCheckStatusLabel = (status: BackgroundCheckStatus) => {
    switch (status) {
      case 'not_started':
        return t('admin.staff.backgroundCheck.statusOption.not_started', { defaultValue: 'Not Started' })
      case 'pending':
        return t('admin.staff.backgroundCheck.statusOption.pending', { defaultValue: 'Pending' })
      case 'cleared':
        return t('admin.staff.backgroundCheck.statusOption.cleared', { defaultValue: 'Cleared' })
      case 'flagged':
        return t('admin.staff.backgroundCheck.statusOption.flagged', { defaultValue: 'Flagged' })
      default:
        return status
    }
  }

  const openBgCheckEditor = (s: Staff) => {
    setBgError(null)
    setEditingBgCheckId(s.id)
    setBgDraft({
      status: s.backgroundCheck?.status ?? 'not_started',
      provider: s.backgroundCheck?.provider ?? '',
      notes: s.backgroundCheck?.notes ?? '',
    })
  }

  const handleSaveBgCheck = async (uid: string) => {
    setBgSaving(true)
    setBgError(null)
    try {
      await updateBackgroundCheckStatus({
        uid,
        status: bgDraft.status,
        provider: bgDraft.provider.trim() || undefined,
        notes: bgDraft.notes.trim() || undefined,
      })
      setEditingBgCheckId(null)
    } catch (err) {
      console.error('[handleSaveBgCheck] Error updating background check status:', err)
      setBgError(t('admin.staff.backgroundCheck.saveError', { defaultValue: 'Failed to update background check status.' }))
    } finally {
      setBgSaving(false)
    }
  }

  const getStatusLabel = (status: StaffStatus) => {
    switch (status) {
      case 'onboarding':
        return t('admin.staff.modal.statusOption.onboarding', { defaultValue: 'Onboarding' })
      case 'active':
        return t('admin.staff.modal.statusOption.active', { defaultValue: 'Active' })
      case 'inactive':
        return t('admin.staff.modal.statusOption.inactive', { defaultValue: 'Inactive' })
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner and Register Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.staff.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.staff.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded',
            'min-h-[48px] px-6 py-2 text-base self-start sm:self-auto transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
          )}
        >
          {t('admin.staff.registerBtn')}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded font-body text-base animate-pulse">
          {successMessage}
        </div>
      )}

      {resendError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base animate-pulse">
          {resendError}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label htmlFor="staff-search" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.search')}
            </label>
            <input
              id="staff-search"
              type="text"
              placeholder={t('admin.staff.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[48px] px-4 py-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-role-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.staff.filterRole')}
            </label>
            <select
              id="staff-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('admin.staff.allRoles')}</option>
              <option value="cleaner">{t('admin.staff.modal.roleOption.cleaner', { defaultValue: 'Cleaner' })}</option>
              <option value="lead">{t('admin.staff.modal.roleOption.lead', { defaultValue: 'Lead Cleaner' })}</option>
              <option value="supervisor">{t('admin.staff.modal.roleOption.supervisor', { defaultValue: 'Supervisor' })}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-status-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.staff.filterStatus')}
            </label>
            <select
              id="staff-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('admin.staff.allStatuses')}</option>
              <option value="onboarding">{t('admin.staff.modal.statusOption.onboarding', { defaultValue: 'Onboarding' })}</option>
              <option value="active">{t('admin.staff.modal.statusOption.active', { defaultValue: 'Active' })}</option>
              <option value="inactive">{t('admin.staff.modal.statusOption.inactive', { defaultValue: 'Inactive' })}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-sand rounded shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 font-body text-base">
            {t('admin.staff.modal.error')}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-text-muted font-body text-base">
            {t('admin.staff.table.noResults')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream border-b border-sand">
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.table.name')}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.table.contact')}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.table.role')}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.table.status')}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.backgroundCheck.columnLabel', { defaultValue: 'Background Check' })}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal">
                    {t('admin.staff.modal.transport')}
                  </th>
                  <th className="p-4 font-body text-base font-semibold text-charcoal text-right">
                    {t('admin.staff.table.actions', { defaultValue: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                    {/* Name */}
                    <td className="p-4 font-body text-base font-medium text-charcoal">
                      {s.firstName} {s.lastName}
                    </td>
                    
                    {/* Contact */}
                    <td className="p-4 font-body text-base text-charcoal">
                      <div className="flex flex-col">
                        <span>{s.email}</span>
                        <span className="text-text-muted text-base">{s.phone}</span>
                        {s.welcomeEmailSentAt ? (
                          <span className="text-xs text-green-600 font-medium mt-1">
                            {t('admin.staff.welcomeSent', { defaultValue: 'Invite sent' })}: {new Date(s.welcomeEmailSentAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium mt-1">
                            {t('admin.staff.welcomeNotSent', { defaultValue: 'Invite not sent' })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4 font-body text-base text-charcoal">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium',
                        s.role === 'supervisor' ? 'bg-indigo-100 text-indigo-800' :
                        s.role === 'lead' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      )}>
                        {getRoleLabel(s.role)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4 font-body text-base text-charcoal">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium',
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'onboarding' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {getStatusLabel(s.status)}
                      </span>
                    </td>

                    {/* Background Check (P3-E27-B2) */}
                    <td className="p-4 font-body text-base text-charcoal">
                      {editingBgCheckId === s.id ? (
                        <div className="flex flex-col gap-2 min-w-[180px]">
                          <select
                            value={bgDraft.status}
                            onChange={(e) => setBgDraft((prev) => ({ ...prev, status: e.target.value as BackgroundCheckStatus }))}
                            disabled={bgSaving}
                            className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          >
                            <option value="not_started">{getBgCheckStatusLabel('not_started')}</option>
                            <option value="pending">{getBgCheckStatusLabel('pending')}</option>
                            <option value="cleared">{getBgCheckStatusLabel('cleared')}</option>
                            <option value="flagged">{getBgCheckStatusLabel('flagged')}</option>
                          </select>
                          <input
                            type="text"
                            value={bgDraft.provider}
                            onChange={(e) => setBgDraft((prev) => ({ ...prev, provider: e.target.value }))}
                            placeholder={t('admin.staff.backgroundCheck.providerPlaceholder', { defaultValue: 'Provider (optional)' })}
                            disabled={bgSaving}
                            className="min-h-[48px] px-2 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
                          />
                          {bgError && <span className="text-base text-red-600">{bgError}</span>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { void handleSaveBgCheck(s.id) }}
                              disabled={bgSaving}
                              className="min-h-[48px] px-3 bg-slate-brand hover:bg-slate-dark text-white font-body font-medium rounded transition-colors"
                            >
                              {bgSaving ? t('admin.staff.backgroundCheck.saving', { defaultValue: 'Saving...' }) : t('admin.staff.backgroundCheck.save', { defaultValue: 'Save' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBgCheckId(null)}
                              disabled={bgSaving}
                              className="min-h-[48px] px-3 border border-sand rounded font-body font-medium text-charcoal hover:bg-cream transition-colors"
                            >
                              {t('admin.staff.backgroundCheck.cancel', { defaultValue: 'Cancel' })}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded text-base font-medium',
                            s.backgroundCheck?.status === 'cleared' ? 'bg-emerald-100 text-emerald-800' :
                            s.backgroundCheck?.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            s.backgroundCheck?.status === 'flagged' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          )}>
                            {getBgCheckStatusLabel(s.backgroundCheck?.status ?? 'not_started')}
                          </span>
                          <button
                            type="button"
                            onClick={() => openBgCheckEditor(s)}
                            className="text-slate-brand hover:text-slate-dark font-medium min-h-[48px] px-1 text-base transition-colors duration-150"
                          >
                            {t('admin.staff.backgroundCheck.edit', { defaultValue: 'Update' })}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Transportation & Constraints */}
                    <td className="p-4 font-body text-base text-charcoal">
                      <div className="flex flex-col text-base text-text-muted">
                        <span className="capitalize font-medium text-charcoal">
                          {s.constraints?.transportMode ? t(`admin.staff.modal.transportOption.${s.constraints.transportMode}`, { defaultValue: s.constraints.transportMode.replace('_', ' ') }) : '—'}
                        </span>
                        {s.constraints?.transportMode === 'transit' && (
                          <span>
                            {t('admin.staff.modal.buffer')}: {s.constraints.transitBufferMinutes} min
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 font-body text-base text-charcoal text-right">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={resendingId !== null}
                          onClick={() => { void handleResendInvite(s.id) }}
                          className={cn(
                            "text-slate-brand hover:text-slate-dark font-medium min-h-[48px] px-3 rounded hover:bg-slate-pale transition-colors duration-150",
                            resendingId === s.id && "animate-pulse cursor-wait"
                          )}
                        >
                          {resendingId === s.id 
                            ? t('admin.staff.table.sending', { defaultValue: 'Sending...' }) 
                            : t('admin.staff.table.resend', { defaultValue: 'Resend Invite' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaff(s)
                            setIsExportModalOpen(true)
                          }}
                          className="text-slate-brand hover:text-slate-dark font-medium min-h-[48px] px-3 rounded hover:bg-slate-pale transition-colors duration-150"
                        >
                          {t('admin.staff.table.export', { defaultValue: 'Export' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegisterStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={handleRegister}
      />

      <ExportRecordModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false)
          setSelectedStaff(null)
        }}
        staff={selectedStaff}
      />
    </div>
  )
}
