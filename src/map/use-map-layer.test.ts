import { describe, expect, it } from 'vitest'
import { insertionPoint } from './use-map-layer'

const order = ['ortho', 'parcels-click', 'parcels-outline', 'selection-fill']

describe('insertionPoint', () => {
  it('adds above everything by default', () => {
    expect(insertionPoint(order, {})).toBeUndefined()
  })

  it('adds a basemap below all layers', () => {
    expect(insertionPoint(order, { beneath: true })).toBe('ortho')
    expect(insertionPoint([], { beneath: true })).toBeUndefined()
  })

  it('adds below the requested layer when it is on the map', () => {
    expect(insertionPoint(order, { below: 'parcels-click' })).toBe('parcels-click')
  })

  it('adds above when the requested layer is not added yet', () => {
    // After a basemap change, overlays are re-added in any order: the one that is
    // re-added next above restores the stacking.
    expect(insertionPoint(['ortho'], { below: 'parcels-click' })).toBeUndefined()
  })
})
