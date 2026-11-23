import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const copyScript = require('./copy-schedule-collections.cjs')
const compareScript = require('./compare-pay-period.cjs')

test('copy-schedule-collections lists all 11 schema §17 schedule* collections', () => {
  assert.deepEqual([...copyScript.OPS_COLLECTIONS].sort(), [
    'scheduleChangeLog',
    'scheduleCleanerTokens',
    'scheduleClientRates',
    'scheduleFeedback',
    'scheduleInvoiced',
    'scheduleLiveHandled',
    'schedulePlaces',
    'scheduleSettings',
    'scheduleSnapshots',
    'scheduleSoloOk',
    'scheduleVisitPhotos',
  ])
})

test('copy-schedule-collections parseArgs defaults safely to dry-run on freshnest-dev', () => {
  const defaults = copyScript.parseArgs([])
  assert.equal(defaults.apply, false)
  assert.equal(defaults.sourceProject, 'lilypad-strategy-design')
  assert.equal(defaults.sourceDb, '(default)')
  assert.equal(defaults.targetProject, 'freshnest-aa51e')
  assert.equal(defaults.targetDb, 'freshnest-dev')
  assert.equal(defaults.collections.length, 11)

  const prod = copyScript.parseArgs(['--apply', '--target-db=(default)', '--collections=scheduleClientRates,scheduleInvoiced'])
  assert.equal(prod.apply, true)
  assert.equal(prod.targetDb, '(default)')
  assert.deepEqual(prod.collections, ['scheduleClientRates', 'scheduleInvoiced'])

  assert.throws(() => copyScript.parseArgs(['--collections=bookings']), /Unknown ops collection/)
  assert.throws(
    () => copyScript.parseArgs(['--source-project=freshnest-aa51e', '--target-project=freshnest-aa51e', '--target-db=(default)']),
    /cannot be identical/,
  )
})

test('copy-schedule-collections chunkArray and summarizeCounts detect mismatches', () => {
  assert.equal(copyScript.chunkArray([], 400).length, 0)
  assert.equal(copyScript.chunkArray(new Array(401).fill(1), 400).length, 2)
  assert.equal(copyScript.chunkArray(new Array(401).fill(1), 400)[1].length, 1)

  const ok = copyScript.summarizeCounts([{ collection: 'scheduleSettings', source: 1, targetBefore: 0, targetAfter: 1 }], true)
  assert.equal(ok.mismatches, 0)
  assert.match(ok.table, /\| scheduleSettings \| 1 \| 0 \| 1 \| OK \|/)

  const bad = copyScript.summarizeCounts([{ collection: 'scheduleInvoiced', source: 12, targetBefore: 0, targetAfter: 11 }], true)
  assert.equal(bad.mismatches, 1)
  assert.match(bad.table, /MISMATCH/)
})

test('compare-pay-period parses CSV currency/hours and passes only on exact $0.00 / 0.00 h parity', () => {
  const oldCsv = 'Client,Amount\n"Smith, Jane","$1,234.50"\n"Maple Court","$225.00"\n'
  const newCsvExact = 'Client,Amount\n"Maple Court","$225.00"\n"Smith, Jane","$1,234.50"\n'
  const newCsvOffByOneCent = 'Client,Amount\n"Maple Court","$225.01"\n"Smith, Jane","$1,234.50"\n'

  const oldMap = compareScript.aggregateRows(compareScript.parseCsv(oldCsv), ['client'], ['amount'])
  const exactMap = compareScript.aggregateRows(compareScript.parseCsv(newCsvExact), ['client'], ['amount'])
  const offMap = compareScript.aggregateRows(compareScript.parseCsv(newCsvOffByOneCent), ['client'], ['amount'])

  const passRes = compareScript.compareMaps(oldMap, exactMap)
  assert.equal(passRes.mismatches, 0)
  assert.equal(passRes.totalDelta, 0)
  assert.equal(passRes.oldTotal, 145950)
  const md = compareScript.formatMarkdownSection('Invoicing Totals per Client', passRes, true)
  assert.match(md, /\|\s*\*\*Total\*\*\s*\|\s*\*\*\$1459\.50\*\*\s*\|\s*\*\*\$1459\.50\*\*\s*\|\s*\*\*\$0\.00\*\*\s*\|\s*\*\*PASS\*\*\s*\|/)

  const failRes = compareScript.compareMaps(oldMap, offMap)
  assert.equal(failRes.mismatches, 1)
  assert.equal(failRes.totalDelta, 1)
})
