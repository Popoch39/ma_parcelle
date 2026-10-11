import { beforeAll, describe, expect, it, vi } from 'vitest'
import { loadParcelle } from '@/api/cadastre'
import type { Fetch } from '@/api/fetch-json'
import { fakeFetch, type FakeRoute } from '@/test/fake-fetch'
import altiTerrainNu from '@/api/__fixtures__/altimetrie/elevation-aigues-juntes-09001-zc-148.json'
import altiAiguesJuntes154 from '@/api/__fixtures__/altimetrie/elevation-aigues-juntes-09001-zc-154.json'
import altiBordeaux from '@/api/__fixtures__/altimetrie/elevation-bordeaux-33063-kj-33.json'
import bdnbAmberieuNaturelle from '@/api/__fixtures__/bdnb/batiment-groupe-amberieu-01004-bi-724-aucun.json'
import bdnbAiguesJuntes154 from '@/api/__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-154.json'
import bdnbTerrainNu from '@/api/__fixtures__/bdnb/batiment-groupe-aigues-juntes-09001-zc-148-terrain-nu.json'
import bdnbBordeaux from '@/api/__fixtures__/bdnb/batiment-groupe-bordeaux-33063-kj-33.json'
import bdnbInfo from '@/api/__fixtures__/bdnb/metadonnees-info.json'
import parcelleTerrainNu from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-148.json'
import parcelleAiguesJuntes154 from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zc-154.json'
import parcellePleaux from '@/api/__fixtures__/cadastre/parcelle-pleaux-15153-0f-262.json'
import parcelleAmberieuLisiere from '@/api/__fixtures__/cadastre/parcelle-amberieu-01004-bc-183.json'
import parcelleAmberieuNaturelle from '@/api/__fixtures__/cadastre/parcelle-amberieu-01004-bi-724.json'
import parcelleBordeaux from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-kj-33.json'
import parcelleParis from '@/api/__fixtures__/cadastre/parcelle-paris-75107-bq-3.json'
import ceremaAiguesJuntes from '@/api/__fixtures__/cerema/geomutations-aigues-juntes-09001-zc-148.json'
import ceremaBordeaux1 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-1.json'
import ceremaBordeaux2 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-2.json'
import ceremaBordeaux3 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-3.json'
import ceremaBordeaux4 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-4.json'
import ceremaBordeaux5 from '@/api/__fixtures__/cerema/geomutations-bordeaux-33063-kj-33-page-5.json'
import aucunObjet from '@/api/__fixtures__/gpu/aucun-objet.json'
import servitudesAmberieuNaturelle from '@/api/__fixtures__/gpu/assiette-sup-s-amberieu-01004-bi-724.json'
import documentAmberieu from '@/api/__fixtures__/gpu/document-amberieu-01004.json'
import municipalityAmberieu from '@/api/__fixtures__/gpu/municipality-amberieu-01004.json'
import zonesAmberieuLisiere from '@/api/__fixtures__/gpu/zone-urba-amberieu-01004-bc-183.json'
import zonesAmberieuNaturelle from '@/api/__fixtures__/gpu/zone-urba-amberieu-01004-bi-724.json'
import servitudesBordeaux from '@/api/__fixtures__/gpu/assiette-sup-s-bordeaux-33063-kj-33.json'
import servitudesParis from '@/api/__fixtures__/gpu/assiette-sup-s-paris-75107-bq-3.json'
import documentParis from '@/api/__fixtures__/gpu/document-paris-75107-bq-3.json'
import municipalityAiguesJuntes from '@/api/__fixtures__/gpu/municipality-aigues-juntes-09001-zc-148.json'
import documentPleaux from '@/api/__fixtures__/gpu/document-pleaux-15153-0f-262.json'
import municipalityPleaux from '@/api/__fixtures__/gpu/municipality-pleaux-15153-0f-262.json'
import secteurPleaux from '@/api/__fixtures__/gpu/secteur-cc-pleaux-15153-0f-262.json'
import municipalityBordeaux from '@/api/__fixtures__/gpu/municipality-bordeaux-33063-kj-33.json'
import municipalityParis from '@/api/__fixtures__/gpu/municipality-paris-75107-bq-3.json'
import prescriptionsBordeaux from '@/api/__fixtures__/gpu/prescription-surf-bordeaux-33063-kj-33.json'
import prescriptionsParis from '@/api/__fixtures__/gpu/prescription-surf-paris-75107-bq-3.json'
import zonesParis from '@/api/__fixtures__/gpu/zone-urba-paris-75107-bq-3.json'
import parcelleCavite from '@/api/__fixtures__/cadastre/parcelle-aigues-juntes-09001-zb-153.json'
import parcelleSolPollue from '@/api/__fixtures__/cadastre/parcelle-bordeaux-33063-bo-368.json'
import parcelleSeveso from '@/api/__fixtures__/cadastre/parcelle-feyzin-69276-bb-221.json'
import aucunResultat from '@/api/__fixtures__/georisques/aucun-resultat.json'
import cavitesCavite from '@/api/__fixtures__/georisques/cavites-aigues-juntes-09001-zb-153.json'
import aziAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-azi-09001.json'
import aziParis from '@/api/__fixtures__/georisques/gaspar-azi-75056.json'
import catnatAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-catnat-09001.json'
import catnatBordeaux from '@/api/__fixtures__/georisques/gaspar-catnat-33063.json'
import catnatParis from '@/api/__fixtures__/georisques/gaspar-catnat-75056.json'
import risquesCavite from '@/api/__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zb-153.json'
import risquesAiguesJuntes from '@/api/__fixtures__/georisques/gaspar-risques-aigues-juntes-09001-zc-148.json'
import risquesBordeaux from '@/api/__fixtures__/georisques/gaspar-risques-bordeaux-33063-kj-33.json'
import risquesParis from '@/api/__fixtures__/georisques/gaspar-risques-paris-75107-bq-3.json'
import triBordeaux from '@/api/__fixtures__/georisques/gaspar-tri-33063.json'
import triParis from '@/api/__fixtures__/georisques/gaspar-tri-75056.json'
import icpeSolPollue from '@/api/__fixtures__/georisques/installations-classees-bordeaux-33063-bo-368.json'
import icpeBordeaux from '@/api/__fixtures__/georisques/installations-classees-bordeaux-33063-kj-33.json'
import icpeSeveso from '@/api/__fixtures__/georisques/installations-classees-feyzin-69276-bb-221.json'
import icpeParis from '@/api/__fixtures__/georisques/installations-classees-paris-75107-bq-3.json'
import radonAiguesJuntes from '@/api/__fixtures__/georisques/radon-09001.json'
import radonBordeaux from '@/api/__fixtures__/georisques/radon-33063.json'
import radonParis7e from '@/api/__fixtures__/georisques/radon-75107.json'
import rgaCavite from '@/api/__fixtures__/georisques/rga-aigues-juntes-09001-zb-153.json'
import rgaTerrainNu from '@/api/__fixtures__/georisques/rga-aigues-juntes-09001-zc-148.json'
import rgaSolPollue from '@/api/__fixtures__/georisques/rga-bordeaux-33063-bo-368.json'
import rgaBordeaux from '@/api/__fixtures__/georisques/rga-bordeaux-33063-kj-33.json'
import rgaSeveso from '@/api/__fixtures__/georisques/rga-feyzin-69276-bb-221.json'
import sspAucunSite from '@/api/__fixtures__/georisques/ssp-aucun-site.json'
import sspSolPollue from '@/api/__fixtures__/georisques/ssp-bordeaux-33063-bo-368.json'
import sspBordeaux from '@/api/__fixtures__/georisques/ssp-bordeaux-33063-kj-33.json'
import sspSeveso from '@/api/__fixtures__/georisques/ssp-feyzin-69276-bb-221.json'
import sspParis from '@/api/__fixtures__/georisques/ssp-paris-75107-bq-3.json'
import sismiqueAiguesJuntes from '@/api/__fixtures__/georisques/zonage-sismique-09001.json'
import sismiqueBordeaux from '@/api/__fixtures__/georisques/zonage-sismique-33063.json'
import sismiqueParis7e from '@/api/__fixtures__/georisques/zonage-sismique-75107.json'
import { assemblerSynthese, type EtatBloc } from './synthese'
import { CONTRIBUTIONS } from './contributions'

