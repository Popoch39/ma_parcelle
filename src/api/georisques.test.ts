import { assert, describe, expect, it } from 'vitest'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import { loadParcel } from './cadastre'
import { loadRisks } from './georisques'
import parcelAiguesJuntes148 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelAiguesJuntes153 from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zb-153.json'
import parcelAmberieu183 from './__fixtures__/cadastre/parcelle-amberieu-01004-bc-183.json'
import parcelAmberieu724 from './__fixtures__/cadastre/parcelle-amberieu-01004-bi-724.json'
import parcelBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelBordeaux368 from './__fixtures__/cadastre/parcelle-bordeaux-33063-bo-368.json'
import parcelBordeaux384 from './__fixtures__/cadastre/parcelle-bordeaux-33063-bo-384.json'
import parcelFeyzin from './__fixtures__/cadastre/parcelle-feyzin-69276-bb-221.json'
import parcelLyon from './__fixtures__/cadastre/parcelle-lyon-69382-ab-62.json'
import parcelParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import parcelPleaux from './__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import noResults from './__fixtures__/georisques/no-results.json'
import aziParis from './__fixtures__/georisques/gaspar-azi-75056.json'
import cavitiesAiguesJuntes153 from './__fixtures__/georisques/cavites-aigues-juntes-09001-zb-153.json'
import aziAiguesJuntes from './__fixtures__/georisques/gaspar-azi-09001.json'
import catnatAiguesJuntes from './__fixtures__/georisques/gaspar-catnat-09001.json'
import radonAiguesJuntes from './__fixtures__/georisques/radon-09001.json'
import sspNoSite from './__fixtures__/georisques/ssp-no-site.json'
import catnatParis from './__fixtures__/georisques/gaspar-catnat-75056.json'
import risksAiguesJuntes148 from './__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zc-148.json'
import triParis from './__fixtures__/georisques/gaspar-tri-75056.json'
import icpeFeyzin from './__fixtures__/georisques/installations-classees-feyzin-69276-bb-221.json'
import icpeParis from './__fixtures__/georisques/installations-classees-paris-75107-bq-3.json'
import mvtAmberieu183 from './__fixtures__/georisques/mvt-amberieu-01004-bc-183.json'
import radonPleaux from './__fixtures__/georisques/radon-15153.json'
import radonParis7e from './__fixtures__/georisques/radon-75107.json'
import rgaAiguesJuntes148 from './__fixtures__/georisques/rga-aigues-juntes-09001-zc-148.json'
import rgaAmberieu724 from './__fixtures__/georisques/rga-amberieu-01004-bi-724.json'
import rgaBordeaux from './__fixtures__/georisques/rga-bordeaux-33063-kj-33.json'
import sspBordeaux368 from './__fixtures__/georisques/ssp-bordeaux-33063-bo-368.json'
import sspBordeaux384 from './__fixtures__/georisques/ssp-bordeaux-33063-bo-384.json'
import sspParis from './__fixtures__/georisques/ssp-paris-75107-bq-3.json'
import seismicAiguesJuntes from './__fixtures__/georisques/zonage-sismique-09001.json'
import seismicLyon from './__fixtures__/georisques/zonage-sismique-69123.json'

const parcel = (idu: string, body: unknown) => loadParcel(fakeFetch([{ match: 'cadastre/parcelle', body }]), idu)

