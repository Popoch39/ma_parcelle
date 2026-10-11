import type { Point } from 'geojson'
import { centroidOf, distanceBetweenPolygons, distanceToPolygon, type Contour } from '@/lib/geo'
import type { AlertLevel } from '@/lib/summary/summary'
import type { Parcel } from './cadastre'
import { fetchJson, fetchJsonOrEmpty } from './fetch-json'
import type { BlockLoader } from './loader'

const API = 'https://www.georisques.gouv.fr/api/v1'
const SITE = 'https://www.georisques.gouv.fr'

// Everything in one page: responses are paginated by 10, and their `next` link points to an
// internal Géorisques host that cannot be reached.
const ONE_PAGE = 'page_size=1000'
/** Search radius around the parcel's centroid, in meters. */
const RADIUS = 500
/** Radius for classified installations, wider: an industrial accident reaches further. */
const INSTALLATIONS_RADIUS = 1000
/** Below this, a site or a cavity is very close to the parcel, in meters. */
const VERY_CLOSE = 100
/** Elements cited per neighborhood risk, closest first; the total is in the value. */
const CITED = 5

/** Where a risk applies: at the parcel's location (and around it), or for its whole municipality. */
export type RiskScope = 'location' | 'municipality'

/** What a risk rests on: a site, a cavity, an order… */
export interface RiskElement {
  id: string
  label: string
  /** What locates or qualifies it, e.g. « naturelle · à 12 m ». */
  note: string | null
  /** Its page on Géorisques, when there is one. */
  link: string | null
}

interface RiskBase {
  id: string
  /** The risk in plain words, e.g. « Retrait-gonflement des argiles ». */
  label: string
  scope: RiskScope
  /** Géorisques page that explains this risk. */
  link: string
}

/** What Géorisques data says about a risk. */
interface Reading {
  level: AlertLevel
  /** What the data says about it, in a few words, e.g. « Exposition forte ». */
  value: string
  /** A sentence that explains the value to someone who does not know the jargon. */
  detail: string | null
  elements: RiskElement[]
}

/** A risk as Géorisques describes it, or unavailable when its service failed. */
export type Risk = RiskBase & ((Reading & { available: true }) | { available: false })

/** Model of the Risks block. */
export interface RisksBlock {
  risks: Risk[]
}

/** Common envelope of Géorisques paginated responses. */
interface Envelope<T> {
  results: number
  data: T[]
}

/** Raw `rga` response, a bare object. */
interface RgaGeorisques {
  codeExposition: string
  exposition: string
}

interface CavityGeorisques {
  identifiant: string
  /** « naturelle », « carrière », « ouvrage civil »… */
  type: string
  /** Prefixed with a type code, e.g. « CN_Grotte de Falgalle 2 ». */
  nom: string | null
  longitude: number
  latitude: number
}

interface GroundMovementGeorisques {
  identifiant: string
  /** « Glissement », « Éboulement »… */
  type: string
  /** « aaaa-mm-jj », often approximate. */
  date_debut: string | null
  longitude: number
  latitude: number
}

/** Former activity site from the CASIAS database. */
interface CasiasGeorisques {
  identifiant_ssp: string
  nom_etablissement: string | null
  adresse: string | null
  fiche_risque: string | null
  geom: Point
}

/** Polluted site under review or classified (SIS, SUP). */
interface PollutedSiteGeorisques {
  identifiant_ssp: string
  /** Name of the site under review; classified sites give it in `nom`. */
  nom_etablissement?: string | null
  nom?: string | null
  adresse: string | null
  /** Review: « En cours », « Clôturée ». */
  statut?: string | null
  fiche_risque: string | null
  geom: Point | Contour
}

/** Raw `ssp` response: one object per sub-database, each in its envelope. */
interface SspGeorisques {
  casias: Envelope<CasiasGeorisques>
  instructions: Envelope<PollutedSiteGeorisques>
  conclusions_sis: Envelope<PollutedSiteGeorisques>
  conclusions_sup: Envelope<PollutedSiteGeorisques>
}

interface ClassifiedInstallationGeorisques {
  codeAIOT: string
  raisonSociale: string
  /** « Seveso seuil haut », « Seveso seuil bas », « Non Seveso » or null. */
  statutSeveso: string | null
  /** « Autorisation », « Enregistrement », « Autres régimes », « Non ICPE »… */
  regime: string | null
  longitude: number
  latitude: number
}

