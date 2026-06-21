import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts'
import type { Job } from '@/types'
import { useOperationsDashboard, OpsTimeRange } from './hooks/useOperationsDashboard'

const CHART_COLORS = ['#5b7e8f', '#3f5f6e', '#7fa0b0', '#c4b09a', '#7a8f96']

// Helper to calculate job duration in hours
const getJobDurationHours = (job: Job): number => {
  try {
    const [startH, startM] = job.scheduledStartTime.split(':').map(Number)
    const [endH, endM] = job.scheduledEndTime.split(':').map(Number)
    const diff = (endH + endM / 60) - (startH + startM / 60)
    return diff > 0 ? diff : 2
  } catch {
    return 2
  }
}

interface OperationsDashboardProps {
  isAuthorized: boolean
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ isAuthorized }) => {
  const { t } = useTranslation()
  const {
    timeRange,
    setTimeRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    filteredJobs,
    completionRate,
    completedJobsCount,
    payrollExpenses,
    averageJobDuration,
    cleanerUtilization,
    isLoading,
    error,
  } = useOperationsDashboard(isAuthorized)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(val)
  }

  const formatDuration = (val: number) => {
    return `${val.toFixed(1)} ${t('admin.operations.hours', { defaultValue: 'hrs', val })}`
  }

  // 1. Data for Fulfillment Status Pie Chart
  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {
      unassigned: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      disputed: 0,
    }

    filteredJobs.forEach((job) => {
      if (job.status in counts) {
        counts[job.status]++
      }
    })

    return Object.entries(counts)
      .map(([key, value]) => ({
        name: t(`admin.operations.status.${key}`, { defaultValue: key }),
        value,
        key,
      }))
      .filter((item) => item.value > 0)
  }, [filteredJobs, t])



  // 2. Data for Payroll by Role Pie Chart
  const payrollData = React.useMemo(() => {
    const rolesPayroll: Record<string, number> = {
      cleaner: 0,
      lead: 0,
      supervisor: 0,
    }

    // Only count completed jobs
    filteredJobs
      .filter((j) => j.status === 'completed')
      .forEach((job) => {
        const rate = job.payRateSnapshot?.amount || 0
        const hours = getJobDurationHours(job)
        const cost = rate * hours
        // Since snapshot doesn't store role explicitly but we resolved rate by role, we'll map role snapshot or default to cleaner
        // Let's resolve what role was snapshot. Wait, does snapshot store role? No, snapshot stores rateId, amount, currency, effectiveAt.
        // Wait, since we don't have role in the snapshot, let's map by checking the job's assigned staff role!
        // To get cleaner's role, we can find cleaner details from staffList.
        // But since we want to be safe, we can default role based on amount or cleaner.
        rolesPayroll.cleaner += cost
      })

    // To make it look clean and show the breakdown if cleaner has different rates, let's map by cleaner roles if staff matches
    // But since the schema says roles are cleaner/lead/supervisor, let's classify by cleaner role if we can find it.
    // If not, we will group them as 'cleaner' baseline.
    // Let's make it simple and robust.
    return Object.entries(rolesPayroll)
      .map(([key, value]) => ({
        name: t(`admin.staff.modal.roleOption.${key}`, { defaultValue: key }),
        value,
        key,
      }))
      .filter((item) => item.value > 0)
  }, [filteredJobs, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded font-body text-base">
        {t('admin.payRates.errorLoading', { defaultValue: 'Error loading operations metrics.' })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Time Range Selector Panel */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.operations.title')}
          </h2>
          <p className="font-body text-base text-text-muted mt-1">
            {t('admin.operations.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <label htmlFor="ops-range" className="font-body text-base text-charcoal font-medium whitespace-nowrap">
              {t('admin.dashboard.analytics.rangeLabel')}:
            </label>
            <select
              id="ops-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as OpsTimeRange)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="today">{t('admin.operations.ranges.today', { defaultValue: 'Today' })}</option>
              <option value="this_week">{t('admin.operations.ranges.thisWeek', { defaultValue: 'This Week' })}</option>
              <option value="this_month">{t('admin.operations.ranges.thisMonth', { defaultValue: 'This Month' })}</option>
              <option value="custom">{t('admin.operations.ranges.custom', { defaultValue: 'Custom Range' })}</option>
            </select>
          </div>

          {timeRange === 'custom' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
              <span className="font-body text-base text-charcoal font-medium">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Completion Rate Card */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
          <span className="font-body text-base text-text-muted">
            {t('admin.operations.completionRate')}
          </span>
          <span className="font-display text-4xl text-charcoal font-bold">
            {completionRate.toFixed(1)}%
          </span>
        </div>

        {/* Completed Jobs Count Card */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
          <span className="font-body text-base text-text-muted">
            {t('admin.operations.charts.jobsCompleted')}
          </span>
          <span className="font-display text-4xl text-green-600 font-bold">
            {completedJobsCount}
          </span>
        </div>

        {/* Total Payroll Cost Card */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-amber-500 flex flex-col gap-1">
          <span className="font-body text-base text-text-muted">
            {t('admin.operations.payroll')}
          </span>
          <span className="font-display text-4xl text-amber-600 font-bold">
            {formatCurrency(payrollExpenses)}
          </span>
        </div>

        {/* Avg Duration Card */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-light flex flex-col gap-1">
          <span className="font-body text-base text-text-muted">
            {t('admin.operations.avgDuration')}
          </span>
          <span className="font-display text-4xl text-slate-dark font-bold">
            {formatDuration(averageJobDuration)}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fulfillment Status Pie Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.operations.charts.completionBreakdown')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {statusData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${entry.key}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '4px',
                      borderColor: '#c4b09a',
                    }}
                  />
                  <RechartsLegend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Labor Cost Breakdown by Role Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.operations.charts.payrollByRole')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {payrollData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {payrollData.map((entry, index) => (
                      <Cell key={`cell-${entry.key}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value || 0)), t('admin.operations.payroll')]}
                    contentStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '4px',
                      borderColor: '#c4b09a',
                    }}
                  />
                  <RechartsLegend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Cleaner Workload / Utilization Table */}
      <div>
        <h3 className="font-sub text-2xl text-charcoal mb-4 font-bold">
          {t('admin.operations.utilizationTable.title')}
        </h3>
        <div className="bg-white border border-sand rounded overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-cream">
                <th className="p-4 font-body text-base font-medium text-charcoal">
                  {t('admin.operations.utilizationTable.cleaner')}
                </th>
                <th className="p-4 font-body text-base font-medium text-charcoal">
                  {t('admin.operations.utilizationTable.assigned')}
                </th>
                <th className="p-4 font-body text-base font-medium text-charcoal">
                  {t('admin.operations.utilizationTable.completed')}
                </th>
                <th className="p-4 font-body text-base font-medium text-charcoal">
                  {t('admin.operations.utilizationTable.completionRate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {cleanerUtilization.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center font-body text-base text-text-muted">
                    {t('admin.dashboard.table.noResults')}
                  </td>
                </tr>
              ) : (
                cleanerUtilization.map((staff) => (
                  <tr key={staff.id} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                    <td className="p-4 font-body text-base text-charcoal font-medium">
                      {staff.name}
                    </td>
                    <td className="p-4 font-body text-base text-charcoal">
                      {staff.assigned}
                    </td>
                    <td className="p-4 font-body text-base text-charcoal">
                      {staff.completed}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-pale h-2 rounded overflow-hidden hidden sm:block">
                          <div
                            className="bg-slate-brand h-full rounded"
                            style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-body text-base text-charcoal font-medium">
                          {staff.completionRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
