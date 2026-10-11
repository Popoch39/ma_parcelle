import type { MultiLineString, MultiPoint, MultiPolygon } from 'geojson'
import { measureCoverage } from '@/lib/coverage'
import type { Parcel } from './cadastre'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const API_CARTO_GPU = 'https://apicarto.ign.fr/api/gpu'
const GPU_DOCUMENTS = 'https://data.geopf.fr/annexes/gpu/documents'
const GPU_DOCUMENT_PAGE = 'https://www.geoportail-urbanisme.gouv.fr/document/by-id'

/** Planning document that applies to the parcel. */
export interface PlanningDocument {
  /** Official type: PLU, PLUi, CC, PSMV… */
  type: string
  /** Type spelled out, e.g. « Plan local d'urbanisme ». */
  typeLabel: string
  /** Covered territory as the Géoportail de l'urbanisme names it, e.g. « PARIS ». */
  name: string
  /** Page of the document on the Géoportail de l'urbanisme. */
  link: string
}

/** Zone of a PLU, or sector of a municipal map, that covers the parcel. */
export interface Zone {
  /** Official code, e.g. « UG », or « U » for a municipal map sector. */
  code: string
  /** Long label from the document, e.g. « Zone urbaine générale »; often missing in a municipal map. */
  label: string | null
  /** Official type: `typezone` of a PLU (U, AUc, A, N…) or `typesect` of a municipal map (01, 03…). */
  type: string
  /** Family in plain words, e.g. « zone urbaine », « secteur constructible »; null if the type is unknown. */
  family: string | null
  /** Share of the parcel in the zone, from 0 to 1. */
  share: number
  /** Written rules (PDF); a municipal map has none. */
  rules: string | null
  geometry: MultiPolygon
}

/** Land-use rules that apply to the parcel. */
export type Regulation =
  | { regime: 'document'; document: PlanningDocument | null; zones: Zone[] }
  /** Municipality without its own document: the national planning rules (RNU) apply. */
  | { regime: 'rnu' }
  /**
   * Municipality with a document, but no zone published at this spot: typically a
   * safeguarded sector whose PSMV is not on the Géoportail de l'urbanisme.
   */
  | { regime: 'no-zone' }

/** Prescription of the planning document that touches the parcel. */
export interface Prescription {
  /** Label from the document, e.g. « Hauteur plafond ». */
  label: string
  /** Detail from the document, e.g. a value or an index. */
  text: string | null
}

/** Public utility easement (« servitude d'utilité publique ») that touches the parcel. */
export interface Easement {
  /** Id of the footprint on the Géoportail de l'urbanisme, unique within the list. */
  id: string
  /** Official code, e.g. « AC1 ». */
  code: string
  /** Category in plain words, e.g. « Abords de monument historique ». */
  category: string
  /** What the easement protects or serves, e.g. « Hôtel des Invalides »; null if not filled in. */
  name: string | null
  /** Surface (surroundings of a monument), line (alignment of a road) or point. */
  geometry: EasementGeometry
}

export type EasementGeometry = MultiPolygon | MultiLineString | MultiPoint

/**
 * « ABF perimeter » alert: the parcel is in the surroundings of at least one historic monument,
 * where visible works are subject to the opinion of the architecte des bâtiments de France.
 */
export interface AbfPerimeter {
  /** Monuments whose surroundings include the parcel, without duplicates; empty if their names are not published. */
  monuments: string[]
}

/**
 * Model of the Planning block. Without the applicable rule, the block fails; prescriptions and
 * easements, for their part, are null when their service did not respond (unavailable).
 */
export interface Planning {
  regulation: Regulation
  prescriptions: Prescription[] | null
  easements: Easement[] | null
  /** null outside the surroundings of any historic monument, or when easements are unavailable. */
  abfPerimeter: AbfPerimeter | null
}

interface FeatureCollection<Properties, Geometry = MultiPolygon> {
  features: Array<{ geometry: Geometry; properties: Properties }>
}

/** What PLU zones (`zone-urba`) and municipal map sectors (`secteur-cc`) have in common. */
interface ZoningProperties {
  libelle: string
  libelong: string | null
  partition: string
  gpu_doc_id: string
  nomfic: string | null
}

interface ZoneUrbaProperties extends ZoningProperties {
  typezone: string
}

interface SecteurCcProperties extends ZoningProperties {
  typesect: string
}

interface PrescriptionProperties {
  libelle: string
  txt: string | null
}

interface EasementProperties {
  idass: string
  suptype: string
  typeass: string | null
  nomsuplitt: string | null
}

interface MunicipalityProperties {
  insee: string
  is_rnu: boolean
}

interface DocumentProperties {
  du_type: string
  grid_title: string
  partition: string
  gpu_doc_id: string
}

// The API returns every feature that touches the parcel, including neighbors whose outline,
// digitized independently of the cadastre, bites a few centimeters into its edge.
const SIGNIFICANT_SHARE = 0.01

