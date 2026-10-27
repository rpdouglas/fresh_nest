import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChecklistDialog } from './ChecklistDialog'
import * as store from '@/lib/firebase/firestore'
import { canChangeChecklist } from '@/lib/utils/checklistTasks'
import type { ChecklistTemplate, Job } from '@/types'

// P3-E34 (P12 Lauren): attach a saved or custom checklist to a job.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), getDoc: vi.fn(() => new Promise(() => {})) }))
vi.mock('@freshnest/shared', () => ({ bookingsCollection: vi.fn() }))
vi.mock('@/lib/firebase/firestore', () => ({
  attachJobChecklist: vi.fn(),
  setBookingChecklistTemplate: vi.fn(),
  CHECKLIST_LOCKED: 'checklist-locked',
}))

const task = (id: string, labelEn: string) => ({ id, labelEn, labelFr: `${labelEn} (fr)`, icon: '🧽', requiresPhoto: false, photoPhase: null })
const templates: ChecklistTemplate[] = [
  { id: 'tpl-standard', name: 'Standard Clean', serviceType: 'standard', active: true, tasks: [task('a', 'Dust')] },
  { id: 'tpl-airbnb', name: 'Airbnb Turnover', serviceType: 'airbnb', active: true, tasks: [task('x', 'Restock coffee'), task('y', 'Hot tub cover')] },
  { id: 'tpl-old', name: 'Retired list', serviceType: 'deep', active: false, tasks: [] },
]
const handleCreate = vi.fn(() => Promise.resolve('tpl-new'))
vi.mock('@/components/admin/hooks/useChecklistTemplates', () => ({
  useChecklistTemplates: () => ({ templates, handleCreate }),
}))

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  bookingId: 'bk-1',
  clientName: 'Gallagher',
  clientAddress: '1 Pitt St',
  clientPhone: '6135550100',
  serviceType: 'airbnb',
  scheduledDate: '2026-10-28',
  scheduledStartTime: '11:00',
  scheduledEndTime: '15:00',
  status: 'assigned',
  assignedTo: 'brenda',
  checkedInAt: null,
  checkedInGeo: null,
  completedAt: null,
  payRateSnapshot: { rateId: 'r', amount: 25, currency: 'CAD', effectiveAt: '', snapshotAt: '' },
  checklistTemplate: 'tpl-standard',
  checklistCompletions: [],
  photos: [],
  createdAt: new Date(),
  ...overrides,
})
const weekly = { id: 'bk-1', frequency: 'weekly' as const, serviceType: 'airbnb' as const, checklistTemplateId: null }
const oneTime = { ...weekly, frequency: 'one-time' as const }

const renderDialog = (props: Partial<Parameters<typeof ChecklistDialog>[0]> = {}) => {
  const onSaved = vi.fn()
  const onClose = vi.fn()
  render(<ChecklistDialog open onClose={onClose} onSaved={onSaved} job={job()} booking={oneTime} {...props} />)
  return { onSaved, onClose }
}
const save = () => fireEvent.click(screen.getByRole('button', { name: 'admin.checklist.save' }))

beforeEach(() => vi.clearAllMocks())

