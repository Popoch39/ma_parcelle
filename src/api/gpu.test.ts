import { assert, describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadParcel } from './cadastre'
import { loadPlanning } from './gpu'
import parcelAiguesJuntes from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelAmberieuStrip from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-192.json'
import parcelAmberieuGrazed from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-233.json'
import parcelAmberieuStraddling from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-250.json'
import parcelBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelIleDOlonne from './__fixtures__/cadastre/parcelle-ile-d-olonne-85112-aa-139.json'
import parcelParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import parcelPleaux from './__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import noFeature from './__fixtures__/gpu/no-feature.json'
import easementsBordeaux from './__fixtures__/gpu/assiette-sup-s-bordeaux-33063-kj-33.json'
import linearEasementsIleDOlonne from './__fixtures__/gpu/assiette-sup-l-ile-d-olonne-85112-aa-139.json'
import easementsParis from './__fixtures__/gpu/assiette-sup-s-paris-75107-bq-3.json'
import documentPleaux from './__fixtures__/gpu/document-pleaux-15153-0f-262.json'
import municipalityAiguesJuntes from './__fixtures__/gpu/municipality-aigues-juntes-09001-zc-148.json'
import municipalityAmberieu from './__fixtures__/gpu/municipality-amberieu-01004.json'
import municipalityBordeaux from './__fixtures__/gpu/municipality-bordeaux-33063-kj-33.json'
import municipalityPleaux from './__fixtures__/gpu/municipality-pleaux-15153-0f-262.json'
import sectorPleaux from './__fixtures__/gpu/secteur-cc-pleaux-15153-0f-262.json'
import documentAmberieu from './__fixtures__/gpu/document-amberieu-01004.json'
import documentParis from './__fixtures__/gpu/document-paris-75107-bq-3.json'
import municipalityParis from './__fixtures__/gpu/municipality-paris-75107-bq-3.json'
import prescriptionsAmberieuGrazed from './__fixtures__/gpu/prescription-surf-amberieu-01004-ab-233.json'
import prescriptionsAmberieuStraddling from './__fixtures__/gpu/prescription-surf-amberieu-01004-ab-250.json'
import prescriptionsBordeaux from './__fixtures__/gpu/prescription-surf-bordeaux-33063-kj-33.json'
import prescriptionsParis from './__fixtures__/gpu/prescription-surf-paris-75107-bq-3.json'
import zonesAmberieuStrip from './__fixtures__/gpu/zone-urba-amberieu-01004-ab-192.json'
import zonesAmberieuStraddling from './__fixtures__/gpu/zone-urba-amberieu-01004-ab-250.json'
import zonesParis from './__fixtures__/gpu/zone-urba-paris-75107-bq-3.json'

type Endpoint =
  | 'zone-urba'
  | 'secteur-cc'
  | 'document'
  | 'municipality'
  | 'prescription-surf'
  | 'assiette-sup-s'
  | 'assiette-sup-l'
  | 'assiette-sup-p'

/**
 * Fake fetch of the API Carto GPU: an endpoint not provided responds as if it had no feature,
 * a failing endpoint responds like the API when its gateway gives up on a request that is too slow.
 */
function gpu(responses: Partial<Record<Endpoint, unknown>>, failures: Endpoint[] = []) {
  const endpoints: Endpoint[] = [
    'zone-urba',
    'secteur-cc',
    'document',
    'municipality',
    'prescription-surf',
    'assiette-sup-s',
    'assiette-sup-l',
    'assiette-sup-p',
  ]
  return fakeFetch(
    endpoints.map((endpoint) =>
      failures.includes(endpoint)
        ? { match: `/api/gpu/${endpoint}?`, status: 504, body: 'Gateway Time-out' }
        : { match: `/api/gpu/${endpoint}?`, body: responses[endpoint] ?? noFeature },
    ),
  )
}

/** The parcel as the Cadastre block provides it, from a real cadastre response. */
function parcelOf(cadastre: { features: Array<{ properties: { idu: string } }> }) {
  return loadParcel(fakeFetch([{ match: 'cadastre/parcelle', body: cadastre }]), cadastre.features[0].properties.idu)
}

