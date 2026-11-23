// Smart property notes parser for field intelligence (Sprint 1.5, decision 0025).
// Extracts security badges (Lockbox, Alarm, Door/Gate Codes, Keys) and hazard badges
// (Dogs, Cats, Pets) from Camelo jobSite.note and shift.note.

export type FieldBadgeCategory = 'security' | 'hazard'

export type FieldBadgeKind = 'lockbox' | 'alarm' | 'code' | 'key' | 'dog' | 'cat' | 'pet'

export interface FieldBadge {
  /** The normalized kind of badge. */
  kind: FieldBadgeKind
  /** High-level category: security or hazard. */
  category: FieldBadgeCategory
  /** User-facing display label, e.g. "Lockbox", "Alarm", "Gate Code", "Dog". */
  label: string
  /** Extracted code or specific instruction if detected (e.g. "1234", "#4321", "in crate", "do not let out"). */
  value?: string
  /** The full clause or sentence where the keyword was detected. */
  snippet: string
  /** Where this badge came from: permanent job site note or shift note. */
  source: 'site' | 'shift'
}

export interface FieldAlerts {
  /** All unique parsed badges, security first, then hazards. */
  badges: FieldBadge[]
  /** Whether any security badge (lockbox, alarm, code, key) is present. */
  hasSecurity: boolean
  /** Whether any hazard or pet badge is present. */
  hasHazard: boolean
  /** Whether any pet (dog, cat, pet) is present. */
  hasPets: boolean
  /** Short text summary suitable for compact tags, e.g. "Lockbox: 1234 · Dog · Alarm". */
  summary: string
}

