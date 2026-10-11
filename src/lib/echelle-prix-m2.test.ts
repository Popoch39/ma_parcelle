import { describe, expect, it } from 'vitest'
import { echellePrixM2 } from './echelle-prix-m2'
import type { MotifExclusion, Vente } from './ventes'

let numero = 0

/** Une vente simple d'un appartement de 50 m² au prix au m² voulu, ou exclue pour `exclusion`. */
function vente(prixM2: number | null, exclusion: MotifExclusion | null = null): Vente {
  numero += 1
  return {
    id: `v${numero}`,
    date: '2024-05-02',
    nature: 'Vente',
    type: 'appartement',
    prix: prixM2 === null ? null : prixM2 * 50,
    surfaceBatie: 50,
    surfaceTerrain: null,
    position: { lon: -0.58, lat: 44.84 },
    distance: 120,
    prixM2,
    exclusion,
  }
}

describe('échelle des prix au m² des ventes sur la carte', () => {
  it("n'a pas d'échelle sans vente simple", () => {
    expect(echellePrixM2([])).toBeNull()
    expect(echellePrixM2([vente(9000, 'vente-groupee'), vente(null, 'prix-inconnu')])).toBeNull()
  })

  it('répartit les ventes simples en quatre classes, du quart le moins cher au quart le plus cher', () => {
    const ventes = [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000].map((prixM2) => vente(prixM2))
    // Une vente groupée hors de prix ne déplace pas les classes : elle n'est pas colorée.
    const echelle = echellePrixM2([...ventes, vente(20000, 'vente-groupee')])

    expect(echelle?.classes).toEqual([
      { rang: 0, libelle: 'moins de 4 000 €/m²' },
      { rang: 1, libelle: '4 000 à 5 000 €/m²' },
      { rang: 2, libelle: '5 000 à 6 000 €/m²' },
      { rang: 3, libelle: '6 000 €/m² et plus' },
    ])
    expect([3000, 3500, 4000, 4999, 5000, 6000, 7000].map((prixM2) => echelle?.rangDe(prixM2))).toEqual([
      0, 0, 1, 1, 2, 3, 3,
    ])
  })

  it('arrondit les bornes à la centaine, et classe chaque vente selon la borne arrondie de la légende', () => {
    const echelle = echellePrixM2([3120, 3480, 4170, 4430, 5260, 5390, 6040, 7210].map((prixM2) => vente(prixM2)))

    expect(echelle?.classes.map(({ libelle }) => libelle)).toEqual([
      'moins de 4 200 €/m²',
      '4 200 à 5 300 €/m²',
      '5 300 à 6 000 €/m²',
      '6 000 €/m² et plus',
    ])
    expect([4170, 5260, 6040].map((prixM2) => echelle?.rangDe(prixM2))).toEqual([0, 1, 3])
  })

  it('avec peu de ventes, ne garde que des classes habitées, aux deux bouts du dégradé', () => {
    const deux = echellePrixM2([vente(3000), vente(5000)])
    expect(deux?.classes).toEqual([
      { rang: 0, libelle: 'moins de 5 000 €/m²' },
      { rang: 3, libelle: '5 000 €/m² et plus' },
    ])
    expect([3000, 5000].map((prixM2) => deux?.rangDe(prixM2))).toEqual([0, 3])

    const une = echellePrixM2([vente(4236)])
    expect(une?.classes).toEqual([{ rang: 2, libelle: 'environ 4 200 €/m²' }])
    expect(une?.rangDe(4236)).toBe(2)
  })

  it("retire la classe qu'une borne arrondie au-delà de la vente la plus chère laisserait vide", () => {
    const echelle = echellePrixM2([4000, 4100, 4200, 6060].map((prixM2) => vente(prixM2)))

    expect(echelle?.classes).toEqual([
      { rang: 0, libelle: 'moins de 4 100 €/m²' },
      { rang: 2, libelle: '4 100 à 4 200 €/m²' },
      { rang: 3, libelle: '4 200 €/m² et plus' },
    ])
    expect([4000, 4100, 4200, 6060].map((prixM2) => echelle?.rangDe(prixM2))).toEqual([0, 2, 3, 3])
  })
})
