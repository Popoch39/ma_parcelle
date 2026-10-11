import { describe, expect, it } from 'vitest'
import { insertionPoint } from './use-map-layer'

const order = ['ortho', 'parcelles-clic', 'parcelles-contour', 'selection-aplat']

describe('insertionPoint', () => {
  it('pose par défaut au-dessus de tout', () => {
    expect(insertionPoint(order, {})).toBeUndefined()
  })

  it('pose un fond sous toutes les couches', () => {
    expect(insertionPoint(order, { beneath: true })).toBe('ortho')
    expect(insertionPoint([], { beneath: true })).toBeUndefined()
  })

  it('pose sous la couche demandée quand elle est sur la carte', () => {
    expect(insertionPoint(order, { below: 'parcelles-clic' })).toBe('parcelles-clic')
  })

  it("pose au-dessus quand la couche demandée n'est pas encore posée", () => {
    // Après un changement de fond, les calques se reposent dans un ordre quelconque : celui
    // qui se repose ensuite au-dessus rétablit l'empilement.
    expect(insertionPoint(['ortho'], { below: 'parcelles-clic' })).toBeUndefined()
  })
})
