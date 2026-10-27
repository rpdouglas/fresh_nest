import { useTranslation } from 'react-i18next'
import { useChecklistTemplates } from '@/components/admin/hooks/useChecklistTemplates'
import type { Booking, Job } from '@/types'

// P3-E34: one-line description of the checklist a job has (or a pending booking will get).

interface ChecklistSummaryProps {
  job: Job | null
  booking: Pick<Booking, 'frequency' | 'checklistTemplateId'>
}

export function ChecklistSummary({ job, booking }: ChecklistSummaryProps) {
  const { t } = useTranslation()
  const { templates } = useChecklistTemplates(true)
  const templateFor = (id: string | null | undefined) => (id ? templates.find((tpl) => tpl.id === id) : undefined)

  const futureTemplate = templateFor(booking.checklistTemplateId)

  let current: string
  if (job) {
    // Older jobs have no copy of their tasks yet; they show the live saved list.
    const fallback = templateFor(job.checklistTemplate)
    const name = job.checklistName || fallback?.name
    const count = job.checklistTasks?.length ?? fallback?.tasks.length ?? 0
    current = name ? t('admin.checklist.summary', { name, count }) : t('admin.checklist.none')
  } else {
    current = futureTemplate
      ? t('admin.checklist.summary', { name: futureTemplate.name, count: futureTemplate.tasks.length })
      : t('admin.checklist.automaticSummary')
  }

  return (
    <div className="font-body text-base text-charcoal">
      <p>{current}</p>
      {job && booking.frequency !== 'one-time' && futureTemplate && (
        <p className="text-text-muted">{t('admin.checklist.future', { name: futureTemplate.name })}</p>
      )}
    </div>
  )
}