const DOCUMENT_LABELS: Record<string, string> = {
  PLU: 'Plan local d’urbanisme',
  PLUi: 'Plan local d’urbanisme intercommunal',
  CC: 'Carte communale',
  PSMV: 'Plan de sauvegarde et de mise en valeur',
  POS: 'Plan d’occupation des sols',
}

// CNIG nomenclatures of zone types (PLU) and sector types (municipal map).
const ZONE_FAMILIES: Record<string, string> = {
  U: 'zone urbaine',
  AUc: 'zone à urbaniser',
  AUs: 'zone à urbaniser à long terme',
  A: 'zone agricole',
  Ah: 'zone agricole',
  N: 'zone naturelle',
  Nh: 'zone naturelle',
  Nd: 'zone naturelle',
}

const SECTOR_FAMILIES: Record<string, string> = {
  '01': 'secteur constructible',
  '02': 'secteur constructible réservé aux activités',
  '03': 'secteur non constructible',
}

// National nomenclature of public utility easements, for the common categories.
const EASEMENT_CATEGORIES: Record<string, string> = {
  AC1: 'Abords de monument historique',
  AC2: 'Site inscrit ou classé',
  AC3: 'Réserve naturelle',
  AC4: 'Site patrimonial remarquable',
  A4: 'Passage le long d’un cours d’eau',
  A5: 'Canalisation d’eau ou d’assainissement',
  AS1: 'Protection d’un captage d’eau potable',
  EL3: 'Halage et marchepied',
  EL7: 'Alignement des voies publiques',
  I1: 'Canalisation de transport de matières dangereuses',
  I3: 'Canalisation de gaz',
  I4: 'Ligne électrique',
  INT1: 'Voisinage d’un cimetière',
  JS1: 'Protection d’une installation sportive',
  PM1: 'Plan de prévention des risques naturels',
  PM2: 'Installation classée pour l’environnement',
  PM3: 'Plan de prévention des risques technologiques',
  PT1: 'Transmissions radioélectriques (perturbations)',
  PT2: 'Transmissions radioélectriques (obstacles)',
  PT3: 'Réseau de télécommunications',
  T1: 'Voie ferrée',
  T4: 'Balisage aéronautique',
  T5: 'Dégagement aéronautique',
  T7: 'Servitude aéronautique',
}

/**
 * Loader of the Planning block: what the Géoportail de l'urbanisme says about the parcel,
 * queried with the parcel's geometry.
 */
export async function loadPlanning(
  fetch: Fetch,
  parcel: Parcel,
  { signal }: LoadOptions = {},
): Promise<Planning> {
  const geom = encodeURIComponent(JSON.stringify(parcel.geometry))
  const get = <Properties, Geometry = MultiPolygon>(endpoint: string, timeoutMs?: number) =>
    fetchJson<FeatureCollection<Properties, Geometry>>(fetch, `${API_CARTO_GPU}/${endpoint}?geom=${geom}`, {
      signal,
      timeoutMs,
    })
  // Without zone, document or municipality, we do not know which rule applies: the block fails.
  // Prescriptions and easements complement the rule: each one may be missing on its own.
  const [regulation, prescriptions, easements] = await Promise.allSettled([
    Promise.all([
      get<ZoneUrbaProperties>('zone-urba'),
      get<SecteurCcProperties>('secteur-cc'),
      get<DocumentProperties>('document'),
      get<MunicipalityProperties>('municipality'),
    ]),
    // Each prescription comes with its whole geometry, sometimes an entire city: more
    // than a megabyte in Paris, several seconds even on a good connection.
    get<PrescriptionProperties>('prescription-surf', 30_000),
    Promise.all([
      get<EasementProperties>('assiette-sup-s'),
      get<EasementProperties, MultiLineString>('assiette-sup-l'),
      get<EasementProperties, MultiPoint>('assiette-sup-p'),
    ]),
  ])
  if (regulation.status === 'rejected') throw regulation.reason
  const [pluZones, sectors, documents, municipalities] = regulation.value
  const shareOf = measureCoverage(parcel.geometry)
  const zones = [
    ...pluZones.features.map(({ geometry, properties }) =>
      toZone(geometry, properties, properties.typezone, ZONE_FAMILIES),
    ),
    ...sectors.features.map(({ geometry, properties }) =>
      toZone(geometry, properties, properties.typesect, SECTOR_FAMILIES),
    ),
  ]
    .map((zone) => ({ ...zone, share: shareOf(zone.geometry) }))
    .filter(({ share }) => share >= SIGNIFICANT_SHARE)
    .sort((a, b) => b.share - a.share)
  return {
    regulation: regulationOf(parcel, zones, documents, municipalities),
    prescriptions: prescriptions.status === 'fulfilled' ? prescriptionsOf(prescriptions.value, shareOf) : null,
    ...(easements.status === 'fulfilled'
      ? easementsOf(easements.value, shareOf)
      : { easements: null, abfPerimeter: null }),
  }
}

