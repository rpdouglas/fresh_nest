import { describe, it, expect } from 'vitest'
import { serverTimestamp, Timestamp, arrayUnion, increment } from 'firebase/firestore'
import { cleanUndefined } from '@freshnest/shared'

// Regression (found in P3-E29 preview review): cleanUndefined copied FieldValue sentinels into
// plain objects, so serverTimestamp() was stored as a map and `createdAt == request.time`
// rules rejected every public booking, admin booking and review since P3-E21 (2026-06-22).
describe('cleanUndefined (shared toFirestore)', () => {
  it('passes Firestore sentinels through untouched (same instance)', () => {
    const ts = serverTimestamp()
    const union = arrayUnion('a')
    const inc = increment(1)
    const out = cleanUndefined({ createdAt: ts, tags: union, count: inc }) as Record<string, unknown>
    expect(out['createdAt']).toBe(ts)
    expect(out['tags']).toBe(union)
    expect(out['count']).toBe(inc)
  })

  it('passes Timestamp and Date through untouched', () => {
    const t = Timestamp.now()
    const d = new Date()
    const out = cleanUndefined({ t, d }) as Record<string, unknown>
    expect(out['t']).toBe(t)
    expect(out['d']).toBe(d)
  })

  it('still strips undefined from plain objects, nested objects and arrays', () => {
    expect(cleanUndefined({ a: undefined, b: null, c: { d: undefined, e: 1 }, f: [{ g: undefined, h: 2 }] }))
      .toEqual({ b: null, c: { e: 1 }, f: [{ h: 2 }] })
  })
})