interface SeismicZoningGeorisques {
  code_zone: string
}

interface RadonGeorisques {
  classe_potentiel: string
}

interface AziGeorisques {
  code_national_azi: string
  libelle_azi: string
  /** « jj/mm/aaaa ». */
  date_diffusion: string | null
}

interface MunicipalityRisksGeorisques {
  code_insee: string
  /** Families (« 12 ») followed by their detailed risks (« 121 »). */
  risques_detail: Array<{ num_risque: string; libelle_risque_long: string }>
}

interface CatnatGeorisques {
  code_national_catnat: string
  /** « jj/mm/aaaa ». */
  date_debut_evt: string
  date_fin_evt: string
  libelle_risque_jo: string
}

interface TriGeorisques {
  code_national_tri: string
  libelle_tri: string
  /** « jj/mm/aaaa ». */
  date_arrete_carte: string | null
}

/** What is needed to query Géorisques for a parcel. */
interface Context {
  parcel: Parcel
  /** `latlon` parameter of the parcel's centroid. */
  latlon: string
  get: <T>(path: string) => Promise<T>
  getOrEmpty: <T>(path: string) => Promise<T | null>
  /** Polluted sites and soils around the parcel: two risks are read from it, requested only once. */
  ssp: () => Promise<SspGeorisques>
}

/** A risk of the block, and how to read it from Géorisques. */
interface RiskSource extends RiskBase {
  read: (context: Context) => Promise<Reading>
}

const SOURCES: RiskSource[] = [
  {
    id: 'clay',
    label: 'Retrait-gonflement des argiles',
    scope: 'location',
    link: `${SITE}/minformer-sur-un-risque/retrait-gonflement-des-argiles`,
    // Outside mapped areas (Paris, for example), `rga` answers 200 with an empty body.
    read: async ({ latlon, getOrEmpty }) => clay(await getOrEmpty<RgaGeorisques>(`rga?${latlon}`)),
  },
  {
    id: 'cavities',
    label: 'Cavités souterraines',
    scope: 'location',
    link: `${SITE}/consulter-les-dossiers-thematiques/dossier-expert-sur-les-cavites-souterraines`,
    read: async ({ parcel, latlon, get }) =>
      cavities(parcel, await get<Envelope<CavityGeorisques>>(`cavites?${latlon}&rayon=${RADIUS}&${ONE_PAGE}`)),
  },
  {
    id: 'ground-movements',
    label: 'Mouvements de terrain',
    scope: 'location',
    link: `${SITE}/minformer-sur-un-risque/mouvement-de-terrain`,
    read: async ({ parcel, latlon, get }) =>
      groundMovements(
        parcel,
        await get<Envelope<GroundMovementGeorisques>>(`mvt?${latlon}&rayon=${RADIUS}&${ONE_PAGE}`),
      ),
  },
  {
    id: 'polluted-soils',
    label: 'Sols pollués',
    scope: 'location',
    link: `${SITE}/sites-et-sols-pollues-ou-potentiellement-pollues`,
    read: async ({ parcel, ssp }) => pollutedSoils(parcel, await ssp()),
  },
  {
    id: 'former-sites',
    label: 'Anciens sites industriels',
    scope: 'location',
    link: `${SITE}/sites-et-sols-pollues-ou-potentiellement-pollues`,
    read: async ({ parcel, ssp }) => formerSites(parcel, (await ssp()).casias),
  },
  {
    id: 'classified-installations',
    label: 'Installations classées',
    scope: 'location',
    link: `${SITE}/minformer-sur-un-risque/accident-industriel`,
    read: async ({ parcel, latlon, get }) =>
      classifiedInstallations(
        parcel,
        await get<Envelope<ClassifiedInstallationGeorisques>>(
          `installations_classees?${latlon}&rayon=${INSTALLATIONS_RADIUS}&${ONE_PAGE}`,
        ),
      ),
  },
  {
    id: 'municipality-risks',
    label: 'Risques recensés dans la commune',
    scope: 'municipality',
    link: `${SITE}/minformer-sur-un-risque`,
    read: async ({ parcel, latlon, get }) => {
      // The point also returns the neighboring municipalities: only the parcel's one counts.
      const { data } = await get<Envelope<MunicipalityRisksGeorisques>>(`gaspar/risques?${latlon}`)
      return municipalityRisks(data.find(({ code_insee }) => code_insee === parcel.municipality.inseeCode))
    },
  },
  {
    id: 'azi',
    label: 'Atlas des zones inondables',
    scope: 'municipality',
    link: `${SITE}/minformer-sur-un-risque/inondation`,
    read: async (context) => azi(await byMunicipality<AziGeorisques>(context, 'gaspar/azi')),
  },
  {
    id: 'tri',
    label: 'Territoire à risque important d’inondation',
    scope: 'municipality',
    link: `${SITE}/minformer-sur-un-risque/inondation`,
    read: async (context) => tri(await byMunicipality<TriGeorisques>(context, 'gaspar/tri')),
  },
  {
    id: 'seismicity',
    label: 'Sismicité',
    scope: 'municipality',
    link: `${SITE}/minformer-sur-un-risque/seisme`,
    read: async (context) =>
      seismicity(await byDistrictThenMunicipality<SeismicZoningGeorisques>(context, 'zonage_sismique')),
  },
  {
    id: 'radon',
    label: 'Radon',
    scope: 'municipality',
    link: `${SITE}/minformer-sur-un-risque/radon`,
    read: async (context) => radon(await byDistrictThenMunicipality<RadonGeorisques>(context, 'radon')),
  },
  {
    id: 'catnat',
    label: 'Catastrophes naturelles',
    scope: 'municipality',
    link: `${SITE}/le-dispositif-dindemnisation-des-catastrophes-naturelles`,
    read: async ({ parcel, get }) =>
      catnat(
        await get<Envelope<CatnatGeorisques>>(`gaspar/catnat?code_insee=${parcel.municipality.inseeCode}&${ONE_PAGE}`),
      ),
  },
]

