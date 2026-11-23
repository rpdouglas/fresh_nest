import { describe, expect, it } from 'vitest'
import type { LiveCleanerCard, LiveLevel, LiveVisit } from './live'
import { pairsOf } from './live'

const visit = (client: string, start: string, end: string): LiveVisit =>
  ({ shift: { client: { id: client, name: client }, jobSite: null, startTime: start, endTime: end } }) as unknown as LiveVisit
const card = (name: string, level: LiveLevel, visits: LiveVisit[]): LiveCleanerCard =>
  ({ cleaner: { id: name, name }, level, visits }) as unknown as LiveCleanerCard

const morning = visit('maple', '2026-10-20T12:00:00Z', '2026-10-20T14:00:00Z')
const afternoon = visit('birch', '2026-10-20T15:00:00Z', '2026-10-20T17:00:00Z')

describe('pairsOf', () => {
  it('puts cleaners with the same visits on one row, and keeps a solo cleaner on their own', () => {
    const rows = pairsOf([
      card('Avery', 'grey', [morning, afternoon]),
      card('Jo', 'grey', [morning, afternoon]),
      card('Sam', 'grey', [afternoon]),
    ])
    expect(rows.map((r) => r.names)).toEqual([['Avery', 'Jo'], ['Sam']])
  })

  it('takes the worse level of a pair, and puts the worst rows first', () => {
    const rows = pairsOf([card('Avery', 'grey', [morning]), card('Sam', 'yellow', [afternoon]), card('Jo', 'red', [morning])])
    expect(rows.map((r) => [r.names, r.level])).toEqual([
      [['Avery', 'Jo'], 'red'],
      [['Sam'], 'yellow'],
    ])
  })
})
