import { beforeAll, describe, expect, it, vi } from 'vitest'
import { loadParcel } from '@/api/cadastre'
import type { Fetch } from '@/api/fetch-json'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import elevationBareLand from '@/api/__fixtures__/elevation/elevation-aigues-juntes-09001-zc-148.json'
import elevationAiguesJuntes154 from '@/api/__fixtures__/elevation/elevation-aigues-juntes-09001-zc-154.json'
import elevationBordeaux from '@/api/__fixtures__/elevation/elevation-bordeaux-33063-kj-33.json'
import bdnbAmberieuNatural from '@/api/__fixtures__/bdnb/batiment-groupe-amberieu-01004-bi-724-none.json'
import bdnbAiguesJuntes154 from '@/api/__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-154.json'
import bdnbBareLand from '@/api/__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-148-bare-land.json'
import bdnbBordeaux from '@/api/__fixtures__/bdnb/batiment-groupe-bordeaux-33063-kj-33.json'
import bdnbInfo from '@/api/__fixtures__/bdnb/metadonnees-info.json'
import parcelBareLand from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelAiguesJuntes154 from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-154.json'
import parcelPleaux from '@/api/__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import parcelAmberieuEdge from '@/api/__fixtures__/cadastre/parcelle-amberieu-01004-bc-183.json'
import parcelAmberieuNatural from '@/api/__fixtures__/cadastre/parcelle-amberieu-01004-bi-724.json'
import parcelBordeaux from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelParis from '@/api/__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import ceremaAiguesJuntes from '@/api/__fixtures__/cerema/geomutations-aigues-juntes-09001-zc-148.json'
import ceremaBordeaux1 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-1.json'
import ceremaBordeaux2 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-2.json'
import ceremaBordeaux3 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-3.json'
import ceremaBordeaux4 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-4.json'
import ceremaBordeaux5 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-5.json'
import noFeature from '@/api/__fixtures__/gpu/no-feature.json'
import easementsAmberieuNatural from '@/api/__fixtures__/gpu/assiette-sup-s-amberieu-01004-bi-724.json'
import documentAmberieu from '@/api/__fixtures__/gpu/document-amberieu-01004.json'
import municipalityAmberieu from '@/api/__fixtures__/gpu/municipality-amberieu-01004.json'
import zonesAmberieuEdge from '@/api/__fixtures__/gpu/zone-urba-amberieu-01004-bc-183.json'
import zonesAmberieuNatural from '@/api/__fixtures__/gpu/zone-urba-amberieu-01004-bi-724.json'
import easementsBordeaux from '@/api/__fixtures__/gpu/assiette-sup-s-bordeaux-33063-kj-33.json'
import easementsParis from '@/api/__fixtures__/gpu/assiette-sup-s-paris-75107-bq-3.json'
import documentParis from '@/api/__fixtures__/gpu/document-paris-75107-bq-3.json'
import municipalityAiguesJuntes from '@/api/__fixtures__/gpu/municipality-aigues-juntes-09001-zc-148.json'
import documentPleaux from '@/api/__fixtures__/gpu/document-pleaux-15153-0f-262.json'
import municipalityPleaux from '@/api/__fixtures__/gpu/municipality-pleaux-15153-0f-262.json'
import sectorPleaux from '@/api/__fixtures__/gpu/secteur-cc-pleaux-15153-0f-262.json'
import municipalityBordeaux from '@/api/__fixtures__/gpu/municipality-bordeaux-33063-kj-33.json'
import municipalityParis from '@/api/__fixtures__/gpu/municipality-paris-75107-bq-3.json'
import prescriptionsBordeaux from '@/api/__fixtures__/gpu/prescription-surf-bordeaux-33063-kj-33.json'
import prescriptionsParis from '@/api/__fixtures__/gpu/prescription-surf-paris-75107-bq-3.json'
import zonesParis from '@/api/__fixtures__/gpu/zone-urba-paris-75107-bq-3.json'
import parcelCavity from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zb-153.json'
import parcelPollutedSoil from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-bo-368.json'
import parcelSeveso from '@/api/__fixtures__/cadastre/parcelle-feyzin-69276-bb-221.json'
import noResults from '@/api/__fixtures__/georisques/no-results.json'
import cavitiesCavity from '@/api/__fixtures__/georisques/cavites-aigues-juntes-09001-zb-153.json'
import aziAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-azi-09001.json'
import aziParis from '@/api/__fixtures__/georisques/gaspar-azi-75056.json'
import catnatAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-catnat-09001.json'
import catnatBordeaux from '@/api/__fixtures__/georisques/gaspar-catnat-33063.json'
import catnatParis from '@/api/__fixtures__/georisques/gaspar-catnat-75056.json'
import risksCavity from '@/api/__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zb-153.json'
import risksAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zc-148.json'
import risksBordeaux from '@/api/__fixtures__/georisques/gaspar-risques-bordeaux-33063-kj-33.json'
import risksParis from '@/api/__fixtures__/georisques/gaspar-risques-paris-75107-bq-3.json'
import triBordeaux from '@/api/__fixtures__/georisques/gaspar-tri-33063.json'
import triParis from '@/api/__fixtures__/georisques/gaspar-tri-75056.json'
import icpePollutedSoil from '@/api/__fixtures__/georisques/installations-classees-bordeaux-33063-bo-368.json'
import icpeBordeaux from '@/api/__fixtures__/georisques/installations-classees-bordeaux-33063-kj-33.json'
import icpeSeveso from '@/api/__fixtures__/georisques/installations-classees-feyzin-69276-bb-221.json'
import icpeParis from '@/api/__fixtures__/georisques/installations-classees-paris-75107-bq-3.json'
import radonAiguesJuntes from '@/api/__fixtures__/georisques/radon-09001.json'
import radonBordeaux from '@/api/__fixtures__/georisques/radon-33063.json'
import radonParis7e from '@/api/__fixtures__/georisques/radon-75107.json'
import rgaCavity from '@/api/__fixtures__/georisques/rga-aigues-juntes-09001-zb-153.json'
import rgaBareLand from '@/api/__fixtures__/georisques/rga-aigues-juntes-09001-zc-148.json'
import rgaPollutedSoil from '@/api/__fixtures__/georisques/rga-bordeaux-33063-bo-368.json'
import rgaBordeaux from '@/api/__fixtures__/georisques/rga-bordeaux-33063-kj-33.json'
import rgaSeveso from '@/api/__fixtures__/georisques/rga-feyzin-69276-bb-221.json'
import sspNoSite from '@/api/__fixtures__/georisques/ssp-no-site.json'
import sspPollutedSoil from '@/api/__fixtures__/georisques/ssp-bordeaux-33063-bo-368.json'
import sspBordeaux from '@/api/__fixtures__/georisques/ssp-bordeaux-33063-kj-33.json'
import sspSeveso from '@/api/__fixtures__/georisques/ssp-feyzin-69276-bb-221.json'
import sspParis from '@/api/__fixtures__/georisques/ssp-paris-75107-bq-3.json'
import seismicAiguesJuntes from '@/api/__fixtures__/georisques/zonage-sismique-09001.json'
import seismicBordeaux from '@/api/__fixtures__/georisques/zonage-sismique-33063.json'
import seismicParis7e from '@/api/__fixtures__/georisques/zonage-sismique-75107.json'
import { assembleSummary, type BlockState } from './summary'
import { CONTRIBUTIONS } from './contributions'

