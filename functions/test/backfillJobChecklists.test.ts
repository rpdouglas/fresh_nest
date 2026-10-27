import { describe, it, expect } from 'vitest'
import { snapshotTasks as tsSnapshotTasks } from '../src/lib/checklist'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { planBackfill, snapshotTasks, parseArgs } = require('../scripts/backfill-job-checklists.cjs') as {
  planBackfill: (
    jobs: { id: string; status: unknown; checklistTemplate: unknown; hasTasks: boolean }[],
    templates: Map<string, { name?: unknown; tasks?: unknown }>,
  ) => {
    updates: { id: string; fields: { checklistTasks: unknown[]; checklistName: string; checklistSource: string } }[]
    skipped: { id: string; reason: string }[]
  }
  snapshotTasks: (tasks: unknown) => unknown[]
  parseArgs: (argv: string[]) => { apply: boolean; database: string }
}

// P3-E34 backfill: copy checklist tasks onto open jobs created before jobs kept their own copy.

const tasks = [
  { id: 'b', labelEn: 'Vacuum', labelFr: 'Aspirer', icon: '🧹', requiresPhoto: false, photoPhase: null, order: 1 },
  { id: 'a', labelEn: 'Fridge', labelFr: 'Frigo', icon: '🍽️', requiresPhoto: true, photoPhase: 'after', order: 0 },
  { labelEn: 'no id' },
]
const templates = new Map([['tpl-deep', { name: 'Deep Clean', tasks }]])
const job = (id: string, status: string, overrides: Partial<{ checklistTemplate: unknown; hasTasks: boolean }> = {}) =>
  ({ id, status, checklistTemplate: 'tpl-deep', hasTasks: false, ...overrides })

describe('planBackfill', () => {
  it('copies the saved list onto open jobs only', () => {
    const plan = planBackfill(
      [job('j1', 'unassigned'), job('j2', 'assigned'), job('j3', 'in_progress'), job('j4', 'completed'), job('j5', 'cancelled')],
      templates,
    )
    expect(plan.updates.map((u) => u.id)).toEqual(['j1', 'j2', 'j3'])
    expect(plan.updates[0].fields).toEqual({
      checklistTasks: tsSnapshotTasks(tasks),
      checklistName: 'Deep Clean',
      checklistSource: 'auto',
    })
  })

  it('leaves jobs that already have a copy, and reports jobs it cannot fill', () => {
    const plan = planBackfill(
      [job('j1', 'assigned', { hasTasks: true }), job('j2', 'assigned', { checklistTemplate: '' }), job('j3', 'assigned', { checklistTemplate: 'tpl-gone' })],
      templates,
    )
    expect(plan.updates).toEqual([])
    expect(plan.skipped).toEqual([
      { id: 'j2', reason: 'no checklist template' },
      { id: 'j3', reason: 'template tpl-gone not found' },
    ])
  })

  it('copies tasks exactly like new jobs get them', () => {
    expect(snapshotTasks(tasks)).toEqual(tsSnapshotTasks(tasks))
    expect(snapshotTasks(undefined)).toEqual([])
  })
})

describe('parseArgs', () => {
  it('needs a known database and defaults to a dry run', () => {
    expect(parseArgs(['--database=freshnest-dev'])).toEqual({ apply: false, database: 'freshnest-dev' })
    expect(parseArgs(['--database=(default)', '--apply'])).toEqual({ apply: true, database: '(default)' })
    expect(() => parseArgs([])).toThrow(/--database is required/)
    expect(() => parseArgs(['--database=prod'])).toThrow(/--database is required/)
  })
})