type EndpointGpu = 'zone-urba' | 'secteur-cc' | 'document' | 'municipality' | 'prescription-surf' | 'assiette-sup-s'

/** Routes de l'API Carto GPU : un endpoint non fourni répond comme sans objet. */
function gpu(responses: Partial<Record<EndpointGpu, unknown>>): FakeRoute[] {
  const endpoints: EndpointGpu[] = [
    'zone-urba',
    'secteur-cc',
    'document',
    'municipality',
    'prescription-surf',
    'assiette-sup-s',
  ]
  return endpoints.map((endpoint) => ({ match: `/api/gpu/${endpoint}?`, body: responses[endpoint] ?? aucunObjet }))
}

type EndpointGeorisques =
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

/** Routes de Géorisques : un endpoint non fourni répond sans résultat (`rga` : corps vide). */
function georisques(responses: Partial<Record<EndpointGeorisques, unknown>>): FakeRoute[] {
  const endpoints: EndpointGeorisques[] = [
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
    return { match, body: endpoint === 'ssp' ? sspAucunSite : aucunResultat }
  })
}

/** Géorisques à Aigues-Juntes (09001) : réponses communales communes, réponses du point au choix. */
function aiguesJuntesGeorisques(rga: unknown, responses: Partial<Record<EndpointGeorisques, unknown>> = {}) {
  return georisques({
    rga,
    'gaspar/risques': risquesAiguesJuntes,
    'gaspar/azi': aziAiguesJuntes,
    zonage_sismique: sismiqueAiguesJuntes,
    radon: radonAiguesJuntes,
    'gaspar/catnat': catnatAiguesJuntes,
    ...responses,
  })
}