type GpuEndpoint =
  | 'zone-urba'
  | 'secteur-cc'
  | 'document'
  | 'municipality'
  | 'prescription-surf'
  | 'assiette-sup-s'
  | 'assiette-sup-l'
  | 'assiette-sup-p'

/** Routes of the API Carto GPU: an endpoint not provided answers as having no feature. */
function gpu(responses: Partial<Record<GpuEndpoint, unknown>>): FakeRoute[] {
  const endpoints: GpuEndpoint[] = [
    'zone-urba',
    'secteur-cc',
    'document',
    'municipality',
    'prescription-surf',
    'assiette-sup-s',
    'assiette-sup-l',
    'assiette-sup-p',
  ]
  return endpoints.map((endpoint) => ({ match: `/api/gpu/${endpoint}?`, body: responses[endpoint] ?? noFeature }))
}

type GeorisquesEndpoint =
  | 'rga'
  | 'cavites'
  | 'mvt'
  | 'ssp'
  | 'installations_classees'
  | 'gaspar/risques'
  | 'gaspar/azi'
  | 'gaspar/tri'
  | 'zonage_sismique'
  | 'radon'
  | 'gaspar/catnat'

/** Routes of Géorisques: an endpoint not provided answers with no results (`rga`: empty body). */
function georisques(responses: Partial<Record<GeorisquesEndpoint, unknown>>): FakeRoute[] {
  const endpoints: GeorisquesEndpoint[] = [
    'rga',
    'cavites',
    'mvt',
    'ssp',
    'installations_classees',
    'gaspar/risques',
    'gaspar/azi',
    'gaspar/tri',
    'zonage_sismique',
    'radon',
    'gaspar/catnat',
  ]
  return endpoints.map((endpoint) => {
    const match = `/api/v1/${endpoint}?`
    if (responses[endpoint] !== undefined) return { match, body: responses[endpoint] }
    if (endpoint === 'rga') return { match, body: '' }
    return { match, body: endpoint === 'ssp' ? sspNoSite : noResults }
  })
}

