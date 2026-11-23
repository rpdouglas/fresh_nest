import { describe, expect, it } from 'vitest'
import {
  formatBadgeLabel,
  formatFieldAlertsExport,
  parseFieldAlerts,
  parseNoteBadges,
} from './fieldNotes'

describe('parseNoteBadges', () => {
  describe('lockbox parsing', () => {
    it('detects lockbox and extracts code', () => {
      const badges = parseNoteBadges('Lockbox code: 1234 on porch railing', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'lockbox',
        category: 'security',
        label: 'Lockbox',
        value: '1234',
        source: 'site',
      })
    })

    it('detects LB shorthand with hash code', () => {
      const badges = parseNoteBadges('LB #5678 by back door', 'shift')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'lockbox',
        category: 'security',
        label: 'Lockbox',
        value: '#5678',
        source: 'shift',
      })
    })

    it('extracts location when no code is present', () => {
      const badges = parseNoteBadges('Lock box on side door handle', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'lockbox',
        value: 'on side door handle',
      })
    })
  })

  describe('alarm parsing', () => {
    it('extracts alarm code', () => {
      const badges = parseNoteBadges('Alarm code is 9876. Enter via kitchen.', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'alarm',
        category: 'security',
        label: 'Alarm',
        value: '9876',
      })
    })

    it('detects disarmed / off alarm', () => {
      const badges = parseNoteBadges('Alarm is off today', 'shift')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'alarm',
        value: 'Off',
      })
    })
  })

  describe('entry, gate, buzzer, and door codes', () => {
    it('extracts gate code', () => {
      const badges = parseNoteBadges('Gate code #4455 at driveway', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'code',
        category: 'security',
        label: 'Gate Code',
        value: '#4455',
      })
    })

    it('extracts buzzer number', () => {
      const badges = parseNoteBadges('Buzzer: 204 for entry', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'code',
        label: 'Buzzer',
        value: '204',
      })
    })

    it('extracts door code', () => {
      const badges = parseNoteBadges('Door code 8899 on keypad', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'code',
        label: 'Door Code',
        value: '8899',
      })
    })

    it('extracts garage code', () => {
      const badges = parseNoteBadges('Garage code 1122 for side entrance', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'code',
        label: 'Garage Code',
        value: '1122',
      })
    })
  })

  describe('keys and fobs', () => {
    it('extracts key location', () => {
      const badges = parseNoteBadges('Key under doormat outside front entrance', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'key',
        category: 'security',
        label: 'Key',
        value: 'under doormat outside front entrance',
      })
    })

    it('detects keys with concierge', () => {
      const badges = parseNoteBadges('Keys with concierge in lobby', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'key',
        label: 'Key',
        value: 'with concierge in lobby',
      })
    })

    it('detects elevator fob', () => {
      const badges = parseNoteBadges('Fob on kitchen counter for parking', 'shift')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'key',
        label: 'Fob',
        value: 'on kitchen counter for parking',
      })
    })
  })

  describe('pet alerts', () => {
    it('detects dogs in crate', () => {
      const badges = parseNoteBadges('Friendly dog in crate in living room', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'dog',
        category: 'hazard',
        label: 'Dog',
        value: 'In crate',
      })
    })

    it('detects barking dog precaution', () => {
      const badges = parseNoteBadges('Dog barks when doorbell rings', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'dog',
        value: 'Barks',
      })
    })

    it('detects indoor cats do not let out', () => {
      const badges = parseNoteBadges('Indoor cat - do not let out under any circumstances', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'cat',
        category: 'hazard',
        label: 'Cat',
        value: 'Do not let out',
      })
    })

    it('detects general pet precaution when specific animal not named', () => {
      const badges = parseNoteBadges('Friendly pets on premises', 'site')
      expect(badges).toHaveLength(1)
      expect(badges[0]).toMatchObject({
        kind: 'pet',
        category: 'hazard',
        label: 'Pet',
        value: 'Friendly',
      })
    })
  })

  describe('false positive avoidance', () => {
    it('does not trigger key for monkey, turkey, whiskey, or keyboard', () => {
      expect(parseNoteBadges('Monkey bread in kitchen. Turkey roast in oven.', 'site')).toHaveLength(0)
      expect(parseNoteBadges('Do not move whiskey glasses. Wipe keyboard gently.', 'site')).toHaveLength(0)
    })

    it('does not trigger cat for catch, category, vacation, or certificate', () => {
      expect(parseNoteBadges('Catch the leaking pipe under sink.', 'site')).toHaveLength(0)
      expect(parseNoteBadges('Vacation rental category A property certificate.', 'site')).toHaveLength(0)
    })

    it('does not trigger pet for carpet, appetite, or compete', () => {
      expect(parseNoteBadges('Steam carpet thoroughly. Clean appetite stains.', 'site')).toHaveLength(0)
    })

    it('does not trigger dog for hotdog', () => {
      expect(parseNoteBadges('Discard empty hotdog wrappers in trash.', 'site')).toHaveLength(0)
    })
  })
})

