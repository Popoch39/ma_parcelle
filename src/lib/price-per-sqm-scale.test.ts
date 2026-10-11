import { describe, expect, it } from 'vitest'
import { pricePerSqmScale } from './price-per-sqm-scale'
import type { ExclusionReason, Sale } from './sales'

let number = 0

/** A simple sale of a 50 m² apartment at the wanted price per m², or excluded for `exclusion`. */
function sale(pricePerSqm: number | null, exclusion: ExclusionReason | null = null): Sale {
  number += 1
  return {
    id: `v${number}`,
    date: '2024-05-02',
    nature: 'Vente',
    type: 'apartment',
    price: pricePerSqm === null ? null : pricePerSqm * 50,
    builtArea: 50,
    landArea: null,
    position: { lon: -0.58, lat: 44.84 },
    distance: 120,
    pricePerSqm,
    exclusion,
  }
}

describe('price-per-m² scale of the sales on the map', () => {
  it('has no scale without a simple sale', () => {
    expect(pricePerSqmScale([])).toBeNull()
    expect(pricePerSqmScale([sale(9000, 'bulk-sale'), sale(null, 'unknown-price')])).toBeNull()
  })

  it('splits simple sales into four classes, from the cheapest quarter to the most expensive quarter', () => {
    const sales = [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000].map((pricePerSqm) => sale(pricePerSqm))
    // An exorbitant bulk sale does not shift the classes: it is not colored.
    const scale = pricePerSqmScale([...sales, sale(20000, 'bulk-sale')])

    expect(scale?.classes).toEqual([
      { rank: 0, label: 'moins de 4 000 €/m²' },
      { rank: 1, label: '4 000 à 5 000 €/m²' },
      { rank: 2, label: '5 000 à 6 000 €/m²' },
      { rank: 3, label: '6 000 €/m² et plus' },
    ])
    expect([3000, 3500, 4000, 4999, 5000, 6000, 7000].map((pricePerSqm) => scale?.rankOf(pricePerSqm))).toEqual([
      0, 0, 1, 1, 2, 3, 3,
    ])
  })

  it('rounds the bounds to the hundred, and classifies each sale by the rounded bound of the legend', () => {
    const scale = pricePerSqmScale([3120, 3480, 4170, 4430, 5260, 5390, 6040, 7210].map((pricePerSqm) => sale(pricePerSqm)))

    expect(scale?.classes.map(({ label }) => label)).toEqual([
      'moins de 4 200 €/m²',
      '4 200 à 5 300 €/m²',
      '5 300 à 6 000 €/m²',
      '6 000 €/m² et plus',
    ])
    expect([4170, 5260, 6040].map((pricePerSqm) => scale?.rankOf(pricePerSqm))).toEqual([0, 1, 3])
  })

  it('with few sales, keeps only populated classes, at both ends of the gradient', () => {
    const two = pricePerSqmScale([sale(3000), sale(5000)])
    expect(two?.classes).toEqual([
      { rank: 0, label: 'moins de 5 000 €/m²' },
      { rank: 3, label: '5 000 €/m² et plus' },
    ])
    expect([3000, 5000].map((pricePerSqm) => two?.rankOf(pricePerSqm))).toEqual([0, 3])

    const one = pricePerSqmScale([sale(4236)])
    expect(one?.classes).toEqual([{ rank: 2, label: 'environ 4 200 €/m²' }])
    expect(one?.rankOf(4236)).toBe(2)
  })

  it('removes the class that a bound rounded past the most expensive sale would leave empty', () => {
    const scale = pricePerSqmScale([4000, 4100, 4200, 6060].map((pricePerSqm) => sale(pricePerSqm)))

    expect(scale?.classes).toEqual([
      { rank: 0, label: 'moins de 4 100 €/m²' },
      { rank: 2, label: '4 100 à 4 200 €/m²' },
      { rank: 3, label: '4 200 €/m² et plus' },
    ])
    expect([4000, 4100, 4200, 6060].map((pricePerSqm) => scale?.rankOf(pricePerSqm))).toEqual([0, 2, 3, 3])
  })
})
