import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadDpe } from './ademe'
import { loadParcel } from './cadastre'
import noDpe from './__fixtures__/ademe/no-dpe.json'
import bboxKm239 from './__fixtures__/ademe/bbox-bordeaux-33063-km-239.json'
import bboxParis from './__fixtures__/ademe/bbox-paris-75107-bq-3.json'
import neighborhoodAiguesJuntes from './__fixtures__/ademe/neighborhood-aigues-juntes-09001-zc-148.json'
import neighborhoodBordeauxPage1 from './__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-1.json'
import neighborhoodBordeauxPage2 from './__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-2.json'
import neighborhoodBordeauxPage3 from './__fixtures__/ademe/neighborhood-bordeaux-33063-kj-33-page-3.json'
import neighborhoodParisPage1 from './__fixtures__/ademe/neighborhood-paris-75107-bq-3-page-1.json'
import neighborhoodParisPage2 from './__fixtures__/ademe/neighborhood-paris-75107-bq-3-page-2.json'
import parcelAiguesJuntes from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelKm239 from './__fixtures__/cadastre/parcelle-bordeaux-33063-km-239.json'
import parcelParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'

const parcel = (idu: string, body: unknown) => loadParcel(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

const LINES = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines'
const COLUMNS =
  'select=numero_dpe%2Cdate_etablissement_dpe%2Cetiquette_dpe%2Cetiquette_ges%2Csurface_habitable_logement%2Cadresse_ban%2C_geopoint'

describe('loadDpe', () => {
  it('keeps the bbox DPEs whose point falls in the parcel, and drops those of the neighbor', async () => {
    const fetch = fakeFetch([{ match: 'dpe03existant/lines?bbox=', body: bboxKm239 }])

    const dpe = await loadDpe(fetch, await parcel('33063000KM0239', parcelKm239))

    expect(fetch.calls).toEqual([
      `${LINES}?bbox=-0.57351244%2C44.84081618%2C-0.57314435%2C44.84102645&size=100&sort=-date_etablissement_dpe&${COLUMNS}`,
    ])
    // The three DPEs of 1 rue Métivier are in the parcel bbox, but outside its outline.
    expect(dpe.scope).toBe('parcel')
    expect(dpe.dpes).toEqual([
      {
        number: '2633E0144662K',
        date: '2026-01-19',
        energyGrade: 'D',
        climateGrade: 'D',
        livingArea: 115,
        address: '20 Rue des Piliers de Tutelle 33000 Bordeaux',
        distance: null,
      },
      {
        number: '2333E2702942R',
        date: '2023-08-10',
        energyGrade: 'E',
        climateGrade: 'E',
        livingArea: 77.5,
        address: '20 Rue des Piliers de Tutelle 33000 Bordeaux',
        distance: null,
      },
    ])
  })

  it('falls back to the DPEs within 100 m of the parcel center when none falls in it, following the pages', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: bboxParis },
      { match: 'after=97.01700393424466', body: neighborhoodParisPage2 },
      { match: 'dpe03existant/lines?geo_distance=', body: neighborhoodParisPage1 },
    ])

    const dpe = await loadDpe(fetch, await parcel('75107000BQ0003', parcelParis))

    // Parcel center according to the IGN geocoder (parcel index), within 10 m.
    const center = new URL(fetch.calls[1]).searchParams.get('geo_distance')?.split(',') ?? []
    expect(Number(center[0])).toBeCloseTo(2.30809, 3)
    expect(Number(center[1])).toBeCloseTo(48.85065, 3)
    expect(center[2]).toBe('100m')
    expect(fetch.calls).toEqual([
      expect.stringContaining('?bbox='),
      `${LINES}?geo_distance=${center.join('%2C')}&size=100&${COLUMNS}`,
      neighborhoodParisPage1.next,
    ])
    // The 56 DPEs of the bbox are those of the neighboring buildings (47 to 51 avenue de Ségur).
    expect(dpe.scope).toBe('neighborhood')
    expect(dpe.dpes).toEqual([
      {
        number: '2275E1375416O',
        date: '2022-06-20',
        energyGrade: 'D',
        climateGrade: 'D',
        livingArea: 70.5,
        address: 'Avenue de Ségur 75007 Paris',
        distance: 63.2417333756259,
      },
      {
        number: '2275E2361971Z',
        date: '2022-10-11',
        energyGrade: 'E',
        climateGrade: 'E',
        livingArea: 55.3,
        address: 'Avenue de Ségur 75007 Paris',
        distance: 63.2417333756259,
      },
      {
        number: '2575E3819783U',
        date: '2025-12-04',
        energyGrade: 'F',
        climateGrade: 'F',
        livingArea: 60.1,
        address: '2 Villa de Ségur 75007 Paris',
        distance: 97.02269897806893,
      },
    ])
    expect(dpe.limit).toBeNull()
  })

  it('stops at the third page and reports the limit reached, with the announced total', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: noDpe },
      { match: 'after=52.29016186365669', body: neighborhoodBordeauxPage2 },
      { match: 'after=70.73690557292974', body: neighborhoodBordeauxPage3 },
      { match: 'dpe03existant/lines?geo_distance=', body: neighborhoodBordeauxPage1 },
    ])

    const dpe = await loadDpe(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    // Page 3 still announces a next page: it is not requested.
    expect(fetch.calls).toHaveLength(4)
    expect(dpe.scope).toBe('neighborhood')
    expect(dpe.dpes.map(({ number }) => number)).toEqual([
      '2233E0564275F',
      '2433E2882484E',
      '2633E2328419B',
      '2333E1384850V',
      '2233E1116088U',
      '2333E3287592F',
      '2333E3704668P',
    ])
    expect(dpe.limit).toEqual({ read: 7, total: 377 })
  })

  it('distributes the kept DPEs by energy grade, from A to G', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: noDpe },
      { match: 'dpe03existant/lines?geo_distance=', body: neighborhoodAiguesJuntes },
    ])

    const dpe = await loadDpe(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes))

    expect(dpe.distribution).toEqual([
      { grade: 'A', count: 0 },
      { grade: 'B', count: 0 },
      { grade: 'C', count: 1 },
      { grade: 'D', count: 0 },
      { grade: 'E', count: 0 },
      { grade: 'F', count: 1 },
      { grade: 'G', count: 1 },
    ])
  })

  it('finds no DPE when neither the parcel nor its neighborhood has any', async () => {
    const fetch = fakeFetch([{ match: 'dpe03existant/lines?', body: noDpe }])

    const dpe = await loadDpe(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes))

    expect(dpe.scope).toBe('neighborhood')
    expect(dpe.dpes).toEqual([])
    expect(dpe.distribution.every(({ count }) => count === 0)).toBe(true)
    expect(dpe.limit).toBeNull()
  })
})
