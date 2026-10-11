import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadMunicipalities } from './municipalities'
import districts from './__fixtures__/geo/communes-arrondissement-municipal-paris-lyon-marseille.json'
import municipalities from './__fixtures__/geo/communes-gironde-paris-ajaccio-strasbourg-overseas.json'

const routes = [
  { match: 'type=arrondissement-municipal', body: districts },
  { match: 'geo.api.gouv.fr/communes', body: municipalities },
]

describe('loadMunicipalities', () => {
  it('queries the current municipalities, then the districts of Paris, Lyon and Marseille', async () => {
    const fetch = fakeFetch(routes)

    await loadMunicipalities(fetch)

    expect(fetch.calls).toEqual([
      'https://geo.api.gouv.fr/communes?fields=nom%2Ccode%2CcodesPostaux%2Ccentre%2Cpopulation%2Csurface%2Cdepartement%2Cregion&format=json',
      'https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields=nom%2Ccode%2CcodesPostaux%2Ccentre%2Cpopulation%2Csurface%2Cdepartement%2Cregion&format=json',
    ])
  })

  it('returns each municipality with its center, population, area, department and region', async () => {
    const result = await loadMunicipalities(fakeFetch(routes))

    expect(result.find(({ inseeCode }) => inseeCode === '33063')).toEqual({
      name: 'Bordeaux',
      inseeCode: '33063',
      postalCodes: ['33000', '33100', '33200', '33300', '33800'],
      center: { lon: -0.5848, lat: 44.8624 },
      population: 267991,
      area: 4977.4,
      department: { code: '33', name: 'Gironde' },
      region: { code: '75', name: 'Nouvelle-Aquitaine' },
      parentInseeCode: null,
    })
  })

  it('attaches each district to its municipality, its name in lowercase', async () => {
    const result = await loadMunicipalities(fakeFetch(routes))

    expect(result.filter(({ parentInseeCode }) => parentInseeCode !== null).map(({ name, inseeCode, parentInseeCode }) => [name, inseeCode, parentInseeCode])).toEqual([
      ['Marseille 1er arrondissement', '13201', '13055'],
      ['Lyon 1er arrondissement', '69381', '69123'],
      ['Paris 1er arrondissement', '75101', '75056'],
      ['Paris 7e arrondissement', '75107', '75056'],
    ])
  })

  it('leaves out the uninhabited territories, which have no population', async () => {
    const result = await loadMunicipalities(fakeFetch(routes))

    expect(result.map(({ inseeCode }) => inseeCode)).not.toContain('98411')
    expect(result).toHaveLength(12)
  })
})
