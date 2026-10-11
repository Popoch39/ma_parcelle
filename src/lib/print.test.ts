import { describe, expect, it } from 'vitest'
import { captureFrame, keepCurrentView, printZoom } from './print'

describe('view of the printed map', () => {
  // 1350 × 900 image at the center of a 1600 × 900 screen; selection highlighted from zoom 15.
  const frame = { x: 125, y: 0, width: 1350, height: 900 }
  const keep = (zoom: number, x: number, y: number) =>
    keepCurrentView({ zoom, highlightZoom: 15, parcelCenter: { x, y }, frame })

  it('prints the current view as is when the parcel is in it, highlighted, even far from the center', () => {
    expect(keep(17, 800, 450)).toBe(true)
    expect(keep(15, 200, 850)).toBe(true)
  })

  it('reframes when the parcel is outside the image, even if visible on screen', () => {
    expect(keep(17, 2400, 450)).toBe(false)
    expect(keep(17, 60, 450)).toBe(false)
  })

  it('reframes when the view is too far out for the parcel to be highlighted', () => {
    expect(keep(14.9, 800, 450)).toBe(false)
  })
})

describe('zoom of the printed map when it must be reframed', () => {
  // Whole parcel in the image up to zoom 18; selection highlighted from zoom 15.
  const zoom = (current: number, wholeParcel = 18) => printZoom({ current, wholeParcel, highlightZoom: 15 })

  it('keeps the zoom of the current view when the parcel fits and is highlighted', () => {
    expect(zoom(17)).toBe(17)
    expect(zoom(15)).toBe(15)
  })

  it('zooms out when the parcel would overflow the image', () => {
    expect(zoom(19.5)).toBe(18)
  })

  it('zooms in up to the parcel highlight when the current view is too far out', () => {
    expect(zoom(11)).toBe(15)
  })

  it('shows whole a parcel too large to be highlighted', () => {
    expect(zoom(11, 13.5)).toBe(13.5)
    expect(zoom(16, 13.5)).toBe(13.5)
  })
})

describe('framing of the printed map', () => {
  it('keeps the full height of a screen wider than the image, centered horizontally', () => {
    expect(captureFrame({ width: 1600, height: 900 }, 16 / 10)).toEqual({ x: 80, y: 0, width: 1440, height: 900 })
  })

  it('keeps the full width of a phone screen, centered vertically', () => {
    expect(captureFrame({ width: 780, height: 1688 }, 16 / 10)).toEqual({ x: 0, y: 600, width: 780, height: 488 })
  })
})