/** Extracts an access code (3 to 8 digits, optionally with # or *). */
function extractCode(clause: string): string | undefined {
  // 1. Explicit code marker: "code 1234", "code: #1234", "code is 1234", ": 1234"
  const explicit = clause.match(/(?:code\s*[:=\s-]*|\bis\s+|:\s*)([#*]?[0-9]{3,8}[#*]?)\b/i)
  if (explicit && explicit[1]) return explicit[1].trim()

  // 2. Standalone digits or prefixed with #/* (e.g. "Lockbox 1234", "LB #5678")
  const standalone = clause.match(/(?:^|[\s,;:])([#*]?[0-9]{3,8}[#*]?)\b/)
  if (standalone && standalone[1]) return standalone[1].trim()

  return undefined
}

/** Extracts code or key details from a clause. */
function extractValue(clause: string, kind: FieldBadgeKind): string | undefined {
  const trimmed = clause.trim()

  switch (kind) {
    case 'lockbox': {
      const code = extractCode(trimmed)
      if (code) return code
      // Location phrase like "on railing", "on porch"
      const locMatch = trimmed.match(/\b(?:on|at|by|in)\s+([^,.;]+)/i)
      if (locMatch) return locMatch[0].trim()
      return undefined
    }
    case 'alarm': {
      if (/\b(?:off|no\s+alarm|disabled|disarmed)\b/i.test(trimmed)) return 'Off'
      return extractCode(trimmed)
    }
    case 'code': {
      return extractCode(trimmed)
    }
    case 'key': {
      // E.g. "under mat", "with concierge", "in mailbox", "on counter"
      const locMatch = trimmed.match(/\b(?:under|with|in|at|on|behind)\s+([^,.;]+)/i)
      if (locMatch) return locMatch[0].trim()
      return undefined
    }
    case 'dog': {
      if (/\b(?:keep\s+(?:back\s+)?door\s+closed|do\s+not\s+let\s+out)\b/i.test(trimmed)) return 'Do not let out'
      if (/\b(?:crate|crated)\b/i.test(trimmed)) return 'In crate'
      if (/\b(?:friendly)\b/i.test(trimmed)) return 'Friendly'
      if (/\b(?:bark|barks|barking)\b/i.test(trimmed)) return 'Barks'
      if (/\b(?:yard|backyard)\b/i.test(trimmed)) return 'In yard'
      const countMatch = trimmed.match(/\b([0-9]+)\s+dogs?\b/i)
      if (countMatch) return `${countMatch[1]} dogs`
      return undefined
    }
    case 'cat': {
      if (/\b(?:do\s+not\s+let\s+out|keep\s+inside)\b/i.test(trimmed)) return 'Do not let out'
      if (/\b(?:indoor|inside)\b/i.test(trimmed)) return 'Indoor'
      if (/\b(?:basement|bedroom)\b/i.test(trimmed)) return 'In room'
      const countMatch = trimmed.match(/\b([0-9]+)\s+cats?\b/i)
      if (countMatch) return `${countMatch[1]} cats`
      return undefined
    }
    case 'pet': {
      if (/\b(?:do\s+not\s+let\s+out)\b/i.test(trimmed)) return 'Do not let out'
      if (/\b(?:friendly)\b/i.test(trimmed)) return 'Friendly'
      return undefined
    }
    default:
      return undefined
  }
}

/** Splits text into sentence or clause segments. */
function splitClauses(text: string): string[] {
  return text
    .split(/[\r\n]+|[.;•*·\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Parses raw note text from a single source into badges. */
export function parseNoteBadges(text: string | null | undefined, source: 'site' | 'shift'): FieldBadge[] {
  if (!text || !text.trim()) return []

  const badges: FieldBadge[] = []
  const clauses = splitClauses(text)

  for (const clause of clauses) {
    const lower = clause.toLowerCase()

    // 1. Lockbox (LB, lockbox, lock box)
    if (/\b(?:lock\s*box|lb)\b/i.test(clause)) {
      badges.push({
        kind: 'lockbox',
        category: 'security',
        label: 'Lockbox',
        value: extractValue(clause, 'lockbox'),
        snippet: clause,
        source,
      })
      continue
    }

    // 2. Alarm
    if (/\b(?:alarm|security\s*system|disarm)\b/i.test(clause)) {
      badges.push({
        kind: 'alarm',
        category: 'security',
        label: 'Alarm',
        value: extractValue(clause, 'alarm'),
        snippet: clause,
        source,
      })
      continue
    }

    // 3. Specific Entry / Gate / Door / Buzzer Codes
    if (/\b(?:gate\s*code|door\s*code|entry\s*code|garage\s*code|keypad|buzzer|buzz\s*code)\b/i.test(clause) || /\bbuzz\s*[:#\s]\s*[0-9]+/i.test(clause)) {
      let label = 'Door Code'
      if (/\bgate\b/i.test(lower)) label = 'Gate Code'
      else if (/\bgarage\b/i.test(lower)) label = 'Garage Code'
      else if (/\bbuzz(?:er)?\b/i.test(lower)) label = 'Buzzer'

      badges.push({
        kind: 'code',
        category: 'security',
        label,
        value: extractValue(clause, 'code'),
        snippet: clause,
        source,
      })
      continue
    }

    // 4. Key / Keys / Fob
    // Word boundaries ensure monkey, turkey, keyboard, whiskey do not match
    if (/\b(?:keys?|keycard|fob)\b/i.test(clause) && !/\b(?:monkey|turkey|donkey|whiskey|keyboard|keyword)\b/i.test(clause)) {
      const isFob = /\bfob\b/i.test(lower)
      badges.push({
        kind: 'key',
        category: 'security',
        label: isFob ? 'Fob' : 'Key',
        value: extractValue(clause, 'key'),
        snippet: clause,
        source,
      })
      continue
    }

    // 5. Dogs
    // Word boundary ensures hotdog does not match
    if (/\b(?:dogs?|pupp(?:y|ies))\b/i.test(clause) && !/\bhotdog\b/i.test(lower)) {
      badges.push({
        kind: 'dog',
        category: 'hazard',
        label: 'Dog',
        value: extractValue(clause, 'dog'),
        snippet: clause,
        source,
      })
      continue
    }

    // 6. Cats
    // Word boundary ensures catch, category, vacation, certificate do not match
    if (/\b(?:cats?|kittens?)\b/i.test(clause)) {
      badges.push({
        kind: 'cat',
        category: 'hazard',
        label: 'Cat',
        value: extractValue(clause, 'cat'),
        snippet: clause,
        source,
      })
      continue
    }

    // 7. General Pets
    // Word boundary ensures carpet, appetite, compete do not match
    if (/\b(?:pets?)\b/i.test(clause)) {
      badges.push({
        kind: 'pet',
        category: 'hazard',
        label: 'Pet',
        value: extractValue(clause, 'pet'),
        snippet: clause,
        source,
      })
      continue
    }
  }

  return badges
}

/** Deduplicates badges across site and shift notes. */
function deduplicateBadges(badges: FieldBadge[]): FieldBadge[] {
  const seen = new Set<string>()
  const result: FieldBadge[] = []

  for (const b of badges) {
    // Unique key: kind + normalized value or snippet
    const valKey = b.value ? b.value.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
    const snipKey = b.snippet.toLowerCase().replace(/\s+/g, ' ').trim()
    const key = valKey ? `${b.kind}:${valKey}` : `${b.kind}:${snipKey}`

    if (!seen.has(key)) {
      seen.add(key)
      result.push(b)
    }
  }

  // Order: security badges first (lockbox, alarm, code, key), then hazards (dog, cat, pet)
  const rank: Record<FieldBadgeKind, number> = {
    lockbox: 1,
    alarm: 2,
    code: 3,
    key: 4,
    dog: 5,
    cat: 6,
    pet: 7,
  }

  return result.sort((a, b) => rank[a.kind] - rank[b.kind] || a.snippet.localeCompare(b.snippet))
}

/** Formats a single badge into display text like "Lockbox: 1234" or "Dog (in crate)". */
export function formatBadgeLabel(badge: FieldBadge): string {
  if (badge.value) {
    if (badge.category === 'hazard') {
      return `${badge.label} (${badge.value})`
    }
    return `${badge.label}: ${badge.value}`
  }
  return badge.label
}

/**
 * Parses site and shift notes for a visit into structured field alerts.
 * Permanent site notes take precedence, and shift notes supplement them.
 */
export function parseFieldAlerts(siteNote?: string | null, shiftNotes?: (string | null | undefined)[]): FieldAlerts {
  const siteBadges = parseNoteBadges(siteNote, 'site')
  const shiftBadges = (shiftNotes ?? []).flatMap((n) => parseNoteBadges(n, 'shift'))

  const badges = deduplicateBadges([...siteBadges, ...shiftBadges])

  const hasSecurity = badges.some((b) => b.category === 'security')
  const hasHazard = badges.some((b) => b.category === 'hazard')
  const hasPets = badges.some((b) => b.kind === 'dog' || b.kind === 'cat' || b.kind === 'pet')

  const summary = badges.map(formatBadgeLabel).join(' · ')

  return {
    badges,
    hasSecurity,
    hasHazard,
    hasPets,
    summary,
  }
}

/** Formats alerts for plain-text exports (e.g. Google Docs). */
export function formatFieldAlertsExport(alerts: FieldAlerts): string {
  if (!alerts.badges.length) return ''
  return alerts.badges.map((b) => `[${formatBadgeLabel(b)}]`).join(' ')
}