const paris = {
  'zone-urba': zonesParis,
  document: documentParis,
  municipality: municipalityParis,
  'prescription-surf': prescriptionsParis,
  'assiette-sup-s': easementsParis,
}

describe('loadPlanning', () => {
  it('describes the PLU zone that covers the parcel, its document and the link to its rules', async () => {
    const parcel = await parcelOf(parcelParis)

    const planning = await loadPlanning(gpu(paris), parcel)

    expect(planning.regulation).toEqual({
      regime: 'document',
      document: {
        type: 'PLU',
        typeLabel: 'Plan local d’urbanisme',
        name: 'PARIS',
        link: 'https://www.geoportail-urbanisme.gouv.fr/document/by-id/ab895285a1be6ca045127a6bb628cfaa',
      },
      zones: [
        {
          code: 'UG',
          label: 'Zone urbaine générale',
          type: 'U',
          family: 'zone urbaine',
          share: 1,
          rules:
            'https://data.geopf.fr/annexes/gpu/documents/DU_75056/ab895285a1be6ca045127a6bb628cfaa/75056_reglement_20260616.pdf',
          geometry: zonesParis.features[0].geometry,
        },
      ],
    })
  })

  it('lists the document prescriptions that touch the parcel', async () => {
    const parcel = await parcelOf(parcelParis)

    const planning = await loadPlanning(gpu(paris), parcel)

    expect(planning.prescriptions).toEqual([
      { label: 'Sous-secteur de maintien des constinuités écologiques', text: null },
      { label: 'Hauteur plafond', text: null },
      { label: 'Fuseau de protection du ste de Paris', text: null },
    ])
  })

  it('reports a municipality under the national planning rules (RNU), without its own document', async () => {
    const parcel = await parcelOf(parcelAiguesJuntes)

    const planning = await loadPlanning(gpu({ municipality: municipalityAiguesJuntes }), parcel)

    expect(planning).toEqual({
      regulation: { regime: 'rnu' },
      prescriptions: [],
      easements: [],
      abfPerimeter: null,
    })
  })

  it('describes the sector of a municipal map, which has no written rules', async () => {
    const parcel = await parcelOf(parcelPleaux)

    const planning = await loadPlanning(
      gpu({ 'secteur-cc': sectorPleaux, document: documentPleaux, municipality: municipalityPleaux }),
      parcel,
    )

    expect(planning.regulation).toEqual({
      regime: 'document',
      document: {
        type: 'CC',
        typeLabel: 'Carte communale',
        name: 'PLEAUX',
        link: 'https://www.geoportail-urbanisme.gouv.fr/document/by-id/d77e98e241cf74bc3cc2786300e7ed20',
      },
      zones: [
        {
          code: 'U',
          label: null,
          type: '01',
          family: 'secteur constructible',
          share: 1,
          rules: null,
          geometry: sectorPleaux.features[0].geometry,
        },
      ],
    })
  })

  it('reports a sector with no published zone, like a safeguarded sector, without hiding its prescriptions or its easements', async () => {
    const parcel = await parcelOf(parcelBordeaux)

    const planning = await loadPlanning(
      gpu({
        municipality: municipalityBordeaux,
        'prescription-surf': prescriptionsBordeaux,
        'assiette-sup-s': easementsBordeaux,
      }),
      parcel,
    )

    expect(planning).toEqual({
      regulation: { regime: 'no-zone' },
      prescriptions: [{ label: 'Indice de stationnement', text: 'VRE' }],
      easements: [
        {
          id: 'AC4-172014607-1911140376-1-1',
          code: 'AC4',
          category: 'Site patrimonial remarquable',
          name: 'Site Patrimonial Remarquable de Bordeaux',
          geometry: easementsBordeaux.features[0].geometry,
        },
      ],
      abfPerimeter: null,
    })
  })

  it('ignores a neighboring zone that only grazes the edge of the parcel', async () => {
    const parcel = await parcelOf(parcelAmberieuStrip)

    const planning = await loadPlanning(
      gpu({ 'zone-urba': zonesAmberieuStrip, document: documentAmberieu, municipality: municipalityAmberieu }),
      parcel,
    )

    assert(planning.regulation.regime === 'document')
    const [zone, ...others] = planning.regulation.zones
    expect(zone).toMatchObject({ code: 'UC', family: 'zone urbaine' })
    expect(zone.share).toBeGreaterThan(0.98)
    expect(others).toEqual([])
  })

  it('ranks the zones of a straddling parcel from the largest to the smallest, with their share', async () => {
    const parcel = await parcelOf(parcelAmberieuStraddling)

    const planning = await loadPlanning(
      gpu({ 'zone-urba': zonesAmberieuStraddling, document: documentAmberieu, municipality: municipalityAmberieu }),
      parcel,
    )

    assert(planning.regulation.regime === 'document')
    const [uc, uba, ...others] = planning.regulation.zones
    // Shares measured on a fine sampling (1,600 points) of the parcel: 83.3 % and 16.7 %.
    expect(uc).toMatchObject({ code: 'UC', label: 'Secteur à dominante résidentielle' })
    expect(uc.share).toBeCloseTo(0.83, 1)
    expect(uba).toMatchObject({ code: 'UBa' })
    expect(uba.share).toBeCloseTo(0.17, 1)
    expect(others).toEqual([])
  })

  it('ignores the prescriptions that only graze the edge of the parcel', async () => {
    const parcel = await parcelOf(parcelAmberieuGrazed)

    const planning = await loadPlanning(
      gpu({ 'prescription-surf': prescriptionsAmberieuGrazed, municipality: municipalityAmberieu }),
      parcel,
    )

    // Four « hauteur maximale 6m » features touch the parcel, none over more than 0.3 % of its area.
    expect(planning.prescriptions).toEqual([])
  })

  it('lists only once a prescription split into several features', async () => {
    const parcel = await parcelOf(parcelAmberieuStraddling)

    const planning = await loadPlanning(
      gpu({ 'prescription-surf': prescriptionsAmberieuStraddling, municipality: municipalityAmberieu }),
      parcel,
    )

    // Four « hauteur maximale 9m » features: two share the parcel, two only touch its edge.
    expect(planning.prescriptions).toEqual([{ label: 'hauteur maximale 9m', text: null }])
  })

  it('lists the easements that touch the parcel, with their category in plain words, their code and what they protect', async () => {
    const parcel = await parcelOf(parcelParis)

    const planning = await loadPlanning(gpu(paris), parcel)

    // The monument itself and the roads of the 7th only touch the edge of the parcel.
    expect(planning.easements?.map(({ code, category, name }) => ({ code, category, name }))).toEqual([
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel de Jarnac (ancien)' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel Brongniart' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Église Saint-François-Xavier' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel de Bourbon Condé (ancien)' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel de Richepanse (ancien)' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Ecole Militaire' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Ministère de la Marine Marchande' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Immeuble' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel de Beaumont' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel des Invalides' },
      { code: 'AC1', category: 'Abords de monument historique', name: 'Hôtel Montesquiou-Fezensac' },
      { code: 'AC2', category: 'Site inscrit ou classé', name: 'Ensemble urbain à Paris' },
    ])
  })

  it('reports the ABF perimeter when the parcel is in the surroundings of historic monuments, naming them', async () => {
    const parcel = await parcelOf(parcelParis)

    const planning = await loadPlanning(gpu(paris), parcel)

    expect(planning.abfPerimeter).toEqual({
      monuments: [
        'Hôtel de Jarnac (ancien)',
        'Hôtel Brongniart',
        'Église Saint-François-Xavier',
        'Hôtel de Bourbon Condé (ancien)',
        'Hôtel de Richepanse (ancien)',
        'Ecole Militaire',
        'Ministère de la Marine Marchande',
        'Immeuble',
        'Hôtel de Beaumont',
        'Hôtel des Invalides',
        'Hôtel Montesquiou-Fezensac',
      ],
    })
  })

  it('reports no ABF perimeter outside the surroundings of a historic monument, even in a remarkable heritage site', async () => {
    const parcel = await parcelOf(parcelBordeaux)

    const planning = await loadPlanning(
      gpu({ municipality: municipalityBordeaux, 'assiette-sup-s': easementsBordeaux }),
      parcel,
    )

    expect(planning.abfPerimeter).toBeNull()
  })

  it('has neither easement nor ABF perimeter for a parcel that no easement touches', async () => {
    const parcel = await parcelOf(parcelAiguesJuntes)

    // Real API response for this parcel: no easement footprint.
    const planning = await loadPlanning(
      gpu({ municipality: municipalityAiguesJuntes, 'assiette-sup-s': noFeature }),
      parcel,
    )

    expect(planning.easements).toEqual([])
    expect(planning.abfPerimeter).toBeNull()
  })

  it('also lists linear easements, like the alignment of a road running along the parcel', async () => {
    const parcel = await parcelOf(parcelIleDOlonne)

    const planning = await loadPlanning(gpu({ 'assiette-sup-l': linearEasementsIleDOlonne }), parcel)

    expect(planning.easements).toEqual([
      {
        id: 'EL7-200071165-01-07-01',
        code: 'EL7',
        category: 'Alignement des voies publiques',
        name: null,
        geometry: linearEasementsIleDOlonne.features[0].geometry,
      },
    ])
  })

  describe('when a Géoportail de l’urbanisme service does not respond', () => {
    it('keeps the zone and the easements, and reports the prescriptions as unavailable', async () => {
      const parcel = await parcelOf(parcelParis)

      const planning = await loadPlanning(gpu(paris, ['prescription-surf']), parcel)

      expect(planning.prescriptions).toBeNull()
      expect(planning.regulation).toMatchObject({ regime: 'document', zones: [{ code: 'UG' }] })
      expect(planning.easements).toHaveLength(12)
      expect(planning.abfPerimeter?.monuments).toHaveLength(11)
    })

    it('keeps the zone and the prescriptions, and reports the easements as unavailable, ABF perimeter included', async () => {
      const parcel = await parcelOf(parcelParis)

      const planning = await loadPlanning(gpu(paris, ['assiette-sup-l']), parcel)

      expect(planning.easements).toBeNull()
      expect(planning.abfPerimeter).toBeNull()
      expect(planning.prescriptions).toHaveLength(3)
      expect(planning.regulation).toMatchObject({ regime: 'document', zones: [{ code: 'UG' }] })
    })

    it.each<Endpoint>(['zone-urba', 'secteur-cc', 'document', 'municipality'])(
      'fails without "%s", without which the rule that applies to the parcel stays unknown',
      async (endpoint) => {
        const parcel = await parcelOf(parcelParis)

        const planning = loadPlanning(gpu(paris, [endpoint]), parcel)

        await expect(planning).rejects.toMatchObject({ name: 'ApiError', kind: 'http', status: 504 })
      },
    )
  })

  it('queries zone, sector, document, municipality, prescriptions and easements by the parcel geometry, never the easement deeds', async () => {
    const parcel = await parcelOf(parcelParis)
    const fetch = gpu(paris)

    await loadPlanning(fetch, parcel)

    const urls = fetch.calls.map((call) => new URL(call))
    expect(urls.map(({ pathname }) => pathname).sort()).toEqual([
      '/api/gpu/assiette-sup-l',
      '/api/gpu/assiette-sup-p',
      '/api/gpu/assiette-sup-s',
      '/api/gpu/document',
      '/api/gpu/municipality',
      '/api/gpu/prescription-surf',
      '/api/gpu/secteur-cc',
      '/api/gpu/zone-urba',
    ])
    for (const url of urls) {
      expect(url.origin).toBe('https://apicarto.ign.fr')
      expect(JSON.parse(url.searchParams.get('geom') ?? '')).toEqual(parcelParis.features[0].geometry)
    }
  })
})
