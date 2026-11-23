#!/usr/bin/env node
/**
 * P3-E41 (ADR-022): Automated Pay-Gate Parity Comparison Script.
 *
 * Compares Payroll hours per cleaner and Invoicing totals per client between the old site
 * (fnc-reports.web.app) and the new site (ops.freshnestco.ca) for a full pay period, asserting
 * exact cent-for-cent ($0.00) and minute-for-minute (0.00 h) parity.
 *
 * Supports exported CSV or JSON files from both UIs and emits a Markdown report table suitable
 * for attaching directly to the P3-E41 Phase C close report.
 *
 * Usage:
 *   node scripts/ops-migration/compare-pay-period.cjs \
 *     --period=2026-11-27 \
 *     --old-payroll=old-payroll.csv --new-payroll=new-payroll.csv \
 *     --old-invoices=old-invoices.csv --new-invoices=new-invoices.csv
 */
'use strict'

const fs = require('node:fs')

/** Parse RFC-4180 CSV text into an array of keyed row objects using the header row. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const clean = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field.trim())
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(field.trim())
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.trim())
    if (row.some((cell) => cell !== '')) rows.push(row)
  }
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((cells) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? ''
    })
    return obj
  })
}

/** Normalize a currency or numeric string (e.g. "$1,234.50", "12.25") into exact integer hundredths (cents / centi-hours). */
function toHundredths(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw * 100)
  const cleaned = String(raw ?? '')
    .replace(/[$,\s]/g, '')
    .trim()
  if (!cleaned) return 0
  const n = Number(cleaned)
  if (!Number.isFinite(n)) throw new Error(`Cannot parse numeric value: ${JSON.stringify(raw)}`)
  return Math.round(n * 100)
}

function formatHundredths(val, isMoney) {
  const sign = val < 0 ? '-' : ''
  const abs = Math.abs(val)
  const whole = Math.floor(abs / 100)
  const frac = String(abs % 100).padStart(2, '0')
  return isMoney ? `${sign}$${whole}.${frac}` : `${sign}${whole}.${frac}`
}

function pickField(row, candidates) {
  const keys = Object.keys(row)
  for (const cand of candidates) {
    const hit = keys.find((k) => k.toLowerCase().trim() === cand.toLowerCase())
    if (hit !== undefined) return row[hit]
  }
  return undefined
}

/** Aggregate CSV/JSON rows into a Map<normalizedKey, { label, valueHundredths }>. */
function aggregateRows(rows, keyFields, valueFields) {
  const map = new Map()
  for (const row of rows) {
    const labelRaw = pickField(row, keyFields)
    const valRaw = pickField(row, valueFields)
    if (labelRaw === undefined || String(labelRaw).trim() === '') continue
    const label = String(labelRaw).trim()
    const key = label.toLowerCase().replace(/\s+/g, ' ')
    const add = toHundredths(valRaw)
    const prev = map.get(key)
    map.set(key, { label: prev?.label ?? label, value: (prev?.value ?? 0) + add })
  }
  return map
}

/** Compare two aggregated maps and return every row plus mismatch count (exact 0 delta required). */
function compareMaps(oldMap, newMap) {
  const keys = [...new Set([...oldMap.keys(), ...newMap.keys()])].sort()
  const diffs = []
  let mismatches = 0
  let oldTotal = 0
  let newTotal = 0

  for (const key of keys) {
    const o = oldMap.get(key)
    const n = newMap.get(key)
    const oldVal = o ? o.value : 0
    const newVal = n ? n.value : 0
    const delta = newVal - oldVal
    const missing = !o ? 'missing_in_old' : !n ? 'missing_in_new' : null
    const ok = delta === 0 && !missing
    if (!ok) mismatches++
    oldTotal += oldVal
    newTotal += newVal
    diffs.push({
      key,
      label: n?.label ?? o?.label ?? key,
      oldVal,
      newVal,
      delta,
      missing,
      ok,
    })
  }

  return { diffs, mismatches, oldTotal, newTotal, totalDelta: newTotal - oldTotal }
}

function formatMarkdownSection(title, result, isMoney) {
  const unit = isMoney ? 'Total' : 'Hours'
  const lines = [
    `### ${title}`,
    '',
    `| Name | Old Site (${unit}) | New Site (${unit}) | Delta | Match |`,
    '| --- | ---: | ---: | ---: | --- |',
  ]
  for (const r of result.diffs) {
    const status = r.ok ? 'PASS' : r.missing ? `FAIL (${r.missing})` : 'FAIL'
    lines.push(
      `| ${r.label} | ${formatHundredths(r.oldVal, isMoney)} | ${formatHundredths(r.newVal, isMoney)} | ${formatHundredths(r.delta, isMoney)} | ${status} |`,
    )
  }
  const totalOk = result.mismatches === 0 && result.totalDelta === 0
  lines.push(
    `| **Total** | **${formatHundredths(result.oldTotal, isMoney)}** | **${formatHundredths(result.newTotal, isMoney)}** | **${formatHundredths(result.totalDelta, isMoney)}** | **${totalOk ? 'PASS' : 'FAIL'}** |`,
  )
  return lines.join('\n')
}