/**
 * La synthèse d'une parcelle telle que la fiche la compose : chaque bloc passe par son
 * chargeur, et celui qui échoue est vu comme la fiche le voit, en erreur. Les blocs `enAttente`
 * sont vus comme encore en chargement.
 */
async function syntheseDe(fetch: Fetch, idu: string, { enAttente = [] }: { enAttente?: string[] } = {}) {
  const parcelle = await loadParcelle(fetch, idu)
  const blocs = await Promise.all(
    CONTRIBUTIONS.map(({ bloc, charger, faits }) =>
      enAttente.includes(bloc) ? { status: 'pending' as const } : charger(fetch, parcelle).then(
        (donnees): EtatBloc => ({ status: 'success', data: faits(donnees) }),
        (): EtatBloc => ({ status: 'error' }),
      ),
    ),
  )
  return assemblerSynthese(blocs)
}

const bordeaux = [
  { match: 'cadastre/parcelle', body: parcelleBordeaux },
  ...gpu({
    municipality: municipalityBordeaux,
    'prescription-surf': prescriptionsBordeaux,
    'assiette-sup-s': servitudesBordeaux,
  }),
  { match: 'bdnb/donnees', body: bdnbBordeaux },
  { match: 'bdnb/metadonnees/info', body: bdnbInfo },
  { match: 'altimetrie', body: altiBordeaux },
  // Argiles moyennes, territoire à risque d'inondation, anciens sites et installations ordinaires
  // autour : de la vigilance au plus, rien qui ne remonte en tête de fiche.
  ...georisques({
    rga: rgaBordeaux,
    ssp: sspBordeaux,
    installations_classees: icpeBordeaux,
    'gaspar/risques': risquesBordeaux,
    'gaspar/tri': triBordeaux,
    zonage_sismique: sismiqueBordeaux,
    radon: radonBordeaux,
    'gaspar/catnat': catnatBordeaux,
  }),
  // Les pages 2 à 5 d'abord : la première page est la seule URL sans `page=`.
  ...[ceremaBordeaux2, ceremaBordeaux3, ceremaBordeaux4, ceremaBordeaux5].map((body, i) => ({
    match: new RegExp(`apidf-preprod\\.cerema\\.fr/.*page=${i + 2}&`),
    body,
  })),
  { match: 'apidf-preprod.cerema.fr', body: ceremaBordeaux1 },
]