describe('parseFieldAlerts', () => {
  it('combines site and shift notes and deduplicates identical codes', () => {
    const siteNote = 'Lockbox code: 4321 on porch. Alarm code: 8888. Two indoor cats.'
    const shiftNotes = ['Lockbox 4321. Dog in crate today.']

    const alerts = parseFieldAlerts(siteNote, shiftNotes)

    expect(alerts.hasSecurity).toBe(true)
    expect(alerts.hasHazard).toBe(true)
    expect(alerts.hasPets).toBe(true)

    // Should deduplicate Lockbox 4321
    const lockboxes = alerts.badges.filter((b) => b.kind === 'lockbox')
    expect(lockboxes).toHaveLength(1)
    expect(lockboxes[0].value).toBe('4321')

    // Should have alarm, cat, dog
    expect(alerts.badges.map((b) => b.kind)).toEqual(['lockbox', 'alarm', 'dog', 'cat'])
    expect(alerts.summary).toBe('Lockbox: 4321 · Alarm: 8888 · Dog (In crate) · Cat (Indoor)')
  })

  it('handles null, undefined, or empty notes gracefully', () => {
    const alerts = parseFieldAlerts(null, [undefined, '   ', ''])
    expect(alerts.badges).toHaveLength(0)
    expect(alerts.hasSecurity).toBe(false)
    expect(alerts.hasHazard).toBe(false)
    expect(alerts.hasPets).toBe(false)
    expect(alerts.summary).toBe('')
    expect(formatFieldAlertsExport(alerts)).toBe('')
  })

  it('formats plain text export tags correctly', () => {
    const alerts = parseFieldAlerts('Gate code #1234. Dog in yard.')
    expect(formatFieldAlertsExport(alerts)).toBe('[Gate Code: #1234] [Dog (In yard)]')
  })

  it('parses multi-line bulleted notes with multiple instructions', () => {
    const note = `
      • Lockbox: 4433 on back deck
      • Alarm code 1212 (disarm within 45s)
      • Keys on kitchen island
      • 2 dogs in basement - keep door closed!
      • Indoor cat
    `
    const alerts = parseFieldAlerts(note)
    expect(alerts.badges).toHaveLength(5)
    expect(alerts.hasSecurity).toBe(true)
    expect(alerts.hasHazard).toBe(true)
    expect(alerts.hasPets).toBe(true)
    expect(alerts.badges.map((b) => b.kind)).toEqual(['lockbox', 'alarm', 'key', 'dog', 'cat'])
    expect(formatFieldAlertsExport(alerts)).toBe(
      '[Lockbox: 4433] [Alarm: 1212] [Key: on kitchen island] [Dog (Do not let out)] [Cat (Indoor)]',
    )
  })
})

describe('formatBadgeLabel', () => {
  it('formats security badge with colon', () => {
    expect(
      formatBadgeLabel({
        kind: 'lockbox',
        category: 'security',
        label: 'Lockbox',
        value: '1234',
        snippet: 'Lockbox: 1234',
        source: 'site',
      }),
    ).toBe('Lockbox: 1234')
  })

  it('formats hazard badge with parentheses', () => {
    expect(
      formatBadgeLabel({
        kind: 'dog',
        category: 'hazard',
        label: 'Dog',
        value: 'In crate',
        snippet: 'Dog in crate',
        source: 'site',
      }),
    ).toBe('Dog (In crate)')
  })

  it('formats label alone when value is undefined', () => {
    expect(
      formatBadgeLabel({
        kind: 'alarm',
        category: 'security',
        label: 'Alarm',
        snippet: 'Alarm on premises',
        source: 'site',
      }),
    ).toBe('Alarm')
  })
})
