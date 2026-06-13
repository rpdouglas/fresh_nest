import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { AnalyticsTimeRange } from './hooks/useAdminAnalytics'
import { LEAD_COLORS } from './hooks/useAdminAnalytics'

interface AnalyticsDashboardProps {
  analyticsTimeRange: AnalyticsTimeRange
  setAnalyticsTimeRange: (val: AnalyticsTimeRange) => void
  analyticsTotalBookings: number
  analyticsTotalRevenue: number
  analyticsAvgBookingValue: number
  leadSourceData: Array<{ name: string; value: number; revenue: number; key: string }>
  monthlyTrendData: Array<{ monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }>
  channelsPerformance: Array<{ source: string; name: string; volume: number; revenue: number; avgValue: number; share: number }>
  formatCurrency: (val: number) => string
  referredBookingsCount: number
}

export function AnalyticsDashboard({
  analyticsTimeRange,
  setAnalyticsTimeRange,
  analyticsTotalBookings,
  analyticsTotalRevenue,
  analyticsAvgBookingValue,
  leadSourceData,
  monthlyTrendData,
  channelsPerformance,
  formatCurrency,
  referredBookingsCount,
}: AnalyticsDashboardProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      {/* Time Range Selector */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.dashboard.analytics.title')}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <label htmlFor="analytics-range" className="font-body text-base text-charcoal font-medium whitespace-nowrap">
            {t('admin.dashboard.analytics.rangeLabel')}:
          </label>
          <select
            id="analytics-range"
            value={analyticsTimeRange}
            onChange={(e) => setAnalyticsTimeRange(e.target.value as AnalyticsTimeRange)}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            <option value="all">{t('admin.dashboard.analytics.ranges.all')}</option>
            <option value="30days">{t('admin.dashboard.analytics.ranges.30days')}</option>
            <option value="90days">{t('admin.dashboard.analytics.ranges.90days')}</option>
            <option value="ytd">{t('admin.dashboard.analytics.ranges.ytd')}</option>
            <option value="month">{t('admin.dashboard.analytics.ranges.month')}</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.bookingsCount')}
          </span>
          <span className="font-display text-4xl text-charcoal font-bold">
            {analyticsTotalBookings}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.estimatedRevenue')}
          </span>
          <span className="font-display text-4xl text-slate-brand font-bold">
            {formatCurrency(analyticsTotalRevenue)}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.avgBookingValue')}
          </span>
          <span className="font-display text-4xl text-green-600 font-bold">
            {formatCurrency(analyticsAvgBookingValue)}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-amber-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.referredBookings')}
          </span>
          <span className="font-display text-4xl text-amber-600 font-bold">
            {referredBookingsCount}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Pie Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.dashboard.analytics.charts.leadDistribution')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {leadSourceData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry) => (
                      <Cell key={`cell-${entry.key}`} fill={LEAD_COLORS[entry.key] || '#7a8f96'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: unknown, name: unknown, props: unknown) => {
                      const valStr = String(value)
                      const nameStr = String(name)
                      const payload = (props as { payload?: { revenue?: number } })?.payload
                      const revenue = payload?.revenue || 0
                      return [
                        `${valStr} ${t('admin.dashboard.analytics.charts.bookings').toLowerCase()} (${formatCurrency(revenue)})`,
                        nameStr,
                      ]
                    }}
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

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.dashboard.analytics.charts.monthlyTrend')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {monthlyTrendData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                  <XAxis
                    dataKey="monthName"
                    stroke="#7a8f96"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                    }}
                  />
                  <YAxis
                    stroke="#7a8f96"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value: unknown, name: unknown) => {
                      const val = Number(value)
                      const nm = String(name)
                      if (nm === 'revenue') {
                        return [formatCurrency(val), t('admin.dashboard.analytics.charts.revenue')];
                      }
                      return [val, t('admin.dashboard.analytics.charts.bookings')];
                    }}
                    contentStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '4px',
                      borderColor: '#c4b09a',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#5b7e8f" name="revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Channels Performance Table */}
      <div className="bg-white border border-sand rounded shadow-sm flex flex-col gap-4 p-6">
        <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
          {t('admin.dashboard.analytics.title')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-sand bg-cream">
                <th className="p-4 font-sub text-base text-charcoal font-bold">
                  {t('admin.dashboard.analytics.table.channel')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-center">
                  {t('admin.dashboard.analytics.table.volume')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.revenue')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.avgValue')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.share')}
                </th>
              </tr>
            </thead>
            <tbody>
              {channelsPerformance.map((ch) => (
                <tr key={ch.source} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                  <td className="p-4 font-body text-base text-charcoal font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: LEAD_COLORS[ch.source] || '#7a8f96' }}
                      />
                      {ch.name}
                    </div>
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-center">
                    {ch.volume}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {formatCurrency(ch.revenue)}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {formatCurrency(ch.avgValue)}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {ch.share.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