beforeAll(() => {
  // Les ventes retenues sont celles des cinq dernières années.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-11T12:00:00+02:00'))
})

describe('synthèse de la fiche', () => {
  it('traduit en clair les faits de chaque bloc, dans l’ordre des blocs, chacun avec son niveau d’alerte', async () => {
    const synthese = await syntheseDe(fakeFetch(bordeaux), '33063000KJ0033')

    expect(synthese).toEqual({
      enCours: false,
      faits: [
        { id: 'surface', libelle: 'Surface', valeur: '131 m²', niveau: 'information' },
        {
          id: 'zone',
          libelle: 'Zone d’urbanisme',
          valeur: 'Aucune zone publiée',
          niveau: 'vigilance',
          detail:
            'Souvent un secteur sauvegardé dont le plan n’est pas en ligne : la mairie indique les règles qui s’y appliquent.',
        },
        // Seuls les appartements ont assez de ventes simples : quatre maisons ne font pas une médiane.
        {
          id: 'prix-appartement',
          libelle: 'Prix médian au m², appartements',
          valeur: '4 125 €/m² · 7 ventes',
          niveau: 'information',
          detail:
            'Médiane des ventes simples d’appartements à moins de 500 m depuis 2021 : un repère du voisinage, pas une estimation de la parcelle.',
        },
        {
          id: 'bati',
          libelle: 'Bâti',
          valeur: '1 bâtiment recensé',
          niveau: 'information',
          detail: 'Construit en 1850 selon la BDNB.',
        },
      ],
    })
  })

  it('compose la synthèse sans attendre un bloc encore en chargement, en signalant que d’autres faits peuvent venir', async () => {
    const synthese = await syntheseDe(fakeFetch(bordeaux), '33063000KJ0033', { enAttente: ['urbanisme'] })

    expect(synthese.enCours).toBe(true)
    expect(synthese.faits.map(({ id }) => id)).toEqual(['surface', 'prix-appartement', 'bati'])
  })

  it('compose la synthèse sans le bloc en erreur, et explique la zone du PLU et le périmètre ABF', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleParis },
      ...gpu({
        'zone-urba': zonesParis,
        document: documentParis,
        municipality: municipalityParis,
        'prescription-surf': prescriptionsParis,
        'assiette-sup-s': servitudesParis,
      }),
      { match: 'bdnb/donnees', status: 500, body: 'Internal Server Error' },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      ...georisques({
        ssp: sspParis,
        installations_classees: icpeParis,
        'gaspar/risques': risquesParis,
        'gaspar/azi': aziParis,
        'gaspar/tri': triParis,
        zonage_sismique: sismiqueParis7e,
        radon: radonParis7e,
        'gaspar/catnat': catnatParis,
      }),
    ])

    const synthese = await syntheseDe(fetch, '75107000BQ0003')

    expect(synthese).toEqual({
      enCours: false,
      faits: [
        { id: 'surface', libelle: 'Surface', valeur: '8 215 m²', niveau: 'information' },
        {
          id: 'zone',
          libelle: 'Zone d’urbanisme',
          valeur: 'UG · Zone urbaine générale',
          niveau: 'information',
          detail: 'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment.',
        },
        {
          id: 'perimetre-abf',
          libelle: 'Périmètre ABF',
          valeur: 'Abords de 11 monuments historiques',
          niveau: 'vigilance',
          detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
        },
      ],
    })
  })

  it('ne dit rien d’un bloc qui n’a rien à signaler, comme un terrain sans bâti recensé ou trop peu de ventes autour', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleTerrainNu },
      ...gpu({ municipality: municipalityAiguesJuntes }),
      { match: 'bdnb/donnees', body: bdnbTerrainNu },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      { match: 'altimetrie', body: altiTerrainNu },
      ...aiguesJuntesGeorisques(rgaTerrainNu),
      { match: 'apidf-preprod.cerema.fr', body: ceremaAiguesJuntes },
    ])

    const synthese = await syntheseDe(fetch, '09001000ZC0148')

    expect(synthese).toEqual({
      enCours: false,
      faits: [
        { id: 'surface', libelle: 'Surface', valeur: '696 m²', niveau: 'information' },
        {
          id: 'zone',
          libelle: 'Zone d’urbanisme',
          valeur: 'Règlement national d’urbanisme',
          niveau: 'vigilance',
          detail:
            'La commune n’a ni PLU ni carte communale : les règles générales du code de l’urbanisme s’appliquent, et limitent les constructions nouvelles hors des parties déjà urbanisées.',
        },
        {
          id: 'risque-argiles',
          libelle: 'Retrait-gonflement des argiles',
          valeur: 'Exposition forte',
          niveau: 'alerte',
          detail:
            'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
        },
      ],
    })
  })

  it('fait remonter chaque risque en alerte, comme une cavité sur la parcelle, mais pas ceux en vigilance', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleCavite },
      ...aiguesJuntesGeorisques(rgaCavite, { cavites: cavitesCavite, 'gaspar/risques': risquesCavite }),
    ])

    const synthese = await syntheseDe(fetch, '09001000ZB0153')

    // La sismicité modérée de la commune (vigilance) reste dans le bloc Risques.
    expect(synthese.faits.filter(({ id }) => id.startsWith('risque-'))).toEqual([
      {
        id: 'risque-argiles',
        libelle: 'Retrait-gonflement des argiles',
        valeur: 'Exposition forte',
        niveau: 'alerte',
        detail:
          'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.',
      },
      {
        id: 'risque-cavites',
        libelle: 'Cavités souterraines',
        valeur: '1 recensée à moins de 500 m',
        niveau: 'alerte',
        detail: 'Une cavité est recensée sur la parcelle ou à moins de 100 m : le sol peut s’y affaisser ou s’effondrer.',
      },
    ])
  })

  it('met en alerte un sol pollué tout proche et un établissement Seveso seuil haut à moins d’1 km', async () => {
    const solPollue = await syntheseDe(
      fakeFetch([
        { match: 'cadastre/parcelle', body: parcelleSolPollue },
        ...georisques({ rga: rgaSolPollue, ssp: sspSolPollue, installations_classees: icpeSolPollue }),
      ]),
      '33063000BO0368',
    )
    const seveso = await syntheseDe(
      fakeFetch([
        { match: 'cadastre/parcelle', body: parcelleSeveso },
        ...georisques({ rga: rgaSeveso, ssp: sspSeveso, installations_classees: icpeSeveso }),
      ]),
      '69276000BB0221',
    )

    expect(solPollue.faits.filter(({ id }) => id.startsWith('risque-'))).toEqual([
      {
        id: 'risque-sols-pollues',
        libelle: 'Sols pollués',
        valeur: '4 sites à moins de 500 m',
        niveau: 'alerte',
        detail:
          'Un sol pollué est recensé sur la parcelle ou à moins de 100 m : y construire peut exiger une étude de sol et des précautions d’usage.',
      },
    ])
    expect(seveso.faits.filter(({ id }) => id.startsWith('risque-'))).toEqual([
      {
        id: 'risque-installations-classees',
        libelle: 'Installations classées',
        valeur: '5 à moins de 1 km',
        niveau: 'alerte',
        detail:
          'Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de 1 km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.',
      },
    ])
  })

  it('met en alerte une zone naturelle, et nomme le monument dont la parcelle est aux abords', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleAmberieuNaturelle },
      ...gpu({
        'zone-urba': zonesAmberieuNaturelle,
        document: documentAmberieu,
        municipality: municipalityAmberieu,
        'assiette-sup-s': servitudesAmberieuNaturelle,
      }),
      { match: 'bdnb/donnees', body: bdnbAmberieuNaturelle },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
    ])

    const synthese = await syntheseDe(fetch, '01004000BI0724')

    expect(synthese.faits).toEqual([
      { id: 'surface', libelle: 'Surface', valeur: '30 694 m²', niveau: 'information' },
      {
        id: 'zone',
        libelle: 'Zone d’urbanisme',
        valeur: 'N · Secteur naturel',
        niveau: 'alerte',
        detail:
          'Zone naturelle : secteur protégé pour ses milieux ou ses paysages, où les constructions sont strictement encadrées.',
      },
      {
        id: 'perimetre-abf',
        libelle: 'Périmètre ABF',
        valeur: 'Abords de « Maison forte de Saint-Germain ; Ruines du castrum »',
        niveau: 'vigilance',
        detail: 'Les travaux visibles depuis l’espace public y sont soumis à l’avis de l’architecte des bâtiments de France.',
      },
    ])
  })

  it('donne à une parcelle à cheval le niveau de sa zone la plus contraignante, en disant quelle part y est', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleAmberieuLisiere },
      ...gpu({ 'zone-urba': zonesAmberieuLisiere, document: documentAmberieu, municipality: municipalityAmberieu }),
    ])

    const synthese = await syntheseDe(fetch, '01004000BC0183')

    // Parts mesurées sur la parcelle : 89,7 % en UCj, 10,3 % en N.
    expect(synthese.faits.find(({ id }) => id === 'zone')).toEqual({
      id: 'zone',
      libelle: 'Zone d’urbanisme',
      valeur: 'UCj · Secteur résidentiel aux enjeux de continuité écologique',
      niveau: 'alerte',
      detail:
        'Zone urbaine : secteur déjà urbanisé et équipé, dont le règlement fixe ce qui peut y être bâti et comment. 10 % de la parcelle est en N · Secteur naturel (zone naturelle).',
    })
  })

  it('explique le secteur d’une carte communale', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcellePleaux },
      ...gpu({ 'secteur-cc': secteurPleaux, document: documentPleaux, municipality: municipalityPleaux }),
    ])

    const synthese = await syntheseDe(fetch, '151530000F0262')

    expect(synthese.faits.find(({ id }) => id === 'zone')).toEqual({
      id: 'zone',
      libelle: 'Zone d’urbanisme',
      valeur: 'U',
      niveau: 'information',
      detail:
        'Secteur de carte communale où les constructions sont admises, selon les règles générales du code de l’urbanisme.',
    })
  })

  it('compte les bâtiments quand la BDNB en recense plusieurs sur la parcelle', async () => {
    const fetch = fakeFetch([
      { match: 'cadastre/parcelle', body: parcelleAiguesJuntes154 },
      ...gpu({ municipality: municipalityAiguesJuntes }),
      { match: 'bdnb/donnees', body: bdnbAiguesJuntes154 },
      { match: 'bdnb/metadonnees/info', body: bdnbInfo },
      { match: 'altimetrie', body: altiAiguesJuntes154 },
    ])

    const synthese = await syntheseDe(fetch, '09001000ZC0154')

    expect(synthese.faits.find(({ id }) => id === 'bati')).toEqual({
      id: 'bati',
      libelle: 'Bâti',
      valeur: '3 bâtiments recensés',
      niveau: 'information',
    })
  })
})
