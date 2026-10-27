#!/usr/bin/env node
/**
 * P3-E35 migration — rename the legacy `admin` role to `owner`.
 *
 * - Auth custom claims: every user whose claim is `role: 'admin'` gets `role: 'owner'`.
 *   Other claims on the user are kept.
 * - Office allowlist (`admins/{email}`): docs with no `role`, or `role: 'admin'`, get `role: 'owner'`.
 *
 * Dry run by default: prints what would change and writes nothing. Safe to re-run; a second
 * run finds nothing to do. Emails are masked in the output (COMPLIANCE.md: no PII in logs).
 * People must sign out and in again (or wait up to an hour) for a new claim to reach their
 * browser. Since the P3-E35 cleanup, `admin` is no longer accepted: anyone still on it has no
 * office access until this script (or an Owner in Team & roles) makes them an Owner.
 *
 * Usage (from functions/, with Application Default Credentials for freshnest-aa51e):
 *   node scripts/migrate-admin-to-owner.cjs --database=freshnest-dev            # dry run (dev allowlist)
 *   node scripts/migrate-admin-to-owner.cjs --database='(default)'              # dry run, PRODUCTION
 *   node scripts/migrate-admin-to-owner.cjs --database='(default)' --apply      # write, PRODUCTION
 * Auth users are project-wide; --database only picks which allowlist collection is updated.
 */
'use strict'

const PROJECT_ID = 'freshnest-aa51e'
const DATABASES = ['(default)', 'freshnest-dev']

function maskEmail(email) {
  const [local, domain] = String(email || '').trim().split('@')
  return `${(local || '').slice(0, 1).toLowerCase()}***@${(domain || '?').toLowerCase()}`
}

/** Users whose claim must change: `{ uid, email, claims }` → list of `{ uid, email, newClaims }`. */
function planClaims(users) {
  return users
    .filter((u) => u.claims && u.claims.role === 'admin')
    .map((u) => ({ uid: u.uid, email: u.email, newClaims: { ...u.claims, role: 'owner' } }))
}

/** Allowlist docs to update: `{ id, role }` → list of ids. */
function planAllowlist(docs) {
  return docs.filter((d) => d.role === undefined || d.role === null || d.role === 'admin').map((d) => d.id)
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
  const { getAuth } = require('firebase-admin/auth')
  const { getFirestore } = require('firebase-admin/firestore')

  initializeApp({ projectId: PROJECT_ID })
  const auth = getAuth()
  const db = getFirestore(database)
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${PROJECT_ID}, allowlist in ${database}`)

  const users = []
  let pageToken
  do {
    const page = await auth.listUsers(1000, pageToken)
    for (const u of page.users) users.push({ uid: u.uid, email: u.email, claims: u.customClaims || {} })
    pageToken = page.pageToken
  } while (pageToken)

  const allowSnap = await db.collection('admins').get()
  const claimChanges = planClaims(users)
  const allowChanges = planAllowlist(allowSnap.docs.map((d) => ({ id: d.id, role: d.get('role') })))

  console.log(`Scanned ${users.length} users and ${allowSnap.size} allowlist entries.`)
  console.log(`Claims admin → owner: ${claimChanges.length}`)
  for (const c of claimChanges) console.log(`  ${c.uid}  ${maskEmail(c.email)}`)
  console.log(`Allowlist entries → role owner: ${allowChanges.length}`)
  for (const id of allowChanges) console.log(`  ${maskEmail(id)}`)

  if (!apply) {
    console.log(claimChanges.length || allowChanges.length ? 'Nothing written. Re-run with --apply to update.' : 'Nothing to do.')
    return
  }
  for (const c of claimChanges) await auth.setCustomUserClaims(c.uid, c.newClaims)
  for (const id of allowChanges) await db.collection('admins').doc(id).set({ role: 'owner' }, { merge: true })
  console.log(`Updated ${claimChanges.length} claim(s) and ${allowChanges.length} allowlist entr(y/ies). Ask those people to sign out and in again.`)
}

module.exports = { planClaims, planAllowlist, parseArgs, maskEmail }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
}