describe('ChecklistDialog — saved list', () => {
  it('attaches the chosen saved list to the job (copying its tasks)', async () => {
    const { onSaved, onClose } = renderDialog()
    expect(screen.getByLabelText('admin.checklist.savedLabel')).toHaveValue('tpl-standard')
    // The retired list is not offered.
    expect(screen.queryByRole('option', { name: /Retired list/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('admin.checklist.savedLabel'), { target: { value: 'tpl-airbnb' } })
    expect(screen.getByText('Restock coffee')).toBeInTheDocument()
    save()
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(store.attachJobChecklist).toHaveBeenCalledWith('job-1', {
      templateId: 'tpl-airbnb', name: 'Airbnb Turnover', source: 'template', tasks: templates[1].tasks,
    })
    expect(store.setBookingChecklistTemplate).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps the list for future visits of a recurring booking (P1 Diane)', async () => {
    renderDialog({ booking: weekly })
    fireEvent.change(screen.getByLabelText('admin.checklist.savedLabel'), { target: { value: 'tpl-airbnb' } })
    fireEvent.click(screen.getByLabelText('admin.checklist.useForFuture'))
    save()
    await waitFor(() => expect(store.setBookingChecklistTemplate).toHaveBeenCalledWith('bk-1', 'tpl-airbnb'))
  })

  it('without a job yet, stores the choice on the booking only', async () => {
    renderDialog({ job: null, booking: oneTime })
    expect(screen.getByText('admin.checklist.noJobNote')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('admin.checklist.savedLabel'), { target: { value: 'tpl-airbnb' } })
    save()
    await waitFor(() => expect(store.setBookingChecklistTemplate).toHaveBeenCalledWith('bk-1', 'tpl-airbnb'))
    expect(store.attachJobChecklist).not.toHaveBeenCalled()
  })
})

describe('ChecklistDialog — custom list (P6 Gallagher)', () => {
  const addTask = (index: number, en: string, fr: string) => {
    fireEvent.click(screen.getByRole('button', { name: /admin.templates.form.addTask/ }))
    fireEvent.change(screen.getAllByLabelText('admin.templates.task.labelEn')[index], { target: { value: en } })
    fireEvent.change(screen.getAllByLabelText('admin.templates.task.labelFr')[index], { target: { value: fr } })
  }

  it('builds a one-off list and attaches it to this job only', async () => {
    const { onSaved } = renderDialog()
    fireEvent.click(screen.getByRole('radio', { name: 'admin.checklist.modeCustom' }))
    addTask(0, 'Restock pods', 'Remplir les capsules')
    save()
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(handleCreate).not.toHaveBeenCalled()
    expect(store.attachJobChecklist).toHaveBeenCalledWith('job-1', expect.objectContaining({
      templateId: '', name: 'admin.checklist.customName', source: 'custom',
      tasks: [expect.objectContaining({ labelEn: 'Restock pods', labelFr: 'Remplir les capsules', order: 0 })],
    }))
  })

  it('starts from a saved list and saves the result as a new saved list', async () => {
    renderDialog()
    fireEvent.click(screen.getByRole('radio', { name: 'admin.checklist.modeCustom' }))
    fireEvent.change(screen.getByLabelText('admin.checklist.startFrom'), { target: { value: 'tpl-airbnb' } })
    expect(screen.getAllByLabelText('admin.templates.task.labelEn')).toHaveLength(2)
    fireEvent.click(screen.getByLabelText('admin.checklist.saveAsNew'))
    fireEvent.change(screen.getByLabelText('admin.checklist.newName'), { target: { value: 'Gallagher unit 4' } })
    save()
    await waitFor(() => expect(store.attachJobChecklist).toHaveBeenCalled())
    expect(handleCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gallagher unit 4', serviceType: 'airbnb', active: true }))
    expect(store.attachJobChecklist).toHaveBeenCalledWith('job-1', expect.objectContaining({ templateId: 'tpl-new', source: 'template' }))
  })

  it('refuses tasks without both an EN and an FR name (P11 Brenda reads FR)', async () => {
    renderDialog()
    fireEvent.click(screen.getByRole('radio', { name: 'admin.checklist.modeCustom' }))
    addTask(0, 'Restock pods', '')
    save()
    expect(await screen.findByRole('alert')).toHaveTextContent('admin.checklist.errors.missingLabels')
    expect(store.attachJobChecklist).not.toHaveBeenCalled()
  })

  it('must be saved as a list when used for future visits', () => {
    renderDialog({ booking: weekly })
    fireEvent.click(screen.getByRole('radio', { name: 'admin.checklist.modeCustom' }))
    fireEvent.click(screen.getByLabelText('admin.checklist.useForFuture'))
    expect(screen.getByLabelText('admin.checklist.saveAsNew')).toBeChecked()
    expect(screen.getByLabelText('admin.checklist.saveAsNew')).toBeDisabled()
  })
})

describe('checklist lock once work starts', () => {
  it('only an untouched job that has not started can change its checklist', () => {
    expect(canChangeChecklist(job())).toBe(true)
    expect(canChangeChecklist(job({ status: 'in_progress' }))).toBe(false)
    expect(canChangeChecklist(job({ status: 'completed' }))).toBe(false)
    expect(canChangeChecklist(job({ checklistCompletions: [{ taskId: 'a', completedAt: new Date(), photos: [] }] }))).toBe(false)
  })

  it('shows the reason and no Save button for a started job', () => {
    renderDialog({ job: job({ status: 'in_progress', checklistTasks: [task('a', 'Dust')] }) })
    expect(screen.getByRole('status')).toHaveTextContent('admin.checklist.locked')
    expect(screen.queryByRole('button', { name: 'admin.checklist.save' })).not.toBeInTheDocument()
    expect(screen.getByText('Dust')).toBeInTheDocument()
  })

  it('reports a job that started while the dialog was open', async () => {
    vi.mocked(store.attachJobChecklist).mockRejectedValueOnce(new Error('checklist-locked'))
    renderDialog()
    save()
    expect(await screen.findByRole('alert')).toHaveTextContent('admin.checklist.locked')
  })
})
