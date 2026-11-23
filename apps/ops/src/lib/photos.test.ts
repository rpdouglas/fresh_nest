import { describe, expect, it } from 'vitest'
import type { VisitPhoto } from '../types'
import { fitWithin, groupVisitPhotos, photosForVisit } from './photos'

const photo = (id: string, shiftId: string, kind: 'before' | 'after', takenAt: number): VisitPhoto => ({
  id,
  shiftId,
  kind,
  takenAt,
  takenBy: 'avery@example.com',
  canDelete: true,
})

describe('fitWithin', () => {
  it('shrinks the longest side to 1600, keeping the shape', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 })
  })
  it('leaves a small photo as it is', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('groupVisitPhotos and photosForVisit', () => {
  it('shares a visit photo across partner shifts and sorts by takenAt', () => {
    const shifts = [
      { id: 's-avery', shiftPartners: [{ id: 's-blake' }] },
      { id: 's-blake', shiftPartners: [{ id: 's-avery' }] },
      { id: 's-solo', shiftPartners: [] },
    ]
    const p1 = photo('p1', 's-avery', 'before', 100)
    const p2 = photo('p2', 's-blake', 'after', 200)
    const byVisit = groupVisitPhotos(shifts, [p2, p1])

    expect(byVisit.get('s-avery')?.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(byVisit.get('s-blake')?.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(byVisit.has('s-solo')).toBe(false)
    expect(photosForVisit(byVisit, 's-avery+s-blake').map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(photosForVisit(byVisit, 's-solo')).toEqual([])
  })
})