function easementsOf(
  [surfaces, lines, points]: [
    FeatureCollection<EasementProperties>,
    FeatureCollection<EasementProperties, MultiLineString>,
    FeatureCollection<EasementProperties, MultiPoint>,
  ],
  shareOf: (geometry: MultiPolygon) => number,
): Pick<Planning, 'easements' | 'abfPerimeter'> {
  const touched: Array<{ geometry: EasementGeometry; properties: EasementProperties }> = [
    ...surfaces.features.filter(({ geometry }) => shareOf(geometry) >= SIGNIFICANT_SHARE),
    // A line or a point has no surface to measure: the intersection done by the API is authoritative.
    ...lines.features,
    ...points.features,
  ]
  const surroundings = touched.filter(({ properties }) => isMonumentSurroundings(properties))
  const monuments = surroundings.flatMap(({ properties }) => (properties.nomsuplitt ? [reEncode(properties.nomsuplitt)] : []))
  return {
    easements: touched.map(({ geometry, properties }) => toEasement(geometry, properties)),
    abfPerimeter: surroundings.length > 0 ? { monuments: [...new Set(monuments)] } : null,
  }
}

// A historic monument (AC1) has two footprints: its own and that of its surroundings.
function isMonumentSurroundings({ suptype, typeass }: EasementProperties): boolean {
  return suptype.toUpperCase() === 'AC1' && /abords/i.test(typeass ?? '')
}

function toEasement(geometry: EasementGeometry, properties: EasementProperties): Easement {
  const code = properties.suptype.toUpperCase()
  const monument = code === 'AC1' && !isMonumentSurroundings(properties)
  return {
    id: properties.idass,
    code,
    category: monument ? 'Monument historique' : (EASEMENT_CATEGORIES[code] ?? 'Servitude d’utilité publique'),
    name: properties.nomsuplitt ? reEncode(properties.nomsuplitt) : null,
    geometry,
  }
}

/**
 * Repairs a UTF-8 text read as Latin-1 before being served (« HÃ´tel » for « Hôtel »),
 * like the names of historic monuments. A sound text is returned as is.
 */
function reEncode(text: string): string {
  const bytes = Array.from(text, (c) => c.charCodeAt(0))
  if (!/[ÂÃ]/.test(text) || bytes.some((byte) => byte > 0xff)) return text
  const repaired = new TextDecoder().decode(Uint8Array.from(bytes))
  // Not a valid UTF-8 sequence: the text really contained these characters.
  return repaired.includes('�') ? text : repaired
}

function prescriptionsOf(
  prescriptions: FeatureCollection<PrescriptionProperties>,
  shareOf: (geometry: MultiPolygon) => number,
): Prescription[] {
  const byLabel = new Map<string, Prescription>()
  for (const { geometry, properties } of prescriptions.features) {
    if (shareOf(geometry) < SIGNIFICANT_SHARE) continue
    const prescription = { label: properties.libelle, text: properties.txt || null }
    // The same prescription is often split into several features, one per block of land.
    byLabel.set(`${prescription.label}\n${prescription.text}`, prescription)
  }
  return [...byLabel.values()]
}

/** Zone, with the partition of the document that publishes it. */
type DocumentZone = Zone & { partition: string }

function toZone(
  geometry: MultiPolygon,
  { libelle, libelong, partition, gpu_doc_id, nomfic }: ZoningProperties,
  type: string,
  families: Record<string, string>,
): Omit<DocumentZone, 'share'> {
  return {
    code: libelle,
    label: libelong,
    type,
    family: families[type] ?? null,
    rules: nomfic ? `${GPU_DOCUMENTS}/${partition}/${gpu_doc_id}/${nomfic}` : null,
    geometry,
    partition,
  }
}

function regulationOf(
  parcel: Parcel,
  zones: DocumentZone[],
  documents: FeatureCollection<DocumentProperties>,
  municipalities: FeatureCollection<MunicipalityProperties>,
): Regulation {
  if (zones.length === 0) {
    // A parcel on the boundary also touches the neighboring municipality: only its own counts.
    const codes = [parcel.municipality.inseeCode, parcel.district?.inseeCode]
    const municipality = municipalities.features.find(({ properties }) => codes.includes(properties.insee))
    return { regime: municipality?.properties.is_rnu ? 'rnu' : 'no-zone' }
  }
  const document = documents.features.find(({ properties }) => properties.partition === zones[0]?.partition)
  return {
    regime: 'document',
    document: document ? toDocument(document.properties) : null,
    zones: zones.map(({ partition: _partition, ...zone }) => zone),
  }
}

function toDocument({ du_type, grid_title, gpu_doc_id }: DocumentProperties): PlanningDocument {
  return {
    type: du_type,
    typeLabel: DOCUMENT_LABELS[du_type] ?? du_type,
    name: grid_title,
    link: `${GPU_DOCUMENT_PAGE}/${gpu_doc_id}`,
  }
}
