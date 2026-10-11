import { describe, expect, it } from 'vitest'
import districts from '@/api/__fixtures__/geo/communes-arrondissement-municipal-paris-lyon-marseille.json'
import municipalities from '@/api/__fixtures__/geo/communes-gironde-paris-ajaccio-strasbourg-overseas.json'
import { loadMunicipalities, type Municipality } from '@/api/municipalities'
import { fakeFetch } from '@/test/fake-fetch'
import { buildCatalog, mapPath, mapZoom, municipalityPath, departmentPath, slugify } from './catalog'

async function catalog() {
  const fetch = fakeFetch([
    { match: 'type=arrondissement-municipal', body: districts },
    { match: 'geo.api.gouv.fr/communes', body: municipalities },
  ])
  return buildCatalog(await loadMunicipalities(fetch))
}

const codes = (list: Municipality[]) => list.map(({ inseeCode }) => inseeCode)

describe('buildCatalog', () => {
  it('keeps the municipalities the cadastre covers: mainland and overseas departments, not the collectivities', async () => {
    const { departments } = await catalog()

    expect(departments.map(({ code }) => code)).toEqual(['13', '2A', '33', '67', '69', '75', '971'])
  })

  it('lists each department’s municipalities from A to Z, the districts in their order', async () => {
    const { department } = await catalog()

    expect(department('33').municipalities.map(({ name }) => name)).toEqual(['Asques', 'Bordeaux', 'Mérignac'])
    expect(department('75').municipalities.map(({ name }) => name)).toEqual([
      'Paris',
      'Paris 1er arrondissement',
      'Paris 7e arrondissement',
    ])
  })

  it('gives a page to the municipalities of at least 500 inhabitants only, the most populated first', async () => {
    const { pages } = await catalog()

    expect(codes(pages)).not.toContain('33016')
    expect(codes(pages).slice(0, 3)).toEqual(['75056', '67482', '33063'])
  })

  it('finds the districts of Paris, and none for another municipality', async () => {
    const { municipality, districtsOf } = await catalog()

    expect(codes(districtsOf(municipality('75056')!))).toEqual(['75101', '75107'])
    expect(districtsOf(municipality('33063')!)).toEqual([])
  })

  it('lists the closest municipalities, from the closest', async () => {
    const { municipality, nearby } = await catalog()

    const neighbors = nearby(municipality('33063')!)

    expect(codes(neighbors.map((neighbor) => neighbor.municipality))).toEqual(['33281', '33016'])
    expect(neighbors[0].distance).toBeGreaterThan(7_000)
    expect(neighbors[0].distance).toBeLessThan(9_000)
  })

  it('does not count a district’s municipality nor its sibling districts as neighbors twice', async () => {
    const { municipality, nearby } = await catalog()

    expect(codes(nearby(municipality('75056')!).map((neighbor) => neighbor.municipality))).toEqual([])
    expect(codes(nearby(municipality('75107')!).map((neighbor) => neighbor.municipality))).toEqual(['75101'])
  })
})

describe('slugify', () => {
  it('writes a name in lowercase ASCII words joined by hyphens', () => {
    expect(slugify('L’Haÿ-les-Roses')).toBe('l-hay-les-roses')
    expect(slugify('Saint-Étienne')).toBe('saint-etienne')
    expect(slugify('Œuilly')).toBe('oeuilly')
    expect(slugify('Paris 7e arrondissement')).toBe('paris-7e-arrondissement')
  })
})

describe('paths', () => {
  it('names a municipality’s page and its department’s after their names and codes', async () => {
    const { municipality, department } = await catalog()

    expect(municipalityPath(municipality('2A004')!)).toBe('/commune/ajaccio-2a004')
    expect(municipalityPath(municipality('33281')!)).toBe('/commune/merignac-33281')
    expect(departmentPath(department('2A'))).toBe('/departement/corse-du-sud-2a')
  })

  it('opens the map on the municipality, zoomed so that it fills the screen', async () => {
    const { municipality } = await catalog()

    expect(mapZoom(municipality('33063')!)).toBe(12.2)
    expect(mapPath(municipality('33063')!)).toBe('/#carte=12.2/44.8624/-0.5848')
    expect(mapZoom(municipality('75101')!)).toBe(14.5)
  })
})
