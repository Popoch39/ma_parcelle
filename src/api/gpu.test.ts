import { assert, describe, expect, it } from 'vitest'
import { fakeFetch } from '@/test/fake-fetch'
import { loadParcelle } from './cadastre'
import { loadUrbanisme } from './gpu'
import parcelleAiguesJuntes from './__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleAmberieuLisere from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-192.json'
import parcelleAmberieuEffleuree from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-233.json'
import parcelleAmberieuCheval from './__fixtures__/cadastre/parcelle-amberieu-01004-ab-250.json'
import parcelleBordeaux from './__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelleParis from './__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import parcellePleaux from './__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import aucunObjet from './__fixtures__/gpu/aucun-objet.json'
import servitudesBordeaux from './__fixtures__/gpu/assiette-sup-s-bordeaux-33063-kj-33.json'
import servitudesParis from './__fixtures__/gpu/assiette-sup-s-paris-75107-bq-3.json'
import documentPleaux from './__fixtures__/gpu/document-pleaux-15153-0f-262.json'
import municipalityAiguesJuntes from './__fixtures__/gpu/municipality-aigues-juntes-09001-zc-148.json'
import municipalityAmberieu from './__fixtures__/gpu/municipality-amberieu-01004.json'
import municipalityBordeaux from './__fixtures__/gpu/municipality-bordeaux-33063-kj-33.json'
import municipalityPleaux from './__fixtures__/gpu/municipality-pleaux-15153-0f-262.json'
import secteurPleaux from './__fixtures__/gpu/secteur-cc-pleaux-15153-0f-262.json'
import documentAmberieu from './__fixtures__/gpu/document-amberieu-01004.json'
import documentParis from './__fixtures__/gpu/document-paris-75107-bq-3.json'
import municipalityParis from './__fixtures__/gpu/municipality-paris-75107-bq-3.json'
import prescriptionsAmberieuEffleuree from './__fixtures__/gpu/prescription-surf-amberieu-01004-ab-233.json'
import prescriptionsAmberieuCheval from './__fixtures__/gpu/prescription-surf-amberieu-01004-ab-250.json'
import prescriptionsBordeaux from './__fixtures__/gpu/prescription-surf-bordeaux-33063-kj-33.json'
import prescriptionsParis from './__fixtures__/gpu/prescription-surf-paris-75107-bq-3.json'
import zonesAmberieuLisere from './__fixtures__/gpu/zone-urba-amberieu-01004-ab-192.json'
import zonesAmberieuCheval from './__fixtures__/gpu/zone-urba-amberieu-01004-ab-250.json'
import zonesParis from './__fixtures__/gpu/zone-urba-paris-75107-bq-3.json'

type Endpoint = 'zone-urba' | 'secteur-cc' | 'document' | 'municipality' | 'prescription-surf' | 'assiette-sup-s'

/** Faux fetch de l'API Carto GPU : un endpoint non fourni répond comme sans objet. */
function gpu(responses: Partial<Record<Endpoint, unknown>>) {
  const endpoints: Endpoint[] = [
    'zone-urba',
    'secteur-cc',
    'document',
    'municipality',
    'prescription-surf',
    'assiette-sup-s',
  ]
  return fakeFetch(
    endpoints.map((endpoint) => ({ match: `/api/gpu/${endpoint}?`, body: responses[endpoint] ?? aucunObjet })),
  )
}

/** La parcelle telle que le bloc Cadastre la fournit, depuis une réponse réelle du cadastre. */
function parcelleDe(cadastre: { features: Array<{ properties: { idu: string } }> }) {
  return loadParcelle(fakeFetch([{ match: 'cadastre/parcelle', body: cadastre }]), cadastre.features[0].properties.idu)
}

const paris = {
  'zone-urba': zonesParis,
  document: documentParis,
  municipality: municipalityParis,
  'prescription-surf': prescriptionsParis,
  'assiette-sup-s': servitudesParis,
}

