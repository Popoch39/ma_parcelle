import { describe, expect, it } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadBatiment } from './batiment'
import { loadParcelle } from './cadastre'
import altiTerrainNu from './__fixtures__/altimetrie/elevation-aigues-juntes-09001-zc-148.json'
import altiAiguesJuntes154 from './__fixtures__/altimetrie/elevation-aigues-juntes-09001-zc-154.json'
import altiBordeaux from './__fixtures__/altimetrie/elevation-bordeaux-33063-kj-33.json'
import altiHorsCouverture from './__fixtures__/altimetrie/elevation-hors-couverture-en-mer.json'
import bdnbTerrainNu from './__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-148-terrain-nu.json'
import bdnbAiguesJuntes154 from './__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-154.json'
import bdnbBordeaux from './__fixtures__/bdnb/batiment-groupe-bordeaux-33063-kj-33.json'
import bdnbInfo from './__fixtures__/bdnb/metadonnees-info.json'
import parcelleTerrainNu from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleAiguesJuntes154 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-154.json'
import parcelleBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'

const parcelle = (idu: string, body: unknown) => loadParcelle(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

const bdnbInfoRoute: FakeRoute = { match: 'bdnb/metadonnees/info', body: bdnbInfo }

/** Point où l'altitude a été demandée. */
const altiPoint = (calls: string[]) => {
  const url = new URL(calls.find((call) => call.includes('altimetrie')) ?? '')
  return { lon: Number(url.searchParams.get('lon')), lat: Number(url.searchParams.get('lat')) }
}

describe('loadBatiment', () => {
  it('décrit le bâtiment de la parcelle d’après la BDNB, avec le millésime de la base', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees/batiment_groupe_complet/parcelle', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiBordeaux },
    ])

    const batiment = await loadBatiment(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    expect(fetch.calls).toContain(
      'https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.33063000KJ0033&select=batiment_groupe_id%2Clibelle_adr_principale_ban%2Cannee_construction%2Chauteur_mean%2Cclasse_bilan_dpe',
    )
    expect(batiment).toEqual({
      batiments: [
        {
          id: 'bdnb-bg-8Y34-DHP9-PYDW',
          adresse: '26 Rue Sainte-Catherine 33000 Bordeaux',
          anneeConstruction: 1850,
          hauteurMoyenne: 10,
          classeDpe: 'E',
        },
      ],
      millesimeBdnb: '2026-02.a',
      altitude: 7.47,
    })
  })

  it('demande l’altitude au RGE ALTI, au centroïde de la parcelle', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiBordeaux },
    ])

    await loadBatiment(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    const url = fetch.calls.find((call) => call.includes('altimetrie'))
    expect(url).toMatch(/^https:\/\/data\.geopf\.fr\/altimetrie\/1\.0\/calcul\/alti\/rest\/elevation\.json\?/)
    expect(url).toContain('resource=ign_rge_alti_wld')
    // Point de la parcelle selon le géocodeur de l'IGN (index parcel), à 10 m près.
    const { lon, lat } = altiPoint(fetch.calls)
    expect(lon).toBeCloseTo(-0.5737052624778258, 4)
    expect(lat).toBeCloseTo(44.84042236131448, 4)
  })

  it('liste chacun des bâtiments quand la parcelle en porte plusieurs', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbAiguesJuntes154 },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiAiguesJuntes154 },
    ])

    const batiment = await loadBatiment(fetch, await parcelle('09001000ZC0154', parcelleAiguesJuntes154))

    expect(batiment.batiments).toEqual([
      { id: 'bdnb-bg-686G-R2KR-J2TK', adresse: null, anneeConstruction: null, hauteurMoyenne: 2, classeDpe: null },
      {
        id: 'bdnb-bg-GB24-S8XH-S28G',
        adresse: '26 Impasse de la Mairie 09240 Aigues-Juntes',
        anneeConstruction: 1991,
        hauteurMoyenne: 4,
        classeDpe: null,
      },
      { id: 'bdnb-bg-UA2X-RHKC-A1YB', adresse: null, anneeConstruction: null, hauteurMoyenne: 3, classeDpe: null },
    ])
    expect(batiment.altitude).toBe(384.23)
    const { lon, lat } = altiPoint(fetch.calls)
    expect(lon).toBeCloseTo(1.471313450691736, 4)
    expect(lat).toBeCloseTo(43.05539481413751, 4)
  })

  it('ne liste aucun bâtiment sur un terrain nu, mais donne son altitude', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbTerrainNu },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiTerrainNu },
    ])

    const batiment = await loadBatiment(fetch, await parcelle('09001000ZC0148', parcelleTerrainNu))

    expect(batiment).toEqual({ batiments: [], millesimeBdnb: '2026-02.a', altitude: 390.22 })
  })

  it('décrit quand même le bâtiment quand seule l’altimétrie échoue', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      // Quota de 5 requêtes/s dépassé : la Géoplateforme répond en HTML.
      { match: 'altimetrie', status: 429, body: '<html><head><title>429 Too Many Requests</title></head></html>' },
    ])

    const batiment = await loadBatiment(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    expect(batiment.batiments).toHaveLength(1)
    expect(batiment.altitude).toBeNull()
  })

  it('ne donne pas d’altitude hors de la couverture du RGE ALTI', async () => {
    const fetch = fakeFetch([
      { match: 'bdnb/donnees', body: bdnbBordeaux },
      bdnbInfoRoute,
      { match: 'altimetrie', body: altiHorsCouverture },
    ])

    const batiment = await loadBatiment(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    expect(batiment.altitude).toBeNull()
  })
})
