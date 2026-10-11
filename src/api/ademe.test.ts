import { describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadDpe } from './ademe'
import { loadParcelle } from './cadastre'
import aucunDpe from './__fixtures__/ademe/aucun-dpe.json'
import bboxKm239 from './__fixtures__/ademe/bbox-bordeaux-33063-km-239.json'
import bboxParis from './__fixtures__/ademe/bbox-paris-75107-bq-3.json'
import voisinageAiguesJuntes from './__fixtures__/ademe/voisinage-aigues-juntes-09001-zc-148.json'
import voisinageBordeauxPage1 from './__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-1.json'
import voisinageBordeauxPage2 from './__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-2.json'
import voisinageBordeauxPage3 from './__fixtures__/ademe/voisinage-bordeaux-33063-kj-33-page-3.json'
import voisinageParisPage1 from './__fixtures__/ademe/voisinage-paris-75107-bq-3-page-1.json'
import voisinageParisPage2 from './__fixtures__/ademe/voisinage-paris-75107-bq-3-page-2.json'
import parcelleAiguesJuntes from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelleKm239 from './__fixtures__/cadastre/parcelle-bordeaux-33063-km-239.json'
import parcelleParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'

const parcelle = (idu: string, body: unknown) => loadParcelle(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

const LIGNES = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines'
const COLONNES =
  'select=numero_dpe%2Cdate_etablissement_dpe%2Cetiquette_dpe%2Cetiquette_ges%2Csurface_habitable_logement%2Cadresse_ban%2C_geopoint'

describe('loadDpe', () => {
  it('garde les DPE de l’emprise dont le point tombe dans la parcelle, et écarte ceux du voisin', async () => {
    const fetch = fakeFetch([{ match: 'dpe03existant/lines?bbox=', body: bboxKm239 }])

    const dpe = await loadDpe(fetch, await parcelle('33063000KM0239', parcelleKm239))

    expect(fetch.calls).toEqual([
      `${LIGNES}?bbox=-0.57351244%2C44.84081618%2C-0.57314435%2C44.84102645&size=100&sort=-date_etablissement_dpe&${COLONNES}`,
    ])
    // Les trois DPE du 1 rue Métivier sont dans l'emprise de la parcelle, mais hors de son contour.
    expect(dpe.portee).toBe('parcelle')
    expect(dpe.dpe).toEqual([
      {
        numero: '2633E0144662K',
        date: '2026-01-19',
        etiquetteEnergie: 'D',
        etiquetteClimat: 'D',
        surface: 115,
        adresse: '20 Rue des Piliers de Tutelle 33000 Bordeaux',
        distance: null,
      },
      {
        numero: '2333E2702942R',
        date: '2023-08-10',
        etiquetteEnergie: 'E',
        etiquetteClimat: 'E',
        surface: 77.5,
        adresse: '20 Rue des Piliers de Tutelle 33000 Bordeaux',
        distance: null,
      },
    ])
  })

  it('bascule sur les DPE à moins de 100 m du centre de la parcelle quand aucun n’y tombe, en suivant les pages', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: bboxParis },
      { match: 'after=97.01700393424466', body: voisinageParisPage2 },
      { match: 'dpe03existant/lines?geo_distance=', body: voisinageParisPage1 },
    ])

    const dpe = await loadDpe(fetch, await parcelle('75107000BQ0003', parcelleParis))

    // Centre de la parcelle selon le géocodeur de l'IGN (index parcel), à 10 m près.
    const centre = new URL(fetch.calls[1]).searchParams.get('geo_distance')?.split(',') ?? []
    expect(Number(centre[0])).toBeCloseTo(2.30809, 3)
    expect(Number(centre[1])).toBeCloseTo(48.85065, 3)
    expect(centre[2]).toBe('100m')
    expect(fetch.calls).toEqual([
      expect.stringContaining('?bbox='),
      `${LIGNES}?geo_distance=${centre.join('%2C')}&size=100&${COLONNES}`,
      voisinageParisPage1.next,
    ])
    // Les 56 DPE de l'emprise sont ceux des immeubles voisins (47 à 51 avenue de Ségur).
    expect(dpe.portee).toBe('voisinage')
    expect(dpe.dpe).toEqual([
      {
        numero: '2275E1375416O',
        date: '2022-06-20',
        etiquetteEnergie: 'D',
        etiquetteClimat: 'D',
        surface: 70.5,
        adresse: 'Avenue de Ségur 75007 Paris',
        distance: 63.2417333756259,
      },
      {
        numero: '2275E2361971Z',
        date: '2022-10-11',
        etiquetteEnergie: 'E',
        etiquetteClimat: 'E',
        surface: 55.3,
        adresse: 'Avenue de Ségur 75007 Paris',
        distance: 63.2417333756259,
      },
      {
        numero: '2575E3819783U',
        date: '2025-12-04',
        etiquetteEnergie: 'F',
        etiquetteClimat: 'F',
        surface: 60.1,
        adresse: '2 Villa de Ségur 75007 Paris',
        distance: 97.02269897806893,
      },
    ])
    expect(dpe.limite).toBeNull()
  })

  it('s’arrête à la troisième page et signale la limite atteinte, avec le total annoncé', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: aucunDpe },
      { match: 'after=52.29016186365669', body: voisinageBordeauxPage2 },
      { match: 'after=70.73690557292974', body: voisinageBordeauxPage3 },
      { match: 'dpe03existant/lines?geo_distance=', body: voisinageBordeauxPage1 },
    ])

    const dpe = await loadDpe(fetch, await parcelle('33063000KJ0033', parcelleBordeaux))

    // La page 3 annonce encore une suite : elle n'est pas demandée.
    expect(fetch.calls).toHaveLength(4)
    expect(dpe.portee).toBe('voisinage')
    expect(dpe.dpe.map(({ numero }) => numero)).toEqual([
      '2233E0564275F',
      '2433E2882484E',
      '2633E2328419B',
      '2333E1384850V',
      '2233E1116088U',
      '2333E3287592F',
      '2333E3704668P',
    ])
    expect(dpe.limite).toEqual({ lues: 7, total: 377 })
  })

  it('répartit les DPE retenus par étiquette énergie, de A à G', async () => {
    const fetch = fakeFetch([
      { match: 'dpe03existant/lines?bbox=', body: aucunDpe },
      { match: 'dpe03existant/lines?geo_distance=', body: voisinageAiguesJuntes },
    ])

    const dpe = await loadDpe(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes))

    expect(dpe.repartition).toEqual([
      { etiquette: 'A', nombre: 0 },
      { etiquette: 'B', nombre: 0 },
      { etiquette: 'C', nombre: 1 },
      { etiquette: 'D', nombre: 0 },
      { etiquette: 'E', nombre: 0 },
      { etiquette: 'F', nombre: 1 },
      { etiquette: 'G', nombre: 1 },
    ])
  })

  it('ne trouve aucun DPE quand ni la parcelle ni son voisinage n’en ont', async () => {
    const fetch = fakeFetch([{ match: 'dpe03existant/lines?', body: aucunDpe }])

    const dpe = await loadDpe(fetch, await parcelle('09001000ZC0148', parcelleAiguesJuntes))

    expect(dpe.portee).toBe('voisinage')
    expect(dpe.dpe).toEqual([])
    expect(dpe.repartition.every(({ nombre }) => nombre === 0)).toBe(true)
    expect(dpe.limite).toBeNull()
  })
})
