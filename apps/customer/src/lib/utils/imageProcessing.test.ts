import { describe, it, expect } from 'vitest'
import { computeSquareCrop, outputSize, GALLERY_PHOTO_SIZE } from './imageProcessing'

describe('computeSquareCrop', () => {
  it('centres the square on a landscape phone photo', () => {
    expect(computeSquareCrop(4032, 3024, 0.5)).toEqual({ sx: 504, sy: 0, size: 3024 })
  })

  it('slides along the long side only', () => {
    expect(computeSquareCrop(4032, 3024, 0)).toEqual({ sx: 0, sy: 0, size: 3024 })
    expect(computeSquareCrop(4032, 3024, 1)).toEqual({ sx: 1008, sy: 0, size: 3024 })
  })

  it('slides vertically on a portrait phone photo', () => {
    expect(computeSquareCrop(3024, 4032, 0.25)).toEqual({ sx: 0, sy: 252, size: 3024 })
  })

  it('leaves a square photo untouched', () => {
    expect(computeSquareCrop(1024, 1024, 0.9)).toEqual({ sx: 0, sy: 0, size: 1024 })
  })

  it('clamps an out-of-range position so the crop stays inside the photo', () => {
    expect(computeSquareCrop(2000, 1000, 5)).toEqual({ sx: 1000, sy: 0, size: 1000 })
    expect(computeSquareCrop(2000, 1000, -1)).toEqual({ sx: 0, sy: 0, size: 1000 })
  })
})

describe('outputSize', () => {
  it('scales large photos down to the uniform size', () => {
    expect(outputSize(3024)).toBe(GALLERY_PHOTO_SIZE)
  })

  it('does not upscale a smaller photo', () => {
    expect(outputSize(900)).toBe(900)
  })
})