function loadRows(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  if (filePath.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed.rows)) return parsed.rows
    if (Array.isArray(parsed.cleaners)) return parsed.cleaners
    if (Array.isArray(parsed.clients)) return parsed.clients
    throw new Error(`Unsupported JSON shape in ${filePath}`)
  }
  return parseCsv(raw)
}

function parseArgs(argv) {
  const opts = {
    period: 'unspecified',
    oldPayroll: null,
    newPayroll: null,
    oldInvoices: null,
    newInvoices: null,
    out: null,
    help: false,
  }
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') opts.help = true
    else if (arg.startsWith('--period=')) opts.period = arg.slice('--period='.length)
    else if (arg.startsWith('--old-payroll=')) opts.oldPayroll = arg.slice('--old-payroll='.length)
    else if (arg.startsWith('--new-payroll=')) opts.newPayroll = arg.slice('--new-payroll='.length)
    else if (arg.startsWith('--old-invoices=')) opts.oldInvoices = arg.slice('--old-invoices='.length)
    else if (arg.startsWith('--new-invoices=')) opts.newInvoices = arg.slice('--new-invoices='.length)
    else if (arg.startsWith('--out=')) opts.out = arg.slice('--out='.length)
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return opts
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv)
  if (opts.help || (!opts.oldPayroll && !opts.oldInvoices)) {
    console.log(`Usage: node scripts/ops-migration/compare-pay-period.cjs [options]

Options:
  --period=YYYY-MM-DD            Pay period Friday start date (for report heading)
  --old-payroll=<csv|json>       Payroll hours export from fnc-reports.web.app
  --new-payroll=<csv|json>       Payroll hours export from ops.freshnestco.ca
  --old-invoices=<csv|json>      Invoicing totals export from fnc-reports.web.app
  --new-invoices=<csv|json>      Invoicing totals export from ops.freshnestco.ca
  --out=<file.md>                Optional path to write the Markdown parity report
`)
    return
  }

  const sections = [`## P3-E41 Pay Gate Parity Report — Period ${opts.period}`, '']
  let totalMismatches = 0

  if (opts.oldPayroll || opts.newPayroll) {
    if (!opts.oldPayroll || !opts.newPayroll) throw new Error('Both --old-payroll and --new-payroll are required')
    const oldMap = aggregateRows(
      loadRows(opts.oldPayroll),
      ['employee', 'cleaner', 'name', 'staff'],
      ['hours', 'paidHours', 'totalHours', 'paid_hours', 'total'],
    )
    const newMap = aggregateRows(
      loadRows(opts.newPayroll),
      ['employee', 'cleaner', 'name', 'staff'],
      ['hours', 'paidHours', 'totalHours', 'paid_hours', 'total'],
    )
    const res = compareMaps(oldMap, newMap)
    totalMismatches += res.mismatches
    sections.push(formatMarkdownSection('Payroll Hours per Cleaner', res, false), '')
  }

  if (opts.oldInvoices || opts.newInvoices) {
    if (!opts.oldInvoices || !opts.newInvoices) throw new Error('Both --old-invoices and --new-invoices are required')
    const oldMap = aggregateRows(
      loadRows(opts.oldInvoices),
      ['client', 'customer', 'clientName', 'name'],
      ['amount', 'total', 'dollars', 'billableAmount', 'subtotal'],
    )
    const newMap = aggregateRows(
      loadRows(opts.newInvoices),
      ['client', 'customer', 'clientName', 'name'],
      ['amount', 'total', 'dollars', 'billableAmount', 'subtotal'],
    )
    const res = compareMaps(oldMap, newMap)
    totalMismatches += res.mismatches
    sections.push(formatMarkdownSection('Invoicing Totals per Client', res, true), '')
  }

  sections.push(`**Gate Result:** ${totalMismatches === 0 ? 'PASS — exact $0.00 / 0.00 h parity' : `FAIL — ${totalMismatches} discrepancy(ies)`}`)
  const report = sections.join('\n')

  if (opts.out) fs.writeFileSync(opts.out, report + '\n', 'utf8')
  console.log(report)

  if (totalMismatches > 0) process.exitCode = 1
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

module.exports = {
  parseCsv,
  toHundredths,
  formatHundredths,
  aggregateRows,
  compareMaps,
  formatMarkdownSection,
  parseArgs,
}
