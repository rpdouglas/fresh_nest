import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import type { Booking, BookingStatus } from '@/types'
import type { AdminBookingFormData } from '@/lib/schemas/bookingSchema'
import { BookingDetailPanel } from './BookingDetailPanel'
import { AdminBookingModal } from './AdminBookingModal'

interface BookingsTableProps {
  filteredBookings: Booking[]
  totalCount: number
  pendingCount: number
  confirmedCount: number
  statusFilter: string
  setStatusFilter: (val: string) => void
  serviceFilter: string
  setServiceFilter: (val: string) => void
  languageFilter: string
  setLanguageFilter: (val: string) => void
  sortBy: 'preferredDate' | 'createdAt'
  setSortBy: (val: 'preferredDate' | 'createdAt') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (val: 'asc' | 'desc') => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  error: string | null
  handleStatusChange: (bookingId: string, status: BookingStatus) => Promise<void> | void
  handleAssignmentChange: (bookingId: string, cleanerName: string | null) => Promise<void> | void
  handleAdminCreate: (data: AdminBookingFormData, adminEmail: string) => Promise<void>
  isCreating: boolean
  adminEmail: string
}

export function BookingsTable({
  filteredBookings,
  totalCount,
  pendingCount,
  confirmedCount,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter,
  languageFilter,
  setLanguageFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  error,
  handleStatusChange,
  handleAssignmentChange,
  handleAdminCreate,
  isCreating,
  adminEmail,
}: BookingsTableProps) {
  const { t } = useTranslation()
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // UI toggle state — local to this component; no data-fetching concerns
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [customCleanerNames, setCustomCleanerNames] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  // Wraps the data-mutation handler with the local UI toggle for the custom cleaner input
  const handleAssignmentChangeWithToggle = async (bookingId: string, value: string) => {
    if (value === 'custom') {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: true }))
    } else {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: false }))
      const cleanerName = value === 'unassigned' ? null : value
      await handleAssignmentChange(bookingId, cleanerName)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* New Booking button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsBookingModalOpen(true)}
          disabled={isCreating}
          className={cn(
            'min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body font-medium rounded',
            'hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            'disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          {t('admin.bookings.newBookingBtn')}
        </button>
      </div>

      {/* Stats Counters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.total')}
          </span>
          <span className="font-display text-4xl text-charcoal font-bold">
            {totalCount}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.pending')}
          </span>
          <span className="font-display text-4xl text-slate-brand font-bold">
            {pendingCount}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.confirmed')}
          </span>
          <span className="font-display text-4xl text-green-600 font-bold">
            {confirmedCount}
          </span>
        </div>
      </div>

      {/* Filtering Controls Bar */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* Start Date filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="start-date-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.startDate')}
            </label>
            <input
              id="start-date-filter"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          {/* End Date filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="end-date-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.endDate')}
            </label>
            <input
              id="end-date-filter"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            />
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="pending">{t('booking.status.pending')}</option>
              <option value="confirmed">{t('booking.status.confirmed')}</option>
              <option value="completed">{t('booking.status.completed')}</option>
              <option value="cancelled">{t('booking.status.cancelled')}</option>
            </select>
          </div>

          {/* Service Type Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.service')}
            </label>
            <select
              id="service-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="standard">{t('services.standard.title')}</option>
              <option value="deep">{t('services.deep.title')}</option>
              <option value="moveout">{t('services.moveout.title')}</option>
              <option value="postconstruction">{t('services.postconstruction.title')}</option>
              <option value="airbnb">{t('services.airbnb.title')}</option>
              <option value="commercial">{t('services.commercial.title')}</option>
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="language-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.language')}
            </label>
            <select
              id="language-filter"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="en">{t('common.languages.en')}</option>
              <option value="fr">{t('common.languages.fr')}</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sort-by" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.sortBy')}
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'preferredDate' | 'createdAt')}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="preferredDate">{t('admin.dashboard.table.date')}</option>
              <option value="createdAt">{t('admin.dashboard.details.createdAt')}</option>
            </select>
          </div>

          {/* Sort Order Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sort-order" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.sortOrder')}
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="asc">{t('common.asc')}</option>
              <option value="desc">{t('common.desc')}</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-query" className="font-body text-base text-charcoal font-medium">
            {t('common.search')}
          </label>
          <input
            id="search-query"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.dashboard.filters.search')}
            className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-sand rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-sand bg-cream">
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.client')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.date')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.service')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.status')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.assigned')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.job')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
                    <span className="font-body text-base text-text-muted">{t('admin.dashboard.filters.loading')}</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="p-8 text-center font-body text-base text-red-600">
                  {error}
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center font-body text-base text-text-muted">
                  {t('admin.dashboard.table.noResults')}
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => {
                const isExpanded = expandedRowId === b.id
                const clientName = `${b.firstName} ${b.lastName}`
                const serviceKey = b.serviceType

                return (
                  <tr key={b.id} className="contents">
                    {/* Main table row */}
                    <tr
                      onClick={() => setExpandedRowId(isExpanded ? null : (b.id ?? null))}
                      className={cn(
                        'border-b border-sand hover:bg-warm-white transition-colors duration-150 cursor-pointer',
                        isExpanded && 'bg-warm-white'
                      )}
                    >
                      <td className="p-4 font-body text-base text-charcoal font-medium">
                        <div className="flex flex-col">
                          <span>{clientName}</span>
                          <span className="text-sm text-text-muted font-normal">{b.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {b.preferredDate}
                      </td>
                      <td className="p-4 font-body text-base text-charcoal capitalize">
                        {t(`services.${serviceKey}.title`)}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded font-body text-sm font-medium border',
                            b.status === 'pending' && 'bg-yellow-50 text-yellow-800 border-yellow-200',
                            b.status === 'confirmed' && 'bg-green-50 text-green-800 border-green-200',
                            b.status === 'completed' && 'bg-blue-50 text-blue-800 border-blue-200',
                            b.status === 'cancelled' && 'bg-red-50 text-red-800 border-red-200'
                          )}
                        >
                          {t(`booking.status.${b.status}`)}
                        </span>
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {b.assignedTo || (
                          <span className="text-text-muted italic">
                            {t('admin.dashboard.details.unassigned')}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {b.jobId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-body text-sm font-medium border bg-green-50 text-green-800 border-green-200">
                            ✓ {t('admin.dashboard.table.jobCreated')}
                          </span>
                        ) : (
                          <span className="font-body text-sm text-text-muted">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible details panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && b.id && (
                        <BookingDetailPanel
                          booking={b}
                          customCleanerNames={customCleanerNames}
                          showCustomInput={showCustomInput}
                          setCustomCleanerNames={setCustomCleanerNames}
                          handleStatusChange={handleStatusChange}
                          handleAssignmentChange={handleAssignmentChangeWithToggle}
                        />
                      )}
                    </AnimatePresence>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => { void fetchNextPage() }}
            disabled={isFetchingNextPage}
            className="min-h-[48px] px-6 py-2 bg-slate-brand text-white font-body font-medium rounded hover:bg-slate-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('admin.dashboard.filters.loading')}
              </>
            ) : (
              t('admin.dashboard.filters.loadMore')
            )}
          </button>
        </div>
      )}
      {!hasNextPage && filteredBookings.length > 0 && !isLoading && (
        <div className="text-center text-text-muted mt-6 font-body text-base">
          {t('admin.dashboard.filters.noMore')}
        </div>
      )}

      <AdminBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleAdminCreate}
        adminEmail={adminEmail}
      />
    </div>
  )
}