/** Loader of the Risks block: what Géorisques says about the parcel's location and its municipality. */
export const loadRisks: BlockLoader<RisksBlock> = async (fetch, parcel, { signal } = {}) => {
  const { lon, lat } = centroidOf(parcel.geometry)
  // Beyond 6 decimals (10 cm), the precision would be illusory. Géorisques expects the longitude first.
  const latlon = `latlon=${lon.toFixed(6)},${lat.toFixed(6)}`
  let ssp: Promise<SspGeorisques> | undefined
  const context: Context = {
    parcel,
    latlon,
    get: (path) => fetchJson(fetch, `${API}/${path}`, { signal }),
    getOrEmpty: (path) => fetchJsonOrEmpty(fetch, `${API}/${path}`, { signal }),
    ssp: () => (ssp ??= fetchJson(fetch, `${API}/ssp?${latlon}&rayon=${RADIUS}&${ONE_PAGE}`, { signal })),
  }
  // Each risk fails on its own; but if they all fail, Géorisques is down (or the call was
  // aborted): the block fails with the first error, and offers to retry.
  const readings = await Promise.allSettled(SOURCES.map((source) => source.read(context)))
  const [firstFailure] = readings.filter((reading) => reading.status === 'rejected')
  if (firstFailure && readings.every(({ status }) => status === 'rejected')) throw firstFailure.reason
  return {
    risks: SOURCES.map(({ read: _read, ...risk }, index): Risk => {
      const reading = readings[index]
      return reading.status === 'fulfilled'
        ? { ...risk, available: true, ...reading.value }
        : { ...risk, available: false }
    }),
  }
}

/**
 * Rows of a municipal endpoint. Depending on the endpoint, Géorisques files Paris, Lyon and Marseille
 * under the district's code or under the municipality's: we try the district, then the
 * municipality if it gives nothing.
 */
async function byDistrictThenMunicipality<T>({ parcel, get }: Context, endpoint: string): Promise<T[]> {
  const { district, municipality } = parcel
  if (district) {
    const { data } = await get<Envelope<T>>(`${endpoint}?code_insee=${district.inseeCode}`)
    if (data.length > 0) return data
  }
  return (await get<Envelope<T>>(`${endpoint}?code_insee=${municipality.inseeCode}`)).data
}

