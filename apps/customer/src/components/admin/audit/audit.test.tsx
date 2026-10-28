import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TFunction } from 'i18next'
import type { AuditEntry } from '@/types'

// P3-E37 PR 2: History sections and the Audit Logs tab.

const t = ((key: string, opts?: Record<string, unknown>) => {
  if (typeof opts?.name === 'string') return `${key}:${opts.name}`
  if (typeof opts?.count === 'number') return `${key}:${opts.count}`
  return key
}) as unknown as TFunction
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t, i18n: { language: 'en' } }) }))
vi.mock('@/lib/firebase/firebase', () => ({ db: {} }))
vi.mock('@freshnest/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@freshnest/shared')>()),
  auditLogCollection: () => ({ name: 'auditLog' }),
}))

const queries: { where: unknown[][] }[] = []
const getDocsMock = vi.fn()
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  query: (_col: unknown, ...clauses: { where?: unknown[] }[]) => {
    const q = { where: clauses.filter((c) => c.where).map((c) => c.where!) }
    queries.push(q)
    return q
  },
  where: (...args: unknown[]) => ({ where: args }),
  orderBy: () => ({}),
  limit: () => ({}),
  getDocs: (q: unknown) => getDocsMock(q) as unknown,
}))

let mockLogs: AuditEntry[] = []
vi.mock('../hooks/useAuditLogs', () => ({ useAuditLogs: () => ({ logs: mockLogs, isLoading: false, error: null }) }))

const { entryChanges, actorLabel, formatAuditValue, matchesSearch } = await import('./auditDisplay')
const { AuditEntryView } = await import('./AuditEntryView')
const { RecordHistory } = await import('./RecordHistory')
const { AuditLogsTable } = await import('../AuditLogsTable')

const entry = (over: Partial<AuditEntry>): AuditEntry => ({
  id: 'e1', collection: 'bookings', documentId: 'b1', field: 'preferredDate', oldValue: null, newValue: null,
  changedBy: 'lauren@x.ca', changedAt: new Date('2026-10-28T14:00:00'), reason: null, overrideType: null,
  action: 'update', actor: 'lauren@x.ca', source: 'admin', recordLabel: 'Margaret Storey · 2026-11-05',
  changes: [{ field: 'preferredDate', before: '2026-11-03', after: '2026-11-05' }],
  ...over,
})

describe('auditDisplay', () => {
  it('reads both the new entry shape and old one-field rows', () => {
    expect(entryChanges(entry({}))).toEqual([{ field: 'preferredDate', before: '2026-11-03', after: '2026-11-05' }])
    expect(entryChanges(entry({ changes: undefined, field: 'status', oldValue: 'a', newValue: 'b' })))
      .toEqual([{ field: 'status', before: 'a', after: 'b' }])
  })

  it('names unknown, public and system actors in plain words', () => {
    expect(actorLabel('system:unknown', t)).toBe('admin.audit.actor.unknown')
    expect(actorLabel('public', t)).toBe('admin.audit.actor.public')
    expect(actorLabel('system:onDailyRecurringRenewal', t)).toBe('admin.audit.actor.system:onDailyRecurringRenewal')
    expect(actorLabel('lauren@x.ca', t)).toBe('lauren@x.ca')
  })

  it('formats values: empty, yes/no, dates, lists, oversized', () => {
    expect(formatAuditValue(null, t, 'en')).toBe('admin.audit.values.empty')
    expect(formatAuditValue(true, t, 'en')).toBe('admin.audit.values.yes')
    expect(formatAuditValue({ toDate: () => new Date('2026-10-28T14:00:00') }, t, 'en')).toContain('2026')
    expect(formatAuditValue(['deep', 'oven'], t, 'en')).toBe('deep, oven')
    expect(formatAuditValue([{ a: 1 }, { b: 2 }], t, 'en')).toBe('admin.audit.values.items:2')
    expect(formatAuditValue({ truncated: true }, t, 'en')).toBe('admin.audit.values.truncated')
  })

  it('search covers person, client label, record ID, reason and field', () => {
    const e = entry({ reason: 'Client asked' })
    for (const q of ['LAUREN', 'storey', 'b1', 'client asked', 'preferreddate']) expect(matchesSearch(e, q)).toBe(true)
    expect(matchesSearch(e, 'brenda')).toBe(false)
  })
})

