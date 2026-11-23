import { describe, expect, it } from 'vitest'
import { nextSort, sortRows } from './sort'

const rows = [
  { name: 'cy', n: 2 as number | null },
  { name: 'Ana', n: 5 },
  { name: 'bo', n: null },
  { name: 'Di', n: 2 },
]

describe('sorting a table', () => {
  it('sorts numbers either way, ties by name, and empty values last', () => {
    expect(sortRows(rows, (r) => r.n, 'desc').map((r) => r.name)).toEqual(['Ana', 'cy', 'Di', 'bo'])
    expect(sortRows(rows, (r) => r.n, 'asc').map((r) => r.name)).toEqual(['cy', 'Di', 'Ana', 'bo'])
  })
  it('sorts text without regard to case', () => {
    expect(sortRows(rows, (r) => r.name, 'asc').map((r) => r.name)).toEqual(['Ana', 'bo', 'cy', 'Di'])
  })
  it('flips the same column, and starts a new one A to Z for text or largest first for numbers', () => {
    expect(nextSort({ key: 'name', dir: 'asc' }, 'name', ['name'])).toEqual({ key: 'name', dir: 'desc' })
    expect(nextSort({ key: 'name', dir: 'asc' }, 'total', ['name'])).toEqual({ key: 'total', dir: 'desc' })
    expect(nextSort({ key: 'total', dir: 'desc' }, 'name', ['name'])).toEqual({ key: 'name', dir: 'asc' })
  })
})