/** Rows of a GASPAR endpoint, which files Paris, Lyon and Marseille under the municipality's code. */
async function byMunicipality<T>({ parcel, get }: Context, endpoint: string): Promise<T[]> {
  return (await get<Envelope<T>>(`${endpoint}?code_insee=${parcel.municipality.inseeCode}`)).data
}

function noData(detail: string | null): Reading {
  return { level: 'info', value: 'Aucune donnée', detail, elements: [] }
}

// The soil survey (ELAN law) is only required for medium or high exposure.
const SOIL_SURVEY =
  'Les sols argileux gonflent et se rétractent au fil des pluies et des sécheresses, ce qui peut fissurer les bâtiments : une étude de sol est exigée avant de vendre un terrain à bâtir ou d’y construire une maison.'
const CLAY: Record<string, { level: AlertLevel; detail: string }> = {
  '1': {
    level: 'info',
    detail: 'Les sols argileux y bougent peu avec l’humidité : aucune étude de sol n’est exigée à ce niveau.',
  },
  '2': { level: 'caution', detail: SOIL_SURVEY },
  '3': { level: 'alert', detail: SOIL_SURVEY },
}

function clay(rga: RgaGeorisques | null): Reading {
  const reading = rga && CLAY[rga.codeExposition]
  if (!rga || !reading) {
    return noData('Géorisques ne donne pas d’exposition aux argiles à cet emplacement.')
  }
  return { level: reading.level, value: rga.exposition, detail: reading.detail, elements: [] }
}

const meters = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** « sur la parcelle » or « à 120 m », rounded to 10 m: the databases' positions say no more. */
function atDistance(distance: number): string {
  return distance === 0 ? 'sur la parcelle' : `à ${meters.format(Math.max(10, Math.round(distance / 10) * 10))} m`
}

/** The elements, from closest to the parcel to farthest. */
function byDistance<T>(elements: T[], distance: (element: T) => number): Array<{ element: T; distance: number }> {
  return elements
    .map((element) => ({ element, distance: distance(element) }))
    .toSorted((a, b) => a.distance - b.distance)
}

/**
 * Reading of a census of points around the parcel (cavities, ground movements):
 * alert when the closest is on the parcel or very near, caution otherwise.
 */
function pointsAround<T extends { longitude: number; latitude: number }>(
  parcel: Parcel,
  { results, data }: Envelope<T>,
  texts: { recorded: (count: number) => string; none: string; veryClose: string; nearby: string },
  element: (point: T, distance: number) => RiskElement,
): Reading {
  if (results === 0) return { level: 'info', value: texts.none, detail: null, elements: [] }
  const closest = byDistance(data, ({ longitude, latitude }) =>
    distanceToPolygon({ lon: longitude, lat: latitude }, parcel.geometry),
  )
  const veryClose = (closest[0]?.distance ?? Infinity) <= VERY_CLOSE
  return {
    level: veryClose ? 'alert' : 'caution',
    value: `${results} ${texts.recorded(results)} à moins de ${RADIUS} m`,
    detail: veryClose ? texts.veryClose : texts.nearby,
    elements: closest.slice(0, CITED).map(({ element: point, distance }) => element(point, distance)),
  }
}

function cavities(parcel: Parcel, response: Envelope<CavityGeorisques>): Reading {
  return pointsAround(
    parcel,
    response,
    {
      recorded: (count) => (count === 1 ? 'recensée' : 'recensées'),
      none: `Aucune recensée à moins de ${RADIUS} m`,
      veryClose: `Une cavité est recensée sur la parcelle ou à moins de ${VERY_CLOSE} m : le sol peut s’y affaisser ou s’effondrer.`,
      nearby: 'Des cavités sont recensées dans les environs : le sol peut s’y affaisser ou s’effondrer.',
    },
    (cavity, distance) => ({
      id: cavity.identifiant,
      label: cavity.nom?.replace(/^[A-Z]{2}_/, '') || cavity.type,
      note: `${cavity.type} · ${atDistance(distance)}`,
      link: null,
    }),
  )
}