describe('loadUrbanisme', () => {
  it('décrit la zone du PLU qui couvre la parcelle, son document et le lien vers son règlement', async () => {
    const parcelle = await parcelleDe(parcelleParis)

    const urbanisme = await loadUrbanisme(gpu(paris), parcelle)

    expect(urbanisme.reglementation).toEqual({
      regime: 'document',
      document: {
        type: 'PLU',
        libelleType: 'Plan local d’urbanisme',
        nom: 'PARIS',
        lien: 'https://www.geoportail-urbanisme.gouv.fr/document/by-id/ab895285a1be6ca045127a6bb628cfaa',
      },
      zones: [
        {
          code: 'UG',
          libelle: 'Zone urbaine générale',
          type: 'U',
          famille: 'zone urbaine',
          part: 1,
          reglement:
            'https://data.geopf.fr/annexes/gpu/documents/DU_75056/ab895285a1be6ca045127a6bb628cfaa/75056_reglement_20260616.pdf',
          geometrie: zonesParis.features[0].geometry,
        },
      ],
    })
  })

  it('liste les prescriptions du document qui touchent la parcelle', async () => {
    const parcelle = await parcelleDe(parcelleParis)

    const urbanisme = await loadUrbanisme(gpu(paris), parcelle)

    expect(urbanisme.prescriptions).toEqual([
      { libelle: 'Sous-secteur de maintien des constinuités écologiques', texte: null },
      { libelle: 'Hauteur plafond', texte: null },
      { libelle: 'Fuseau de protection du ste de Paris', texte: null },
    ])
  })

  it('signale une commune au règlement national d’urbanisme, sans document propre', async () => {
    const parcelle = await parcelleDe(parcelleAiguesJuntes)

    const urbanisme = await loadUrbanisme(gpu({ municipality: municipalityAiguesJuntes }), parcelle)

    expect(urbanisme).toEqual({
      reglementation: { regime: 'rnu' },
      prescriptions: [],
      servitudes: [],
      perimetreAbf: null,
    })
  })

  it('décrit le secteur d’une carte communale, qui n’a pas de règlement écrit', async () => {
    const parcelle = await parcelleDe(parcellePleaux)

    const urbanisme = await loadUrbanisme(
      gpu({ 'secteur-cc': secteurPleaux, document: documentPleaux, municipality: municipalityPleaux }),
      parcelle,
    )

    expect(urbanisme.reglementation).toEqual({
      regime: 'document',
      document: {
        type: 'CC',
        libelleType: 'Carte communale',
        nom: 'PLEAUX',
        lien: 'https://www.geoportail-urbanisme.gouv.fr/document/by-id/d77e98e241cf74bc3cc2786300e7ed20',
      },
      zones: [
        {
          code: 'U',
          libelle: null,
          type: '01',
          famille: 'secteur constructible',
          part: 1,
          reglement: null,
          geometrie: secteurPleaux.features[0].geometry,
        },
      ],
    })
  })

  it('signale un secteur sans zone publiée, comme un secteur sauvegardé, sans taire ses prescriptions ni ses servitudes', async () => {
    const parcelle = await parcelleDe(parcelleBordeaux)

    const urbanisme = await loadUrbanisme(
      gpu({
        municipality: municipalityBordeaux,
        'prescription-surf': prescriptionsBordeaux,
        'assiette-sup-s': servitudesBordeaux,
      }),
      parcelle,
    )

    expect(urbanisme).toEqual({
      reglementation: { regime: 'sans-zone' },
      prescriptions: [{ libelle: 'Indice de stationnement', texte: 'VRE' }],
      servitudes: [
        {
          id: 'AC4-172014607-1911140376-1-1',
          code: 'AC4',
          categorie: 'Site patrimonial remarquable',
          nom: 'Site Patrimonial Remarquable de Bordeaux',
          geometrie: servitudesBordeaux.features[0].geometry,
        },
      ],
      perimetreAbf: null,
    })
  })

  it('ignore une zone voisine qui ne fait qu’effleurer le bord de la parcelle', async () => {
    const parcelle = await parcelleDe(parcelleAmberieuLisere)

    const urbanisme = await loadUrbanisme(
      gpu({ 'zone-urba': zonesAmberieuLisere, document: documentAmberieu, municipality: municipalityAmberieu }),
      parcelle,
    )

    assert(urbanisme.reglementation.regime === 'document')
    const [zone, ...autres] = urbanisme.reglementation.zones
    expect(zone).toMatchObject({ code: 'UC', famille: 'zone urbaine' })
    expect(zone.part).toBeGreaterThan(0.98)
    expect(autres).toEqual([])
  })

  it('classe les zones d’une parcelle à cheval de la plus étendue à la moins étendue, avec leur part', async () => {
    const parcelle = await parcelleDe(parcelleAmberieuCheval)

    const urbanisme = await loadUrbanisme(
      gpu({ 'zone-urba': zonesAmberieuCheval, document: documentAmberieu, municipality: municipalityAmberieu }),
      parcelle,
    )

    assert(urbanisme.reglementation.regime === 'document')
    const [uc, uba, ...autres] = urbanisme.reglementation.zones
    // Parts mesurées sur un échantillonnage fin (1 600 points) de la parcelle : 83,3 % et 16,7 %.
    expect(uc).toMatchObject({ code: 'UC', libelle: 'Secteur à dominante résidentielle' })
    expect(uc.part).toBeCloseTo(0.83, 1)
    expect(uba).toMatchObject({ code: 'UBa' })
    expect(uba.part).toBeCloseTo(0.17, 1)
    expect(autres).toEqual([])
  })

  it('ignore les prescriptions qui ne font qu’effleurer le bord de la parcelle', async () => {
    const parcelle = await parcelleDe(parcelleAmberieuEffleuree)

    const urbanisme = await loadUrbanisme(
      gpu({ 'prescription-surf': prescriptionsAmberieuEffleuree, municipality: municipalityAmberieu }),
      parcelle,
    )

    // Quatre objets « hauteur maximale 6m » touchent la parcelle, aucun sur plus de 0,3 % de sa surface.
    expect(urbanisme.prescriptions).toEqual([])
  })

  it('ne liste qu’une fois une prescription découpée en plusieurs objets', async () => {
    const parcelle = await parcelleDe(parcelleAmberieuCheval)

    const urbanisme = await loadUrbanisme(
      gpu({ 'prescription-surf': prescriptionsAmberieuCheval, municipality: municipalityAmberieu }),
      parcelle,
    )

    // Quatre objets « hauteur maximale 9m » : deux se partagent la parcelle, deux n'en touchent que le bord.
    expect(urbanisme.prescriptions).toEqual([{ libelle: 'hauteur maximale 9m', texte: null }])
  })

  it('liste les servitudes qui touchent la parcelle, avec leur catégorie en clair, leur code et ce qu’elles protègent', async () => {
    const parcelle = await parcelleDe(parcelleParis)

    const urbanisme = await loadUrbanisme(gpu(paris), parcelle)

    // Le monument lui-même et les voies du 7e ne font que toucher le bord de la parcelle.
    expect(urbanisme.servitudes.map(({ code, categorie, nom }) => ({ code, categorie, nom }))).toEqual([
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel de Jarnac (ancien)' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel Brongniart' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Église Saint-François-Xavier' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel de Bourbon Condé (ancien)' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel de Richepanse (ancien)' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Ecole Militaire' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Ministère de la Marine Marchande' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Immeuble' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel de Beaumont' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel des Invalides' },
      { code: 'AC1', categorie: 'Abords de monument historique', nom: 'Hôtel Montesquiou-Fezensac' },
      { code: 'AC2', categorie: 'Site inscrit ou classé', nom: 'Ensemble urbain à Paris' },
    ])
  })

  it('signale le périmètre ABF quand la parcelle est aux abords de monuments historiques, en les nommant', async () => {
    const parcelle = await parcelleDe(parcelleParis)

    const urbanisme = await loadUrbanisme(gpu(paris), parcelle)

    expect(urbanisme.perimetreAbf).toEqual({
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

  it('ne signale pas de périmètre ABF hors des abords d’un monument historique, même dans un site patrimonial remarquable', async () => {
    const parcelle = await parcelleDe(parcelleBordeaux)

    const urbanisme = await loadUrbanisme(
      gpu({ municipality: municipalityBordeaux, 'assiette-sup-s': servitudesBordeaux }),
      parcelle,
    )

    expect(urbanisme.perimetreAbf).toBeNull()
  })

  it('n’a ni servitude ni périmètre ABF pour une parcelle qu’aucune servitude ne touche', async () => {
    const parcelle = await parcelleDe(parcelleAiguesJuntes)

    // Réponse réelle de l'API pour cette parcelle : aucune emprise de servitude.
    const urbanisme = await loadUrbanisme(
      gpu({ municipality: municipalityAiguesJuntes, 'assiette-sup-s': aucunObjet }),
      parcelle,
    )

    expect(urbanisme.servitudes).toEqual([])
    expect(urbanisme.perimetreAbf).toBeNull()
  })

  it('interroge zone, secteur, document, commune, prescriptions et servitudes par la géométrie de la parcelle, jamais les actes de servitude', async () => {
    const parcelle = await parcelleDe(parcelleParis)
    const fetch = gpu(paris)

    await loadUrbanisme(fetch, parcelle)

    const urls = fetch.calls.map((call) => new URL(call))
    expect(urls.map(({ pathname }) => pathname).sort()).toEqual([
      '/api/gpu/assiette-sup-s',
      '/api/gpu/document',
      '/api/gpu/municipality',
      '/api/gpu/prescription-surf',
      '/api/gpu/secteur-cc',
      '/api/gpu/zone-urba',
    ])
    for (const url of urls) {
      expect(url.origin).toBe('https://apicarto.ign.fr')
      expect(JSON.parse(url.searchParams.get('geom') ?? '')).toEqual(parcelleParis.features[0].geometry)
    }
  })
})
