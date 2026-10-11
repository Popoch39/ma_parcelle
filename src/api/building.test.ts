import { describe, expect, it } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadBuilding } from './building'
import { loadParcel } from './cadastre'
import altiBareLand from './__fixtures__/elevation/elevation-aigues-juntes-09001-zc-148.json'
import altiAiguesJuntes154 from './__fixtures__/elevation/elevation-aigues-juntes-09001-zc-154.json'
import altiBordeaux from './__fixtures__/elevation/elevation-bordeaux-33063-kj-33.json'
import altiOutOfCoverage from './__fixtures__/elevation/elevation-out-of-coverage-at-sea.json'
import bdnbBareLand from './__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-148-bare-land.json'
import bdnbAiguesJuntes154 from './__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-154.json'
import bdnbBordeaux from './__fixtures__/bdnb/batiment-groupe-bordeaux-33063-kj-33.json'
import bdnbInfo from './__fixtures__/bdnb/metadonnees-info.json'
import parcelBareLand from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelAiguesJuntes154 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-154.json'
import parcelBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'

const parcel = (idu: string, body: unknown) => loadParcel(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

const bdnbInfoRoute: FakeRoute = { match: 'bdnb/metadonnees/info', body: bdnbInfo }

/** Point where the altitude was requested. */
const altiPoint = (calls: string[]) => {
  const url = new URL(calls.find((call) => call.includes('altimetrie')) ?? '')
  return { lon: Number(url.searchParams.get('lon')), lat: Number(url.searchParams.get('lat')) }
}

describe('loadBuilding', () => {
  it('describes the parcel building according to the BDNB, with the database vintage', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees/batiment_groupe_complet/parcelle', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiBordeaux },
    ])

    const building = await loadBuilding(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    expect(fetch.calls).toContain(
      'https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.33063000KJ0033&select=batiment_groupe_id%2Clibelle_adr_principale_ban%2Cannee_construction%2Chauteur_mean%2Cclasse_bilan_dpe',
    )
    expect(building).toEqual({
      buildings: [
        {
          id: 'bdnb-bg-8Y34-DHP9-PYDW',
          address: '26 Rue Sainte-Catherine 33000 Bordeaux',
          constructionYear: 1850,
          meanHeight: 10,
          dpeClass: 'E',
        },
      ],
      bdnbVintage: '2026-02.a',
      altitude: 7.47,
    })
  })

  it('requests the altitude from RGE ALTI, at the parcel centroid', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiBordeaux },
    ])

    await loadBuilding(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    const url = fetch.calls.find((call) => call.includes('altimetrie'))
    expect(url).toMatch(/^https:\/\/data\.geopf\.fr\/altimetrie\/1\.0\/calcul\/alti\/rest\/elevation\.json\?/)
    expect(url).toContain('resource=ign_rge_alti_wld')
    // Parcel point according to the IGN geocoder (parcel index), within 10 m.
    const { lon, lat } = altiPoint(fetch.calls)
    expect(lon).toBeCloseTo(-0.5737052624778258, 4)
    expect(lat).toBeCloseTo(44.84042236131448, 4)
  })

  it('lists each building when the parcel carries several', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbAiguesJuntes154 },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiAiguesJuntes154 },
    ])

    const building = await loadBuilding(fetch, await parcel('09001000ZC0154', parcelAiguesJuntes154))

    expect(building.buildings).toEqual([
      { id: 'bdnb-bg-686G-R2KR-J2TK', address: null, constructionYear: null, meanHeight: 2, dpeClass: null },
      {
        id: 'bdnb-bg-GB24-S8XH-S28G',
        address: '26 Impasse de la Mairie 09240 Aigues-Juntes',
        constructionYear: 1991,
        meanHeight: 4,
        dpeClass: null,
      },
      { id: 'bdnb-bg-UA2X-RHKC-A1YB', address: null, constructionYear: null, meanHeight: 3, dpeClass: null },
    ])
    expect(building.altitude).toBe(384.23)
    const { lon, lat } = altiPoint(fetch.calls)
    expect(lon).toBeCloseTo(1.471313450691736, 4)
    expect(lat).toBeCloseTo(43.05539481413751, 4)
  })

  it('lists no building on bare land, but gives its altitude', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBareLand },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiBareLand },
    ])

    const building = await loadBuilding(fetch, await parcel('09001000ZC0148', parcelBareLand))

    expect(building).toEqual({ buildings: [], bdnbVintage: '2026-02.a', altitude: 390.22 })
  })

  it('still describes the building when only the elevation fails', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      // Quota of 5 requests/s exceeded: the Géoplateforme answers in HTML.
      { match: 'altimetrie', status: 429, body: '<html><head><title>429 Too Many Requests</title></head></html>' },
    ])

    const building = await loadBuilding(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    expect(building.buildings).toHaveLength(1)
    expect(building.altitude).toBeNull()
  })

  it('gives no altitude outside RGE ALTI coverage', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiOutOfCoverage },
    ])

    const building = await loadBuilding(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    expect(building.altitude).toBeNull()
  })
})