function groundMovements(parcel: Parcel, response: Envelope<GroundMovementGeorisques>): Reading {
  return pointsAround(
    parcel,
    response,
    {
      recorded: (count) => (count === 1 ? 'recensé' : 'recensés'),
      none: `Aucun recensé à moins de ${RADIUS} m`,
      veryClose: `Un glissement, un éboulement ou une coulée s’est déjà produit sur la parcelle ou à moins de ${VERY_CLOSE} m.`,
      nearby: 'Glissements, éboulements ou coulées se sont déjà produits dans les environs.',
    },
    (movement, distance) => ({
      id: movement.identifiant,
      label: movement.type,
      note: [movement.date_debut?.slice(0, 4), atDistance(distance)].filter(Boolean).join(' · '),
      link: null,
    }),
  )
}

/** Distance from a site (point or footprint) to the parcel, in meters. */
function siteDistance(parcel: Parcel, geom: Point | Contour): number {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return distanceToPolygon({ lon, lat }, parcel.geometry)
  }
  return distanceBetweenPolygons(geom, parcel.geometry)
}

function pollutedSoils(parcel: Parcel, ssp: SspGeorisques): Reading {
  // A site reviewed then classified appears in both databases: its classification record prevails.
  const categorized = [
    ...ssp.conclusions_sup.data.map((site) => ({ site, category: 'servitude d’utilité publique' })),
    ...ssp.conclusions_sis.data.map((site) => ({ site, category: 'secteur d’information sur les sols' })),
    ...ssp.instructions.data.map((site) => ({
      site,
      category: site.statut === 'Clôturée' ? 'site pollué, dossier clos' : 'site pollué, dossier en cours',
    })),
  ]
  const key = ({ site }: (typeof categorized)[number]) => `${siteName(site)}|${site.adresse}`.toUpperCase()
  const sites = categorized.filter((candidate, index) => categorized.findIndex((other) => key(other) === key(candidate)) === index)
  if (sites.length === 0) {
    return { level: 'info', value: `Aucun site recensé à moins de ${RADIUS} m`, detail: null, elements: [] }
  }
  const closest = byDistance(sites, ({ site }) => siteDistance(parcel, site.geom))
  const veryClose = closest[0].distance <= VERY_CLOSE
  return {
    level: veryClose ? 'alert' : 'caution',
    value: `${sites.length} ${sites.length === 1 ? 'site' : 'sites'} à moins de ${RADIUS} m`,
    detail: veryClose
      ? `Un sol pollué est recensé sur la parcelle ou à moins de ${VERY_CLOSE} m : y construire peut exiger une étude de sol et des précautions d’usage.`
      : 'Des sols pollués sont recensés dans les environs.',
    elements: closest.slice(0, CITED).map(({ element: { site, category }, distance }) => ({
      id: site.identifiant_ssp,
      label: siteName(site) ?? site.adresse ?? 'Site sans nom',
      note: `${category} · ${atDistance(distance)}`,
      link: site.fiche_risque,
    })),
  }
}

function siteName(site: PollutedSiteGeorisques): string | null {
  return site.nom ?? site.nom_etablissement ?? null
}

function formerSites(parcel: Parcel, { results, data }: Envelope<CasiasGeorisques>): Reading {
  if (results === 0) {
    return { level: 'info', value: `Aucun recensé à moins de ${RADIUS} m`, detail: null, elements: [] }
  }
  const closest = byDistance(data, (site) => siteDistance(parcel, site.geom))
  // A former site is only a hint: it only calls for caution on the parcel itself.
  const onParcel = closest[0]?.distance === 0
  return {
    level: onParcel ? 'caution' : 'info',
    value: `${results} ${results === 1 ? 'recensé' : 'recensés'} à moins de ${RADIUS} m`,
    detail: onParcel
      ? 'Une activité passée, industrielle ou de service, est recensée sur la parcelle : elle a pu en polluer le sol, sans que ce soit prouvé.'
      : 'Activités passées, industrielles ou de service, qui ont pu polluer les sols : leur présence ne prouve pas une pollution.',
    elements: closest.slice(0, CITED).map(({ element: site, distance }) => ({
      id: site.identifiant_ssp,
      label: site.nom_etablissement ?? site.adresse ?? 'Site sans nom',
      note: [site.nom_etablissement && site.adresse, atDistance(distance)].filter(Boolean).join(' · '),
      link: site.fiche_risque,
    })),
  }
}

