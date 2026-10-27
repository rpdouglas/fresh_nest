import { describe, it, expect } from 'vitest'
import { snapshotTasks, snapshotFromTemplate } from '../src/lib/checklist'
import { resolveChecklist } from '../src/jobs'

// P3-E34 (P12 Lauren, P11 Brenda): jobs keep their own copy of the checklist.

const task = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  labelEn: `Task ${id}`,
  labelFr: `Tâche ${id}`,
  icon: '🧽',
  requiresPhoto: false,
  photoPhase: null,
  ...overrides,
})

type Doc = { id: string; data: Record<string, unknown> }

// Minimal stand-in for the Firestore calls resolveChecklist makes.
function fakeDb(templates: Doc[]) {
  const query = (filters: Array<[string, unknown]>) => ({
    where: (field: string, _op: string, value: unknown) => query([...filters, [field, value]]),
    limit: () => query(filters),
    get: async () => {
      const docs = templates
        .filter((t) => filters.every(([f, v]) => t.data[f] === v))
        .map((t) => ({ id: t.id, data: () => t.data }))
      return { empty: docs.length === 0, docs }
    },
  })
  return {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => {
          const found = templates.find((t) => t.id === id)
          return { id, exists: Boolean(found), data: () => found?.data }
        },
      }),
      where: (field: string, op: string, value: unknown) => query([]).where(field, op, value),
    }),
  } as unknown as FirebaseFirestore.Firestore
}

const standard: Doc = {
  id: 'tpl-standard',
  data: { name: 'Standard Clean', serviceType: 'standard', active: true, tasks: [task('a'), task('b')] },
}
const airbnb: Doc = {
  id: 'tpl-airbnb',
  data: { name: 'Airbnb Turnover', serviceType: 'airbnb', active: true, tasks: [task('x', { requiresPhoto: true, photoPhase: 'after' })] },
}

describe('snapshotTasks', () => {
  it('keeps display order, both languages, the icon and photo rules', () => {
    const tasks = snapshotTasks([task('b', { order: 2 }), task('a', { order: 1, requiresPhoto: true, photoPhase: 'before' })])
    expect(tasks.map((t) => t.id)).toEqual(['a', 'b'])
    expect(tasks[0]).toEqual({ id: 'a', labelEn: 'Task a', labelFr: 'Tâche a', icon: '🧽', requiresPhoto: true, photoPhase: 'before' })
  })

  it('drops tasks without an id and tolerates a missing task array', () => {
    expect(snapshotTasks([task(''), { labelEn: 'no id' }, task('c')]).map((t) => t.id)).toEqual(['c'])
    expect(snapshotTasks(undefined)).toEqual([])
  })

  it('is a copy: changing the template afterwards does not change the snapshot', () => {
    const template = { name: 'Standard Clean', tasks: [task('a')] }
    const snap = snapshotFromTemplate('tpl', template, 'template')
    template.tasks[0].labelEn = 'Edited later'
    template.tasks.push(task('new'))
    expect(snap.checklistTasks).toEqual([snapshotTasks([task('a')])[0]])
  })
})

describe('resolveChecklist', () => {
  it("uses the booking's chosen saved list (P1 Diane's recurring visits)", async () => {
    const snap = await resolveChecklist(fakeDb([standard, airbnb]), 'standard', 'tpl-airbnb')
    expect(snap).toMatchObject({ checklistTemplate: 'tpl-airbnb', checklistName: 'Airbnb Turnover', checklistSource: 'template' })
    expect(snap.checklistTasks[0]).toMatchObject({ id: 'x', requiresPhoto: true, photoPhase: 'after' })
  })

  it('matches by service type when nothing was chosen, or the chosen list was deleted', async () => {
    for (const chosen of [null, 'tpl-deleted']) {
      const snap = await resolveChecklist(fakeDb([standard, airbnb]), 'standard', chosen)
      expect(snap).toMatchObject({ checklistTemplate: 'tpl-standard', checklistSource: 'auto' })
      expect(snap.checklistTasks.map((t) => t.id)).toEqual(['a', 'b'])
    }
  })

  it('falls back to any active list, then to an empty checklist', async () => {
    expect((await resolveChecklist(fakeDb([airbnb]), 'deep', null)).checklistTemplate).toBe('tpl-airbnb')
    expect(await resolveChecklist(fakeDb([]), 'deep', null)).toEqual({
      checklistTemplate: '', checklistName: '', checklistSource: 'auto', checklistTasks: [],
    })
  })
})