/** Géorisques at Aigues-Juntes (09001): shared municipality responses, point responses to choose. */
function aiguesJuntesGeorisques(rga: unknown, responses: Partial<Record<GeorisquesEndpoint, unknown>> = {}) {
  return georisques({
    rga,
    'gaspar/risques': risksAiguesJuntes,
    'gaspar/azi': aziAiguesJuntes,
    zonage_sismique: seismicAiguesJuntes,
    radon: radonAiguesJuntes,
    'gaspar/catnat': catnatAiguesJuntes,
    ...responses,
  })
}

/**
 * The summary of a parcel as the report composes it: each block goes through its loader, and
 * the one that fails is seen as the report sees it, in error. The `pending` blocks are seen as
 * still loading.
 */
async function summaryOf(fetch: Fetch, idu: string, { pending = [] }: { pending?: string[] } = {}) {
  const parcel = await loadParcel(fetch, idu)
  const blocks = await Promise.all(
    CONTRIBUTIONS.map(({ block, load, facts }) =>
      pending.includes(block) ? { status: 'pending' as const } : load(fetch, parcel).then(
        (data): BlockState => ({ status: 'success', data: facts(data) }),
        (): BlockState => ({ status: 'error' }),
      ),
    ),
  )
  return assembleSummary(blocks)
}

const bordeaux = [
  { match: 'cadastre/parcelle', body: parcelBordeaux },
  ...gpu({
    municipality: municipalityBordeaux,
    'prescription-surf': prescriptionsBordeaux,
    'assiette-sup-s': easementsBordeaux,
  }),
  { match: 'bdnb/donnees', body: bdnbBordeaux },
  { match: 'bdnb/metadonnees/info', body: bdnbInfo },
  { match: 'altimetrie', body: elevationBordeaux },
  // Medium clay, flood risk area, former sites and ordinary installations around: caution at
  // most, nothing that rises to the top of the report.
  ...georisques({
    rga: rgaBordeaux,
    ssp: sspBordeaux,
    installations_classees: icpeBordeaux,
    'gaspar/risques': risksBordeaux,
    'gaspar/tri': triBordeaux,
    zonage_sismique: seismicBordeaux,
    radon: radonBordeaux,
    'gaspar/catnat': catnatBordeaux,
  }),
  // Pages 2 to 5 first: the first page is the only URL without `page=`.
  ...[ceremaBordeaux2, ceremaBordeaux3, ceremaBordeaux4, ceremaBordeaux5].map((body, i) => ({
    match: new RegExp(`apidf-preprod\\.cerema\\.fr/.*page=${i + 2}&`),
    body,
  })),
  { match: 'apidf-preprod.cerema.fr', body: ceremaBordeaux1 },
]

beforeAll(() => {
  // The sales kept are those of the last five years.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-11T12:00:00+02:00'))
})