const SEVESO: Record<string, { rank: number; level: AlertLevel; detail: string }> = {
  'Seveso seuil haut': {
    rank: 0,
    level: 'alert',
    detail: `Un établissement Seveso seuil haut, où un accident majeur est possible, est recensé à moins de ${INSTALLATIONS_RADIUS / 1000} km : un plan de prévention des risques technologiques peut encadrer les constructions alentour.`,
  },
  'Seveso seuil bas': {
    rank: 1,
    level: 'caution',
    detail: `Un établissement Seveso seuil bas, où un accident grave est possible, est recensé à moins de ${INSTALLATIONS_RADIUS / 1000} km.`,
  },
}

function classifiedInstallations(parcel: Parcel, { data }: Envelope<ClassifiedInstallationGeorisques>): Reading {
  const installations = data.filter(({ regime }) => regime !== 'Non ICPE')
  const radius = `à moins de ${INSTALLATIONS_RADIUS / 1000} km`
  if (installations.length === 0) {
    return { level: 'info', value: `Aucune recensée ${radius}`, detail: null, elements: [] }
  }
  const seveso = (installation: ClassifiedInstallationGeorisques) => SEVESO[installation.statutSeveso ?? '']
  // Seveso establishments first, the most dangerous at the top; then the closest.
  const cited = byDistance(installations, ({ longitude, latitude }) =>
    distanceToPolygon({ lon: longitude, lat: latitude }, parcel.geometry),
  ).toSorted((a, b) => (seveso(a.element)?.rank ?? 2) - (seveso(b.element)?.rank ?? 2))
  const mostDangerous = seveso(cited[0].element)
  return {
    level: mostDangerous?.level ?? 'info',
    value: `${installations.length} ${radius}`,
    detail: mostDangerous?.detail ?? 'Activités encadrées pour leurs risques ou leurs nuisances (bruit, rejets, trafic…).',
    elements: cited.slice(0, CITED).map(({ element: installation, distance }) => ({
      id: installation.codeAIOT,
      label: installation.raisonSociale,
      note: [seveso(installation) ? installation.statutSeveso : installation.regime, atDistance(distance)]
        .filter(Boolean)
        .join(' · '),
      link: `${SITE}/risques/installations/donnees/details/${installation.codeAIOT}`,
    })),
  }
}

// Earthquake-resistant rules (Eurocode 8) apply to new houses from zone 3 upward.
const SEISMICITY: Record<string, { name: string; level: AlertLevel; detail: string }> = {
  '1': { name: 'très faible', level: 'info', detail: 'Aucune règle parasismique n’y est imposée aux constructions.' },
  '2': {
    name: 'faible',
    level: 'info',
    detail: 'Les règles parasismiques ne s’y imposent qu’à certains bâtiments, comme les écoles ou les hôpitaux.',
  },
  '3': {
    name: 'modérée',
    level: 'caution',
    detail: 'Une maison neuve doit y respecter les règles de construction parasismique.',
  },
  '4': {
    name: 'moyenne',
    level: 'alert',
    detail: 'Toute construction neuve doit y respecter des règles parasismiques renforcées.',
  },
  '5': {
    name: 'forte',
    level: 'alert',
    detail: 'Toute construction neuve doit y respecter des règles parasismiques renforcées.',
  },
}

function seismicity(zonings: SeismicZoningGeorisques[]): Reading {
  const code = zonings[0]?.code_zone ?? ''
  const zone = SEISMICITY[code]
  if (!zone) return noData(null)
  return { level: zone.level, value: `Zone ${code} · ${zone.name}`, detail: zone.detail, elements: [] }
}

const RADON: Record<string, { level: AlertLevel; value: string; detail: string }> = {
  '1': {
    level: 'info',
    value: 'Potentiel faible',
    detail: 'Le sous-sol de la commune émet peu de radon, un gaz radioactif naturel.',
  },
  '2': {
    level: 'info',
    value: 'Potentiel faible, avec des facteurs aggravants',
    detail:
      'Le sous-sol émet peu de radon, un gaz radioactif naturel, mais des failles ou des galeries peuvent localement faciliter sa remontée dans les bâtiments.',
  },
  '3': {
    level: 'caution',
    value: 'Potentiel significatif',
    detail:
      'Ce gaz radioactif naturel, qui remonte du sous-sol, peut s’accumuler dans les bâtiments : aérer et étancher les pièces basses limite l’exposition.',
  },
}

