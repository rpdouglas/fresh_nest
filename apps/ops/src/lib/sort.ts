// Sorting a table by one column. Names sort A to Z first; numbers largest first,
// since the biggest figure is usually the one being looked for.

export type SortDir = 'asc' | 'desc'
export interface Sort<K extends string> {
  key: K
  dir: SortDir
}

/** The sort after a header is chosen: the same column flips, a new one starts at its natural order. */
export function nextSort<K extends string>(current: Sort<K>, key: K, textKeys: readonly K[]): Sort<K> {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: textKeys.includes(key) ? 'asc' : 'desc' }
}

/** A sorted copy. Ties, and empty values (null) which always go last, keep their order by name. */
export function sortRows<T extends { name: string }>(rows: T[], value: (row: T) => number | string | null, dir: SortDir): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  return [...rows].sort((a, b) => {
    const [x, y] = [value(a), value(b)]
    if (x === null || y === null) return x === y ? byName(a, b) : x === null ? 1 : -1
    const c = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y, undefined, { sensitivity: 'base' }) : Number(x) - Number(y)
    return (dir === 'asc' ? c : -c) || byName(a, b)
  })
}