describe('report summary', () => {
  it('puts the facts of each block into plain words, in block order, each with its alert level', async () => {
    const summary = await summaryOf(fakeFetch(bordeaux), '33063000KJ0033')

    expect(summary).toEqual({
      loading: false,
      facts: [
        { id: 'area', label: 'Surface', value: '131 m²', level: 'info' },
        {
          id: 'zone',
          label: 'Zone d’urbanisme',
          value: 'Aucune zone publiée',
          level: 'caution',
          detail:
            'Souvent un secteur sauvegardé dont le plan n’est pas en ligne : la mairie indique les règles qui s’y appliquent.',
        },
        // Only apartments have enough simple sales: four houses do not make a median.
        {
          id: 'price-apartment',
          label: 'Prix médian au m², appartements',
          value: '4 125 €/m² · 7 ventes',
          level: 'info',
          detail:
            'Médiane des ventes simples d’appartements à moins de 500 m depuis 2021 : un repère du voisinage, pas une estimation de la parcelle.',
        },
        {
          id: 'buildings',
          label: 'Bâti',
          value: '1 bâtiment recensé',
          level: 'info',
          detail: 'Construit en 1850 selon la BDNB.',
        },
      ],
    })
  })

  it('composes the summary without waiting for a block still loading, signaling that more facts may come', async () => {
    const summary = await summaryOf(fakeFetch(bordeaux), '33063000KJ0033', { pending: ['planning'] })

    expect(summary.loading).toBe(true)
    expect(summary.facts.map(({ id }) => id)).toEqual(['area', 'price-apartment', 'buildings'])
  })

  it('composes the summary without the block in error, and explains the PLU zone and the ABF perimeter', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelParis },
      ...gpu({
        'zone-urba': zonesParis,
        document: documentParis,
        municipality: municipalityParis,
        'prescription-surf': prescriptionsParis,
        'assiette-sup-s': easementsParis,
      }),
      { match: 'bdnb/donnees', status: 500, body: 'Internal Server Error' },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      ...georisques({
        ssp: sspParis,
        installations_classees: icpeParis,
        'gaspar/risques': risksParis,
        'gaspar/azi': aziParis,
        'gaspar/tri': triParis,
        zonage_sismique: seismicParis7e,
        radon: radonParis7e,
        'gaspar/catnat': catnatParis,
      }),
    ])

    const summary = await summaryOf(fetch, '75107000BQ0003')

    expect(summary).toEqual({
      loading: false,
      facts: [
        { id: 'area', label: 'Surface', value: '8 215 m²', level: 'info' },
        {
          id: 'zone',
          label: 'Zone d’urbanisme',
          value: 'UG · Zone urbaine générale',
          level: 'info',
          detail: 'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment.',
        },
        {
          id: 'abf-perimeter',
          label: 'Périmètre ABF',
          value: 'Abords de 11 monuments historiques',
          level: 'caution',
          detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
        },
      ],
    })
  })

  it('says nothing of a block with nothing to report, like land with no listed building or too few sales around', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelBareLand },
      ...gpu({ municipality: municipalityAiguesJuntes }),
      { match: 'bdnb/donnees', body: bdnbBareLand },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      { match: 'altimetrie', body: elevationBareLand },
      ...aiguesJuntesGeorisques(rgaBareLand),
      { match: 'apidf-preprod.cerema.fr', body: ceremaAiguesJuntes },
    ])

    const summary = await summaryOf(fetch, '09001000ZC0148')

    expect(summary).toEqual({
      loading: false,
      facts: [
        { id: 'area', label: 'Surface', value: '696 m²', level: 'info' },
        {
          id: 'zone',
          label: 'Zone d’urbanisme',
          value: 'Règlement national d’urbanisme',
          level: 'caution',
          detail:
            'La commune n’a ni PLU ni carte communale : les règles générales du code de l’urbanisme s’appliquent, et limitent les constructions nouvelles hors des parties déjà urbanisées.',
        },
        {
          id: 'risk-clay',
          label: 'Retrait-gonflement des argiles',
          value: 'Exposition forte',
          level: 'alert',
          detail:
            'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
        },
      ],
    })
  })

  it('raises each risk at alert level, like a cavity on the parcel, but not those at caution level', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelCavity },
      ...aiguesJuntesGeorisques(rgaCavity, { cavites: cavitiesCavity, 'gaspar/risques': risksCavity }),
    ])

    const summary = await summaryOf(fetch, '09001000ZB0153')

    // The municipality's moderate seismicity (caution) stays in the Risks block.
    expect(summary.facts.filter(({ id }) => id.startsWith('risk-'))).toEqual([
      {
        id: 'risk-clay',
        label: 'Retrait-gonflement des argiles',
        value: 'Exposition forte',
        level: 'alert',
        detail:
          'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
      },
      {
        id: 'risk-cavities',
        label: 'Cavités souterraines',
        value: '1 recensée à moins de 500 m',
        level: 'alert',
        detail: 'Une cavité est recensée sur la parcelle ou à moins de 100 m : le sol peut s’y affaisser ou s’effondrer.',
      },
    ])
  })

  it('puts at alert level a very close polluted soil and an upper-tier Seveso site within 1 km', async () => {
    const pollutedSoil = await summaryOf(
      fakeFetch([
        { match: 'cadastre/parcelle', body: parcelPollutedSoil },
        ...georisques({ rga: rgaPollutedSoil, ssp: sspPollutedSoil, installations_classees: icpePollutedSoil }),
      ]),
      '33063000BO0368',
    )
    const seveso = await summaryOf(
      fakeFetch([
        { match: 'cadastre/parcelle', body: parcelSeveso },
        ...georisques({ rga: rgaSeveso, ssp: sspSeveso, installations_classees: icpeSeveso }),
      ]),
      '69276000BB0221',
    )

    expect(pollutedSoil.facts.filter(({ id }) => id.startsWith('risk-'))).toEqual([
      {
        id: 'risk-polluted-soils',
        label: 'Sols pollués',
        value: '4 sites à moins de 500 m',
        level: 'alert',
        detail:
          'Un sol pollué est recensé sur la parcelle ou à moins de 100 m : y construire peut exiger une étude de sol et des précautions d’usage.',
      },
    ])
    expect(seveso.facts.filter(({ id }) => id.startsWith('risk-'))).toEqual([
      {
        id: 'risk-classified-installations',
        label: 'Installations classées',
        value: '5 à moins de 1 km',
        level: 'alert',
        detail:
          'Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de 1 km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.',
      },
    ])
  })

  it('puts a natural zone at alert level, and names the monument whose surroundings the parcel is in', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelAmberieuNatural },
      ...gpu({
        'zone-urba': zonesAmberieuNatural,
        document: documentAmberieu,
        municipality: municipalityAmberieu,
        'assiette-sup-s': easementsAmberieuNatural,
      }),
      { match: 'bdnb/donnees', body: bdnbAmberieuNatural },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
    ])

    const summary = await summaryOf(fetch, '01004000BI0724')

    expect(summary.facts).toEqual([
      { id: 'area', label: 'Surface', value: '30 694 m²', level: 'info' },
      {
        id: 'zone',
        label: 'Zone d’urbanisme',
        value: 'N · Secteur naturel',
        level: 'alert',
        detail:
          'Zone naturelle : secteur protégé pour ses milieux ou ses paysages, où les constructions sont strictement encadrées.',
      },
      {
        id: 'abf-perimeter',
        label: 'Périmètre ABF',
        value: 'Abords de « Maison forte de Saint-Germain ; Ruines du castrum »',
        level: 'caution',
        detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
      },
    ])
  })

  it('gives a parcel straddling zones the level of its most restrictive zone, saying what share lies in it', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelAmberieuEdge },
      ...gpu({ 'zone-urba': zonesAmberieuEdge, document: documentAmberieu, municipality: municipalityAmberieu }),
    ])

    const summary = await summaryOf(fetch, '01004000BC0183')

    // Shares measured on the parcel: 89.7 % in UCj, 10.3 % in N.
    expect(summary.facts.find(({ id }) => id === 'zone')).toEqual({
      id: 'zone',
      label: 'Zone d’urbanisme',
      value: 'UCj · Secteur résidentiel aux enjeux de continuité écologique',
      level: 'alert',
      detail:
        'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment. 10 % de la parcelle est en N · Secteur naturel (zone naturelle).',
    })
  })

  it('explains the sector of a municipal map', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelPleaux },
      ...gpu({ 'secteur-cc': sectorPleaux, document: documentPleaux, municipality: municipalityPleaux }),
    ])

    const summary = await summaryOf(fetch, '151530000F0262')

    expect(summary.facts.find(({ id }) => id === 'zone')).toEqual({
      id: 'zone',
      label: 'Zone d’urbanisme',
      value: 'U',
      level: 'info',
      detail:
        'Secteur de carte communale où les constructions sont admises, selon les règles générales du code de l’urbanisme.',
    })
  })

  it('counts the buildings when the BDNB lists several on the parcel', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelAiguesJuntes154 },
      ...gpu({ municipality: municipalityAiguesJuntes }),
      { match: 'bdnb/donnees', body: bdnbAiguesJuntes154 },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      { match: 'altimetrie', body: elevationAiguesJuntes154 },
    ])

    const summary = await summaryOf(fetch, '09001000ZC0154')

    expect(summary.facts.find(({ id }) => id === 'buildings')).toEqual({
      id: 'buildings',
      label: 'Bâti',
      value: '3 bâtiments recensés',
      level: 'info',
    })
  })
})
