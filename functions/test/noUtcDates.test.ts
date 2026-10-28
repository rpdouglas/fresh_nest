import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// P3-E38 (ADR-020) guard: a calendar date taken from toISOString() is the UTC date, which is
// already tomorrow after ~8 pm in Ontario. Server code uses todayInZone / addDays (shared/time).
const UTC_DATE = /toISOString\(\)\s*\.\s*(split|slice|substring)\(/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : []
  })
}

describe('no UTC calendar dates in functions/src', () => {
  it('uses the zone helpers instead of toISOString().slice/split', () => {
    const offenders = sourceFiles(join(__dirname, '../src'))
      .filter((file) => UTC_DATE.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })
})
