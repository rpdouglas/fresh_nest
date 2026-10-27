#!/usr/bin/env node
/**
 * P3-E34 backfill — copy checklist tasks onto open jobs created before job checklists were
 * copied.
 *
 * Older jobs only store `checklistTemplate` (a saved-list ID), and the cleaner app reads that
 * saved list live, so editing the list changes those jobs. This copies the list's current tasks
 * onto each open job (`checklistTasks`, `checklistName`, `checklistSource: 'auto'`), the same
 * way new jobs get them.
 *
 * - Open jobs only: `completed` and `cancelled` jobs are left as they are (human decision
 *   2026-10-27). Today's list may not be what the cleaner saw on those.
 * - Jobs that already have `checklistTasks`, have no template ID, or whose template no longer
 *   exists are skipped.
 * - Dry run by default: it prints what would change and writes nothing.
 * - Each write is conditional on the job not having changed since it was read, so a job edited
 *   mid-run is skipped, not overwritten. Safe to re-run.
 * - Updating these fields sends no messages, and no client details are printed (COMPLIANCE.md).
 *
 * Usage (from functions/, with Application Default Credentials for freshnest-aa51e):
 *   node scripts/backfill-job-checklists.cjs --database=freshnest-dev            # dry run, dev
 *   node scripts/backfill-job-checklists.cjs --database=freshnest-dev --apply    # write, dev
 *   node scripts/backfill-job-checklists.cjs --database='(default)'              # dry run, PRODUCTION
 *   node scripts/backfill-job-checklists.cjs --database='(default)' --apply      # write, PRODUCTION
 *
 * Running against production with --apply is a live data change: get human approval first.
 */
'use strict'

const PROJECT_ID = 'freshnest-aa51e'
const DATABASES = ['(default)', 'freshnest-dev']
const CLOSED_STATUSES = ['completed', 'cancelled']
const BATCH_SIZE = 400

/** Same copy rules as functions/src/lib/checklist.ts snapshotTasks (tested for parity). */
function snapshotTasks(tasks) {
  if (!Array.isArray(tasks)) return []
  return tasks
    .map((task, index) => ({ task: task || {}, index }))
    .sort((a, b) => {
      const ao = typeof a.task.order === 'number' ? a.task.order : a.index
      const bo = typeof b.task.order === 'number' ? b.task.order : b.index
      return ao - bo
    })
    .filter(({ task }) => typeof task.id === 'string' && task.id !== '')
    .map(({ task }) => ({
      id: task.id,
      labelEn: typeof task.labelEn === 'string' ? task.labelEn : '',
      labelFr: typeof task.labelFr === 'string' ? task.labelFr : '',
      icon: typeof task.icon === 'string' ? task.icon : '✅',
      requiresPhoto: task.requiresPhoto === true,
      photoPhase: task.photoPhase === 'before' || task.photoPhase === 'after' ? task.photoPhase : null,
    }))
}

/**
 * Works out which jobs get a copy of their checklist.
 * @param {{ id: string, status: unknown, checklistTemplate: unknown, hasTasks: boolean }[]} jobs
 * @param {Map<string, { name?: unknown, tasks?: unknown }>} templates
 */
function planBackfill(jobs, templates) {
  const updates = []
  const skipped = []
  for (const job of jobs) {
    if (CLOSED_STATUSES.includes(job.status)) continue
    if (job.hasTasks) continue
    if (typeof job.checklistTemplate !== 'string' || job.checklistTemplate === '') {
      skipped.push({ id: job.id, reason: 'no checklist template' })
      continue
    }
    const template = templates.get(job.checklistTemplate)
    if (!template) {
      skipped.push({ id: job.id, reason: `template ${job.checklistTemplate} not found` })
      continue
    }
    updates.push({
      id: job.id,
      fields: {
        checklistTasks: snapshotTasks(template.tasks),
        checklistName: typeof template.name === 'string' ? template.name : '',
        checklistSource: 'auto',
      },
    })
  }
  return { updates, skipped }
}

function parseArgs(argv) {
  const args = { apply: false, database: null }
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true
    else if (arg.startsWith('--database=')) args.database = arg.slice('--database='.length)
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!DATABASES.includes(args.database)) {
    throw new Error(`--database is required: one of ${DATABASES.map((d) => `'${d}'`).join(', ')}`)
  }
  return args
}

async function main() {
  const { apply, database } = parseArgs(process.argv.slice(2))
  const { initializeApp } = require('firebase-admin/app')
  const { getFirestore } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore(database)
  const target = `${PROJECT_ID} / ${database}${process.env.FIRESTORE_EMULATOR_HOST ? ` (emulator ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — jobs in ${target}`)

  const [jobsSnap, templatesSnap] = await Promise.all([
    db.collection('jobs').select('status', 'checklistTemplate', 'checklistTasks').get(),
    db.collection('checklistTemplates').get(),
  ])
  const byId = new Map(jobsSnap.docs.map((d) => [d.id, d]))
  const templates = new Map(templatesSnap.docs.map((d) => [d.id, d.data()]))
  const plan = planBackfill(
    jobsSnap.docs.map((d) => ({
      id: d.id,
      status: d.get('status'),
      checklistTemplate: d.get('checklistTemplate'),
      hasTasks: Array.isArray(d.get('checklistTasks')),
    })),
    templates,
  )

  console.log(`Scanned ${jobsSnap.size} jobs: ${plan.updates.length} to update, ${plan.skipped.length} skipped.`)
  for (const u of plan.updates) console.log(`  ${u.id}  ${u.fields.checklistName || '(unnamed list)'}, ${u.fields.checklistTasks.length} task(s)`)
  for (const s of plan.skipped) console.log(`  skip ${s.id}: ${s.reason}`)

  if (!apply) {
    console.log(plan.updates.length ? 'Nothing written. Re-run with --apply to update.' : 'Nothing to do.')
    return
  }

  let written = 0
  let conflicts = 0
  for (let i = 0; i < plan.updates.length; i += BATCH_SIZE) {
    const chunk = plan.updates.slice(i, i + BATCH_SIZE)
    // Per-document writes with a precondition: if one job changed since it was read, only that
    // one fails; a batch would fail the whole chunk.
    const results = await Promise.allSettled(
      chunk.map((u) => byId.get(u.id).ref.update(u.fields, { lastUpdateTime: byId.get(u.id).updateTime })),
    )
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') written++
      else {
        conflicts++
        console.log(`  not updated ${chunk[j].id}: ${r.reason && r.reason.message ? r.reason.message.split('\n')[0] : r.reason}`)
      }
    })
  }
  console.log(`Updated ${written} job(s). ${conflicts ? `${conflicts} not updated (changed during the run, re-run to retry).` : ''}`)
  if (conflicts) process.exitCode = 1
}

module.exports = { snapshotTasks, planBackfill, parseArgs }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