function radon(potentials: RadonGeorisques[]): Reading {
  const reading = RADON[potentials[0]?.classe_potentiel ?? '']
  return reading ? { ...reading, elements: [] } : noData(null)
}

function municipalityRisks(municipality: MunicipalityRisksGeorisques | undefined): Reading {
  const risks = municipality?.risques_detail ?? []
  // A detailed risk (« 121 ») refines the family whose number it extends (« 12 »).
  const families = risks.filter(
    (risk) => !risks.some((family) => family !== risk && risk.num_risque.startsWith(family.num_risque)),
  )
  if (families.length === 0) return { level: 'info', value: 'Aucun risque recensé', detail: null, elements: [] }
  return {
    level: 'info',
    value: `${families.length} ${families.length === 1 ? 'risque' : 'risques'}`,
    detail: 'Risques majeurs que l’État recense pour toute la commune : ils ne visent pas forcément la parcelle.',
    elements: families.map((family) => {
      const detailed = risks.filter(
        (risk) => risk !== family && risk.num_risque.startsWith(family.num_risque),
      )
      return {
        id: family.num_risque,
        label: family.libelle_risque_long,
        note: detailed.length > 0 ? detailed.map(({ libelle_risque_long }) => libelle_risque_long).join(' ; ') : null,
        link: null,
      }
    }),
  }
}

// Atlases and territories are municipal: the parcel is not necessarily within their flood zones.
function azi(municipalityAtlases: AziGeorisques[]): Reading {
  if (municipalityAtlases.length === 0) {
    return { level: 'info', value: 'Aucun atlas recensé', detail: null, elements: [] }
  }
  return {
    level: 'caution',
    value: 'Commune couverte',
    detail:
      'Un atlas cartographie les zones inondables de la commune : la carte de Géorisques montre si la parcelle en fait partie.',
    elements: municipalityAtlases.map((atlas) => ({
      id: atlas.code_national_azi,
      label: atlas.libelle_azi,
      note: atlas.date_diffusion && `diffusé le ${atlas.date_diffusion}`,
      link: null,
    })),
  }
}

function tri(territories: TriGeorisques[]): Reading {
  if (territories.length === 0) {
    return { level: 'info', value: 'Aucun territoire recensé', detail: null, elements: [] }
  }
  return {
    level: 'caution',
    value: 'Commune concernée',
    detail:
      'La commune fait partie d’un territoire où les inondations auraient de lourdes conséquences, et dont les zones inondables sont cartographiées : la carte de Géorisques montre si la parcelle en fait partie.',
    elements: territories.map((territory) => ({
      id: territory.code_national_tri,
      // « TRI  Métropole Francilienne »: the acronym repeats the risk's label.
      label: territory.libelle_tri.replace(/^TRI\s+/, '').replace(/\s+/g, ' '),
      note: territory.date_arrete_carte && `cartographié le ${territory.date_arrete_carte}`,
      link: null,
    })),
  }
}

function catnat({ results, data }: Envelope<CatnatGeorisques>): Reading {
  if (results === 0) return { level: 'info', value: 'Aucun événement reconnu', detail: null, elements: [] }
  // The whole history, from most recent to oldest: it is the municipality's memory.
  const recent = data.toSorted((a, b) => isoDate(b.date_debut_evt).localeCompare(isoDate(a.date_debut_evt)))
  return {
    level: 'info',
    value: `${results} ${results === 1 ? 'événement reconnu' : 'événements reconnus'}`,
    detail:
      'Événements reconnus par arrêté comme catastrophes naturelles dans la commune, ce qui a ouvert droit à indemnisation : ils disent ce qui s’y est déjà produit.',
    elements: recent.map((event) => ({
      // A single order sometimes recognizes several events, or several risks of one event.
      id: `${event.code_national_catnat}-${event.date_debut_evt}-${event.libelle_risque_jo}`,
      label: event.libelle_risque_jo,
      note:
        event.date_fin_evt === event.date_debut_evt
          ? `le ${event.date_debut_evt}`
          : `du ${event.date_debut_evt} au ${event.date_fin_evt}`,
      link: null,
    })),
  }
}

/** « jj/mm/aaaa » → « aaaa-mm-jj », which sorts as a string. */
function isoDate(date: string): string {
  return date.split('/').reverse().join('-')
}