/** All Géorisques responses for Aigues-Juntes ZC 148, bare land in a rural area. */
const aiguesJuntes148: FakeRoute[] = [
  { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
  { match: '/api/v1/cavites?', body: noResults },
  { match: '/api/v1/mvt?', body: noResults },
  { match: '/api/v1/ssp?', body: sspNoSite },
  { match: '/api/v1/installations_classees?', body: noResults },
  { match: '/api/v1/gaspar/risques?', body: risksAiguesJuntes148 },
  { match: '/api/v1/gaspar/azi?code_insee=09001', body: aziAiguesJuntes },
  { match: '/api/v1/gaspar/tri?code_insee=09001', body: noResults },
  { match: '/api/v1/zonage_sismique?code_insee=09001', body: seismicAiguesJuntes },
  { match: '/api/v1/radon?code_insee=09001', body: radonAiguesJuntes },
  { match: '/api/v1/gaspar/catnat?code_insee=09001', body: catnatAiguesJuntes },
]

describe('loadRisks', () => {
  it('queries each Géorisques service once, without a key, and lists location risks before municipality risks', async () => {
    const fetch = fakeFetch(aiguesJuntes148)

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    // Neither the risk report (out of service), nor `azi`/`tri` without the `gaspar/` prefix (404), nor
    // `gaspar/pprn` (which ignores its filters).
    expect(fetch.calls.toSorted()).toEqual([
      'https://www.georisques.gouv.fr/api/v1/cavites?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/gaspar/azi?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/gaspar/catnat?code_insee=09001&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/gaspar/risques?latlon=1.471231,43.055679',
      'https://www.georisques.gouv.fr/api/v1/gaspar/tri?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/installations_classees?latlon=1.471231,43.055679&rayon=1000&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/mvt?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/radon?code_insee=09001',
      'https://www.georisques.gouv.fr/api/v1/rga?latlon=1.471231,43.055679',
      'https://www.georisques.gouv.fr/api/v1/ssp?latlon=1.471231,43.055679&rayon=500&page_size=1000',
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=09001',
    ])
    expect(risks.map(({ id, scope, available }) => ({ id, scope, available }))).toEqual([
      { id: 'clay', scope: 'location', available: true },
      { id: 'cavities', scope: 'location', available: true },
      { id: 'ground-movements', scope: 'location', available: true },
      { id: 'polluted-soils', scope: 'location', available: true },
      { id: 'former-sites', scope: 'location', available: true },
      { id: 'classified-installations', scope: 'location', available: true },
      { id: 'municipality-risks', scope: 'municipality', available: true },
      { id: 'azi', scope: 'municipality', available: true },
      { id: 'tri', scope: 'municipality', available: true },
      { id: 'seismicity', scope: 'municipality', available: true },
      { id: 'radon', scope: 'municipality', available: true },
      { id: 'catnat', scope: 'municipality', available: true },
    ])
  })

  it('gives the location’s clay exposure, as an alert when it is high', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaAiguesJuntes148 }])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/rga?latlon=1.471231,43.055679')
    expect(risks.find(({ id }) => id === 'clay')).toEqual({
      id: 'clay',
      label: 'Retrait-gonflement des argiles',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/retrait-gonflement-des-argiles',
      available: true,
      level: 'alert',
      value: 'Exposition forte',
      detail:
        'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
      elements: [],
    })
  })

  it('flags a medium clay exposure as caution, where the soil survey is also required', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaBordeaux }])

    const { risks } = await loadRisks(fetch, await parcel('33063000KJ0033', parcelBordeaux))

    expect(risks.find(({ id }) => id === 'clay')).toMatchObject({
      level: 'caution',
      value: 'Exposition moyenne',
      detail:
        'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
    })
  })

  it('only informs about a low clay exposure', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: rgaAmberieu724 }])

    const { risks } = await loadRisks(fetch, await parcel('01004000BI0724', parcelAmberieu724))

    expect(risks.find(({ id }) => id === 'clay')).toMatchObject({
      level: 'info',
      value: 'Exposition faible',
      detail: 'Les sols argileux y bougent peu avec l’humidité : aucune étude de sol n’est exigée à ce niveau.',
    })
  })

  it('asserts nothing about clay when Géorisques has no data at the location', async () => {
    // Real response in Paris: 200 with an empty body.
    const fetch = fakeFetch([{ match: '/api/v1/rga?', body: '' }])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    expect(risks.find(({ id }) => id === 'clay')).toMatchObject({
      available: true,
      level: 'info',
      value: 'Aucune donnée',
      detail: 'Géorisques ne donne pas d’exposition aux argiles à cet emplacement.',
    })
  })

  it('raises an alert for an underground cavity recorded on the parcel', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/cavites?', body: cavitiesAiguesJuntes153 }])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZB0153', parcelAiguesJuntes153))

    expect(fetch.calls).toContain(
      'https://www.georisques.gouv.fr/api/v1/cavites?latlon=1.486727,43.053856&rayon=500&page_size=1000',
    )
    expect(risks.find(({ id }) => id === 'cavities')).toEqual({
      id: 'cavities',
      label: 'Cavités souterraines',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/consulter-les-dossiers-thematiques/dossier-expert-sur-les-cavites-souterraines',
      available: true,
      level: 'alert',
      value: '1 recensée à moins de 500 m',
      detail: 'Une cavité est recensée sur la parcelle ou à moins de 100 m : le sol peut s’y affaisser ou s’effondrer.',
      elements: [
        { id: 'MPYAA0000559', label: 'Grotte de Falgalle 2', note: 'naturelle · sur la parcelle', link: null },
      ],
    })
  })

  it('asserts nothing about cavities when none is recorded around the parcel', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/cavites?', body: noResults }])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(risks.find(({ id }) => id === 'cavities')).toMatchObject({
      level: 'info',
      value: 'Aucune recensée à moins de 500 m',
      detail: null,
      elements: [],
    })
  })

  it('raises an alert for a ground movement within 100 m, and cites the others from closest to farthest', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/mvt?', body: mvtAmberieu183 }])

    const { risks } = await loadRisks(fetch, await parcel('01004000BC0183', parcelAmberieu183))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/mvt?latlon=5.370047,45.961458&rayon=500&page_size=1000')
    expect(risks.find(({ id }) => id === 'ground-movements')).toEqual({
      id: 'ground-movements',
      label: 'Mouvements de terrain',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/mouvement-de-terrain',
      available: true,
      level: 'alert',
      value: '2 recensés à moins de 500 m',
      detail: 'Un glissement, un éboulement ou une coulée s’est déjà produit sur la parcelle ou à moins de 100 m.',
      // Distances to the parcel's boundary: 96.9 m and 197.7 m.
      elements: [
        { id: '60100140', label: 'Glissement', note: '1977 · à 100 m', link: null },
        { id: '60100142', label: 'Glissement', note: '2008 · à 200 m', link: null },
      ],
    })
  })

  it('raises an alert for a polluted soil recorded on the parcel, and counts once a site both under review and classified', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspBordeaux368 }])

    const { risks } = await loadRisks(fetch, await parcel('33063000BO0368', parcelBordeaux368))

    // Polluted soils and former sites are read from the same response, requested once.
    expect(fetch.calls.filter((url) => url.includes('/ssp?'))).toEqual([
      'https://www.georisques.gouv.fr/api/v1/ssp?latlon=-0.553122,44.836200&rayon=500&page_size=1000',
    ])
    expect(risks.find(({ id }) => id === 'polluted-soils')).toEqual({
      id: 'polluted-soils',
      label: 'Sols pollués',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/sites-et-sols-pollues-ou-potentiellement-pollues',
      available: true,
      level: 'alert',
      value: '4 sites à moins de 500 m',
      detail:
        'Un sol pollué est recensé sur la parcelle ou à moins de 100 m : y construire peut exiger une étude de sol et des précautions d’usage.',
      elements: [
        {
          id: 'SSP00012540101',
          label: 'ARDEA',
          note: 'secteur d’information sur les sols · sur la parcelle',
          link: 'https://fiches-risques.brgm.fr/georisques/infosols/classification/SSP00012540101',
        },
        {
          id: 'SSP00039740101',
          label: 'DOMAINES CORDIER - SHELL',
          note: 'secteur d’information sur les sols · à 420 m',
          link: 'https://fiches-risques.brgm.fr/georisques/infosols/classification/SSP00039740101',
        },
        {
          id: 'SSP000746301',
          label: 'SHELL Quai de la Souys',
          note: 'site pollué, dossier clos · à 440 m',
          link: 'https://fiches-risques.brgm.fr/georisques/infosols/instruction/SSP000746301',
        },
        {
          id: 'SSP40896601',
          label: 'EKEM (KEYOR)',
          note: 'site pollué, dossier clos · à 470 m',
          link: 'https://fiches-risques.brgm.fr/georisques/infosols/instruction/SSP40896601',
        },
      ],
    })
  })

  it('counts the former industrial sites around the parcel, without treating them as proven pollution', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspParis }])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    expect(risks.find(({ id }) => id === 'polluted-soils')).toMatchObject({
      level: 'info',
      value: 'Aucun site recensé à moins de 500 m',
      detail: null,
      elements: [],
    })
    expect(risks.find(({ id }) => id === 'former-sites')).toEqual({
      id: 'former-sites',
      label: 'Anciens sites industriels',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/sites-et-sols-pollues-ou-potentiellement-pollues',
      available: true,
      level: 'info',
      value: '27 recensés à moins de 500 m',
      detail:
        'Activités passées, industrielles ou de service, qui ont pu polluer les sols : leur présence ne prouve pas une pollution.',
      // The five closest; the database does not always name the establishment.
      elements: [
        {
          id: 'SSP3868968',
          label: '8 avenue SEGUR',
          note: 'à 60 m',
          link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3868968',
        },
        {
          id: 'SSP3869245',
          label: '21 bis avenue SEGUR',
          note: 'à 80 m',
          link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3869245',
        },
        {
          id: 'SSP3867129',
          label: '7 Place FONTENOY',
          note: 'à 90 m',
          link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3867129',
        },
        {
          id: 'SSP3865346',
          label: 'Teinturier, usine de textile',
          note: '15 avenue Segur · à 160 m',
          link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3865346',
        },
        {
          id: 'SSP3865348',
          label: "Fabrique d'appareils téléphoniques",
          note: '46 avenue Breteuil · à 210 m',
          link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3865348',
        },
      ],
    })
  })

  it('flags as caution a former industrial site recorded on the parcel itself, and as an alert a nearby polluted soil', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/ssp?', body: sspBordeaux384 }])

    const { risks } = await loadRisks(fetch, await parcel('33063000BO0384', parcelBordeaux384))

    expect(risks.find(({ id }) => id === 'former-sites')).toMatchObject({
      level: 'caution',
      value: '35 recensés à moins de 500 m',
      detail:
        'Une activité passée, industrielle ou de service, est recensée sur la parcelle : elle a pu en polluer le sol, sans que ce soit prouvé.',
    })
    const [first] = risks.flatMap((risk) => (risk.id === 'former-sites' && risk.available ? risk.elements : []))
    expect(first).toEqual({
      id: 'SSP3772851',
      label: '53 Quai Deschamps',
      note: 'sur la parcelle',
      link: 'https://fiches-risques.brgm.fr/georisques/casias/SSP3772851',
    })
    expect(risks.find(({ id }) => id === 'polluted-soils')).toMatchObject({
      level: 'alert',
      elements: expect.arrayContaining([
        expect.objectContaining({ label: 'ARDEA', note: 'secteur d’information sur les sols · à 10 m' }),
      ]),
    })
  })

  it('raises an alert for an upper-tier Seveso establishment within 1 km, cited before closer installations', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/installations_classees?', body: icpeFeyzin }])

    const { risks } = await loadRisks(fetch, await parcel('69276000BB0221', parcelFeyzin))

    expect(fetch.calls).toContain(
      'https://www.georisques.gouv.fr/api/v1/installations_classees?latlon=4.856195,45.670037&rayon=1000&page_size=1000',
    )
    // Distances to the parcel's boundary: 790.1 m; 271.1 m; 339.9 m; 626.8 m; 822.6 m. ENERGYST,
    // under the « Non ICPE » regime, is not a classified installation.
    expect(risks.find(({ id }) => id === 'classified-installations')).toEqual({
      id: 'classified-installations',
      label: 'Installations classées',
      scope: 'location',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/accident-industriel',
      available: true,
      level: 'alert',
      value: '5 à moins de 1 km',
      detail:
        'Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de 1 km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.',
      elements: [
        {
          id: '0006103973',
          label: 'TotalEnergies Raffinage France',
          note: 'Seveso seuil haut · à 790 m',
          link: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0006103973',
        },
        {
          id: '0010600288',
          label: 'DESCOTES EX KD VALVES',
          note: 'Enregistrement · à 270 m',
          link: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0010600288',
        },
        {
          id: '0006113530',
          label: 'BROC SERVICE FRAIS',
          note: 'Autres régimes · à 340 m',
          link: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0006113530',
        },
        {
          id: '0010600551',
          label: 'STEF TRANSPORT LYON EST',
          note: 'Autres régimes · à 630 m',
          link: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0010600551',
        },
        {
          id: '0056901134',
          label: 'DECHETTERIE FEYZIN',
          note: 'Enregistrement · à 820 m',
          link: 'https://www.georisques.gouv.fr/risques/installations/donnees/details/0056901134',
        },
      ],
    })
  })

  it('only informs about ordinary classified installations in the neighborhood', async () => {
    const fetch = fakeFetch([{ match: '/api/v1/installations_classees?', body: icpeParis }])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    expect(risks.find(({ id }) => id === 'classified-installations')).toMatchObject({
      level: 'info',
      value: '4 à moins de 1 km',
      detail: 'Activités encadrées pour leurs risques ou leurs nuisances (bruit, rejets, trafic…).',
    })
  })

  it('gives the municipality’s seismic zone, as caution where new houses follow earthquake-resistant rules', async () => {
    const fetch = fakeFetch([
      { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
      { match: 'zonage_sismique?code_insee=09001', body: seismicAiguesJuntes },
    ])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(risks.find(({ id }) => id === 'seismicity')).toEqual({
      id: 'seismicity',
      label: 'Sismicité',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/seisme',
      available: true,
      level: 'caution',
      value: 'Zone 3 · modérée',
      detail: 'Une maison neuve doit y respecter les règles de construction parasismique.',
      elements: [],
    })
  })

  it('looks up Lyon’s seismicity under the municipality code when the district’s gives nothing', async () => {
    const fetch = fakeFetch([
      { match: 'zonage_sismique?code_insee=69382', body: noResults },
      { match: 'zonage_sismique?code_insee=69123', body: seismicLyon },
    ])

    const { risks } = await loadRisks(fetch, await parcel('69382000AB0062', parcelLyon))

    expect(fetch.calls.filter((url) => url.includes('zonage_sismique'))).toEqual([
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=69382',
      'https://www.georisques.gouv.fr/api/v1/zonage_sismique?code_insee=69123',
    ])
    expect(risks.find(({ id }) => id === 'seismicity')).toMatchObject({ level: 'info', value: 'Zone 2 · faible' })
  })

  it('gives the municipality’s radon potential, as caution when it is significant', async () => {
    const fetch = fakeFetch([{ match: 'radon?code_insee=15153', body: radonPleaux }])

    const { risks } = await loadRisks(fetch, await parcel('151530000F0262', parcelPleaux))

    expect(risks.find(({ id }) => id === 'radon')).toEqual({
      id: 'radon',
      label: 'Radon',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/radon',
      available: true,
      level: 'caution',
      value: 'Potentiel significatif',
      detail:
        'Ce gaz radioactif naturel, qui remonte du sous-sol, peut s’accumuler dans les bâtiments : aérer et étancher les pièces basses limite l’exposition.',
      elements: [],
    })
  })

  it('looks up Paris radon under the district code', async () => {
    const fetch = fakeFetch([{ match: 'radon?code_insee=75107', body: radonParis7e }])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    expect(risks.find(({ id }) => id === 'radon')).toMatchObject({
      level: 'info',
      value: 'Potentiel faible',
      detail: 'Le sous-sol de la commune émet peu de radon, un gaz radioactif naturel.',
    })
  })

  it('lists the risks recorded in the parcel’s municipality, without those of neighboring municipalities', async () => {
    const fetch = fakeFetch([{ match: 'gaspar/risques?', body: risksAiguesJuntes148 }])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/gaspar/risques?latlon=1.471231,43.055679')
    expect(risks.find(({ id }) => id === 'municipality-risks')).toEqual({
      id: 'municipality-risks',
      label: 'Risques recensés dans la commune',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque',
      available: true,
      level: 'info',
      value: '5 risques',
      detail: 'Risques majeurs que l’État recense pour toute la commune : ils ne visent pas forcément la parcelle.',
      elements: [
        {
          id: '12',
          label: 'Mouvement de terrain',
          note: "Affaissements et effondrements d'origine anthropique (anciennes carrières souterraines, hors mines)",
          link: null,
        },
        { id: '13', label: 'Séisme', note: null, link: null },
        { id: '16', label: 'Feu de forêt', note: null, link: null },
        {
          id: '17',
          label: "Phénomène lié à l'atmosphère",
          note: 'Neige et pluies verglaçantes',
          link: null,
        },
        { id: '23', label: 'Rupture de barrage', note: null, link: null },
      ],
    })
  })

  it('reports the flood zone atlas and the significant flood risk territory covering the municipality', async () => {
    const fetch = fakeFetch([
      { match: 'gaspar/azi?code_insee=75056', body: aziParis },
      { match: 'gaspar/tri?code_insee=75056', body: triParis },
    ])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    expect(risks.find(({ id }) => id === 'azi')).toEqual({
      id: 'azi',
      label: 'Atlas des zones inondables',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/inondation',
      available: true,
      level: 'caution',
      value: 'Commune couverte',
      detail:
        'Un atlas cartographie les zones inondables de la commune : la carte de Géorisques montre si la parcelle en fait partie.',
      elements: [{ id: '93DDT19990004', label: 'La Seine', note: 'diffusé le 01/12/1999', link: null }],
    })
    expect(risks.find(({ id }) => id === 'tri')).toEqual({
      id: 'tri',
      label: 'Territoire à risque important d’inondation',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/inondation',
      available: true,
      level: 'caution',
      value: 'Commune concernée',
      detail:
        'La commune fait partie d’un territoire où les inondations auraient de lourdes conséquences, et dont les zones inondables sont cartographiées : la carte de Géorisques montre si la parcelle en fait partie.',
      elements: [
        {
          id: '93DRIEE_IF20140001',
          label: 'Métropole Francilienne',
          note: 'cartographié le 20/12/2013',
          link: null,
        },
      ],
    })
  })

  it('asserts nothing about floods when the municipality has neither an atlas nor a recorded risk territory', async () => {
    const fetch = fakeFetch([
      { match: 'gaspar/azi?code_insee=33063', body: noResults },
      { match: 'gaspar/tri?code_insee=09001', body: noResults },
    ])

    const bordeaux = await loadRisks(fetch, await parcel('33063000KJ0033', parcelBordeaux))
    const aiguesJuntes = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(bordeaux.risks.find(({ id }) => id === 'azi')).toMatchObject({
      level: 'info',
      value: 'Aucun atlas recensé',
      detail: null,
      elements: [],
    })
    expect(aiguesJuntes.risks.find(({ id }) => id === 'tri')).toMatchObject({
      level: 'info',
      value: 'Aucun territoire recensé',
      detail: null,
      elements: [],
    })
  })

  it('counts the natural disasters recognized in the municipality and gives their whole history, from most recent to oldest', async () => {
    const fetch = fakeFetch([{ match: 'gaspar/catnat?code_insee=75056', body: catnatParis }])

    const { risks } = await loadRisks(fetch, await parcel('75107000BQ0003', parcelParis))

    // A single page: Géorisques' `next` link points to an internal host that cannot be reached.
    expect(fetch.calls).toContain('https://www.georisques.gouv.fr/api/v1/gaspar/catnat?code_insee=75056&page_size=1000')
    const catnat = risks.find(({ id }) => id === 'catnat')
    assert(catnat?.available)
    expect(catnat.elements).toHaveLength(20)
    // The oldest: the same 1983 order recognizes three risks of a single storm.
    expect(catnat.elements.slice(-3).map(({ label, note }) => `${label} ${note}`)).toEqual([
      'Inondations et/ou Coulées de Boue du 05/06/1983 au 06/06/1983',
      'Tempête du 05/06/1983 au 06/06/1983',
      'Grêle du 05/06/1983 au 06/06/1983',
    ])
    expect({ ...catnat, elements: catnat.elements.slice(0, 5) }).toEqual({
      id: 'catnat',
      label: 'Catastrophes naturelles',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/le-dispositif-dindemnisation-des-catastrophes-naturelles',
      available: true,
      level: 'info',
      value: '20 événements reconnus',
      detail:
        'Événements reconnus par arrêté comme catastrophes naturelles dans la commune, ce qui a ouvert droit à indemnisation : ils disent ce qui s’y est déjà produit.',
      elements: [
        {
          id: 'INTE1831446A-27/07/2018-Inondations et/ou Coulées de Boue',
          label: 'Inondations et/ou Coulées de Boue',
          note: 'le 27/07/2018',
          link: null,
        },
        {
          id: 'INTE1804348A-15/01/2018-Inondations et/ou Coulées de Boue',
          label: 'Inondations et/ou Coulées de Boue',
          note: 'du 15/01/2018 au 05/02/2018',
          link: null,
        },
        {
          id: 'INTE1831446A-09/07/2017-Inondations et/ou Coulées de Boue',
          label: 'Inondations et/ou Coulées de Boue',
          note: 'du 09/07/2017 au 10/07/2017',
          link: null,
        },
        {
          id: 'INTE1615488A-28/05/2016-Inondations et/ou Coulées de Boue',
          label: 'Inondations et/ou Coulées de Boue',
          note: 'du 28/05/2016 au 05/06/2016',
          link: null,
        },
        {
          id: 'INTE0600186A-23/06/2005-Inondations et/ou Coulées de Boue',
          label: 'Inondations et/ou Coulées de Boue',
          note: 'le 23/06/2005',
          link: null,
        },
      ],
    })
  })

  it('shows the other risks when one of the Géorisques services fails', async () => {
    const fetch = fakeFetch([
      { match: '/api/v1/rga?', body: rgaAiguesJuntes148 },
      { match: 'zonage_sismique?', status: 500, body: 'Internal Server Error' },
    ])

    const { risks } = await loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    expect(risks.find(({ id }) => id === 'clay')).toMatchObject({ available: true, value: 'Exposition forte' })
    expect(risks.find(({ id }) => id === 'seismicity')).toEqual({
      id: 'seismicity',
      label: 'Sismicité',
      scope: 'municipality',
      link: 'https://www.georisques.gouv.fr/minformer-sur-un-risque/seisme',
      available: false,
    })
  })

  it('fails when no Géorisques service responds', async () => {
    const fetch = fakeFetch([{ match: 'georisques.gouv.fr', status: 503, body: 'Service Unavailable' }])

    const risks = loadRisks(fetch, await parcel('09001000ZC0148', parcelAiguesJuntes148))

    await expect(risks).rejects.toMatchObject({ name: 'ApiError', kind: 'http', status: 503 })
  })
})
