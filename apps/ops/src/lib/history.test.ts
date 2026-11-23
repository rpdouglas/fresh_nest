import { describe, expect, it } from 'vitest'
import { historyStep } from './history'

const quiet = { viewChanged: false, fromHistory: false }

describe('what the Back button steps through', () => {
  it('a different report is a new step', () => {
    expect(historyStep({ ...quiet, viewChanged: true })).toBe('push')
  })
  it('another week or period of the same report is not', () => {
    expect(historyStep(quiet)).toBe('replace')
  })
  it('Back and Forward add nothing: the history already has the report', () => {
    expect(historyStep({ ...quiet, viewChanged: true, fromHistory: true })).toBe('replace')
  })
})