describe('AuditEntryView', () => {
  it('shows who, from which app, each field old → new, the reason and override type', () => {
    render(<AuditEntryView entry={entry({ reason: 'Short drive', overrideType: 'travel_conflict_exceeded' })} showRecord />)
    expect(screen.getByText('admin.audit.actions.update')).toBeInTheDocument()
    expect(screen.getByText(/Margaret Storey · 2026-11-05/)).toBeInTheDocument()
    expect(screen.getByText('lauren@x.ca')).toBeInTheDocument()
    expect(screen.getByText('· admin.audit.sources.admin', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('admin.audit.fields.preferredDate')).toBeInTheDocument()
    expect(screen.getByText('2026-11-03')).toHaveClass('line-through')
    expect(screen.getByText('2026-11-05')).toBeInTheDocument()
    expect(screen.getByText('Short drive')).toBeInTheDocument()
    expect(screen.getByText('admin.audit.types.travel_conflict_exceeded')).toBeInTheDocument()
  })

  it('a delete keeps the record as it was; nested field names use the flattened label key', () => {
    render(<AuditEntryView entry={entry({ action: 'delete', changes: [], field: '(deleted)', snapshot: { captionEn: 'Kitchen' } })} />)
    expect(screen.getByText('admin.audit.snapshot')).toBeInTheDocument()
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    render(<AuditEntryView entry={entry({ changes: [{ field: 'financials.monthlyEarningsLimit', before: 1000, after: 1200 }] })} />)
    expect(screen.getByText('admin.audit.fields.financials_monthlyEarningsLimit')).toBeInTheDocument()
  })
})

describe('RecordHistory', () => {
  beforeEach(() => {
    queries.length = 0
    getDocsMock.mockReset()
  })

  it('loads only when opened, merges the booking and its visit newest first', async () => {
    const snap = (entries: AuditEntry[]) => ({ size: entries.length, docs: entries.map((e) => ({ data: () => e })) })
    getDocsMock
      .mockResolvedValueOnce(snap([entry({ id: 'b-old', changedAt: new Date('2026-10-01T09:00:00') })]))
      .mockResolvedValueOnce(snap([entry({ id: 'j-new', collection: 'jobs', documentId: 'j1', changedAt: new Date('2026-10-20T09:00:00'),
        changes: [{ field: 'status', before: 'assigned', after: 'completed' }] })]))
    render(<RecordHistory records={[{ collection: 'bookings', id: 'b1' }, { collection: 'jobs', id: 'j1' }]} />)
    expect(getDocsMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'admin.audit.history.show' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    expect(queries.map((q) => q.where)).toEqual([
      [['collection', '==', 'bookings'], ['documentId', '==', 'b1']],
      [['collection', '==', 'jobs'], ['documentId', '==', 'j1']],
    ])
    const [first, second] = screen.getAllByRole('article')
    expect(within(first).getByText('completed')).toBeInTheDocument()
    expect(within(second).getByText('2026-11-05')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'admin.audit.history.hide' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('says so plainly when nothing has been recorded or loading fails', async () => {
    getDocsMock.mockResolvedValueOnce({ size: 0, docs: [] })
    render(<RecordHistory records={[{ collection: 'staff', id: 's1' }]} defaultOpen />)
    expect(await screen.findByText('admin.audit.history.empty')).toBeInTheDocument()
  })
})

describe('Audit Logs tab filters', () => {
  beforeEach(() => {
    mockLogs = [
      entry({ id: '1' }),
      entry({ id: '2', collection: 'jobs', documentId: 'j1', actor: 'brenda@x.ca', changedBy: 'brenda@x.ca', source: 'staff_app',
        recordLabel: 'Diane Lafleur · 2026-10-02', changedAt: new Date('2026-10-02T10:00:00'),
        changes: [{ field: 'status', before: 'assigned', after: 'in_progress' }] }),
      entry({ id: '3', changes: undefined, action: undefined, actor: undefined, source: undefined, recordLabel: undefined,
        field: 'assignedTo', oldValue: null, newValue: 'carla', changedBy: 'old-admin@x.ca', overrideType: 'travel_conflict_exceeded',
        changedAt: new Date('2026-09-01T10:00:00') }),
    ]
  })

  it('lists every entry, then narrows by person, app, date range and search; Clear resets', () => {
    render(<AuditLogsTable isAuthorized />)
    expect(screen.getAllByRole('article')).toHaveLength(3)

    fireEvent.change(screen.getByLabelText('admin.audit.filters.person'), { target: { value: 'brenda@x.ca' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'admin.audit.filters.clear' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)

    fireEvent.change(screen.getByLabelText('admin.audit.filters.source'), { target: { value: 'admin' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'admin.audit.filters.clear' }))

    fireEvent.change(screen.getByLabelText('admin.audit.filters.from'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('admin.audit.filters.to'), { target: { value: '2026-10-15' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'admin.audit.filters.clear' }))

    fireEvent.change(screen.getByLabelText('admin.audit.filters.searchLabel'), { target: { value: 'j1' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('old one-field rows still show, and the override filter still finds them', () => {
    render(<AuditLogsTable isAuthorized />)
    fireEvent.change(screen.getByLabelText('admin.audit.filters.overrideType'), { target: { value: 'travel_conflict_exceeded' } })
    const [row] = screen.getAllByRole('article')
    expect(within(row).getByText('old-admin@x.ca')).toBeInTheDocument()
    expect(within(row).getByText('carla')).toBeInTheDocument()
  })
})
