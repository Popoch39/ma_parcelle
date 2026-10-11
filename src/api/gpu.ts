import type { MultiLineString, MultiPoint, MultiPolygon } from 'geojson'
import { mesureCouverture } from '@/lib/couverture'
import type { Parcelle } from './cadastre'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const API_CARTO_GPU = 'https://apicarto.ign.fr/api/gpu'
const GPU_DOCUMENTS = 'https://data.geopf.fr/annexes/gpu/documents'
const GPU_DOCUMENT_PAGE = 'https://www.geoportail-urbanisme.gouv.fr/document/by-id'

/** Document d'urbanisme applicable à la parcelle. */
export interface DocumentUrbanisme {
  /** Type officiel : PLU, PLUi, CC, PSMV… */
  type: string
  /** Type en toutes lettres, ex. « Plan local d'urbanisme ». */
  libelleType: string
  /** Territoire couvert tel que le Géoportail de l'urbanisme le nomme, ex. « PARIS ». */
  nom: string
  /** Fiche du document sur le Géoportail de l'urbanisme. */
  lien: string
}

/** Zone d'un PLU, ou secteur d'une carte communale, qui couvre la parcelle. */
export interface Zone {
  /** Code officiel, ex. « UG », ou « U » pour un secteur de carte communale. */
  code: string
  /** Libellé long du document, ex. « Zone urbaine générale » ; souvent absent en carte communale. */
  libelle: string | null
  /** Type officiel : `typezone` d'un PLU (U, AUc, A, N…) ou `typesect` d'une carte communale (01, 03…). */
  type: string
  /** Famille en clair, ex. « zone urbaine », « secteur constructible » ; null si le type est inconnu. */
  famille: string | null
  /** Part de la parcelle dans la zone, de 0 à 1. */
  part: number
  /** Règlement écrit (PDF) ; une carte communale n'en a pas. */
  reglement: string | null
  geometrie: MultiPolygon
}

/** Règles d'usage du sol applicables à la parcelle. */
export type Reglementation =
  | { regime: 'document'; document: DocumentUrbanisme | null; zones: Zone[] }
  /** Commune sans document propre : le règlement national d'urbanisme s'applique. */
  | { regime: 'rnu' }
  /**
   * Commune dotée d'un document, mais aucune zone publiée à cet endroit : typiquement un
   * secteur sauvegardé dont le PSMV n'est pas sur le Géoportail de l'urbanisme.
   */
  | { regime: 'sans-zone' }

/** Prescription du document d'urbanisme qui touche la parcelle. */
export interface Prescription {
  /** Libellé du document, ex. « Hauteur plafond ». */
  libelle: string
  /** Précision du document, ex. une valeur ou un indice. */
  texte: string | null
}

/** Servitude d'utilité publique qui touche la parcelle. */
export interface Servitude {
  /** Identifiant de l'emprise au Géoportail de l'urbanisme, unique dans la liste. */
  id: string
  /** Code officiel, ex. « AC1 ». */
  code: string
  /** Catégorie en clair, ex. « Abords de monument historique ». */
  categorie: string
  /** Ce que la servitude protège ou dessert, ex. « Hôtel des Invalides » ; null si non renseigné. */
  nom: string | null
  /** Surface (abords d'un monument), ligne (alignement d'une voie) ou point. */
  geometrie: EmpriseServitude
}

export type EmpriseServitude = MultiPolygon | MultiLineString | MultiPoint

/**
 * Alerte « périmètre ABF » : la parcelle est aux abords d'au moins un monument historique, où
 * les travaux visibles sont soumis à l'avis de l'architecte des bâtiments de France.
 */
export interface PerimetreAbf {
  /** Monuments dont la parcelle est aux abords, sans doublon ; vide si leurs noms ne sont pas publiés. */
  monuments: string[]
}

/**
 * Modèle du bloc Urbanisme. Sans la règle applicable, le bloc échoue ; prescriptions et
 * servitudes, elles, sont null quand leur service n'a pas répondu (indisponibles).
 */
export interface Urbanisme {
  reglementation: Reglementation
  prescriptions: Prescription[] | null
  servitudes: Servitude[] | null
  /** null hors des abords de tout monument historique, ou quand les servitudes sont indisponibles. */
  perimetreAbf: PerimetreAbf | null
}

interface FeatureCollection<Properties, Geometrie = MultiPolygon> {
  features: Array<{ geometry: Geometrie; properties: Properties }>
}

/** Ce que zones de PLU (`zone-urba`) et secteurs de carte communale (`secteur-cc`) ont en commun. */
interface ZonageProperties {
  libelle: string
  libelong: string | null
  partition: string
  gpu_doc_id: string
  nomfic: string | null
}

interface ZoneUrbaProperties extends ZonageProperties {
  typezone: string
}

interface SecteurCcProperties extends ZonageProperties {
  typesect: string
}

interface PrescriptionProperties {
  libelle: string
  txt: string | null
}

interface ServitudeProperties {
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

// L'API renvoie tout objet qui touche la parcelle, y compris les voisins dont le contour,
// numérisé indépendamment du cadastre, mord de quelques centimètres sur son bord.
const PART_SIGNIFICATIVE = 0.01

const LIBELLES_DOCUMENT: Record<string, string> = {
  PLU: 'Plan local d’urbanisme',
  PLUi: 'Plan local d’urbanisme intercommunal',
  CC: 'Carte communale',
  PSMV: 'Plan de sauvegarde et de mise en valeur',
  POS: 'Plan d’occupation des sols',
}

// Nomenclatures CNIG des types de zone (PLU) et de secteur (carte communale).
const FAMILLES_ZONE: Record<string, string> = {
  U: 'zone urbaine',
  AUc: 'zone à urbaniser',
  AUs: 'zone à urbaniser à long terme',
  A: 'zone agricole',
  Ah: 'zone agricole',
  N: 'zone naturelle',
  Nh: 'zone naturelle',
  Nd: 'zone naturelle',
}

const FAMILLES_SECTEUR: Record<string, string> = {
  '01': 'secteur constructible',
  '02': 'secteur constructible réservé aux activités',
  '03': 'secteur non constructible',
}

// Nomenclature nationale des servitudes d'utilité publique, pour les catégories courantes.
const CATEGORIES_SERVITUDE: Record<string, string> = {
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
 * Chargeur du bloc Urbanisme : ce que le Géoportail de l'urbanisme dit de la parcelle,
 * interrogé avec la géométrie de la parcelle.
 */
export async function loadUrbanisme(
  fetch: Fetch,
  parcelle: Parcelle,
  { signal }: LoadOptions = {},
): Promise<Urbanisme> {
  const geom = encodeURIComponent(JSON.stringify(parcelle.geometrie))
  const get = <Properties, Geometrie = MultiPolygon>(endpoint: string, timeoutMs?: number) =>
    fetchJson<FeatureCollection<Properties, Geometrie>>(fetch, `${API_CARTO_GPU}/${endpoint}?geom=${geom}`, {
      signal,
      timeoutMs,
    })
  // Sans zone, document ni commune, on ne sait pas quelle règle s'applique : le bloc échoue.
  // Prescriptions et servitudes complètent la règle : chacune peut manquer seule.
  const [reglement, prescriptions, servitudes] = await Promise.allSettled([
    Promise.all([
      get<ZoneUrbaProperties>('zone-urba'),
      get<SecteurCcProperties>('secteur-cc'),
      get<DocumentProperties>('document'),
      get<MunicipalityProperties>('municipality'),
    ]),
    // Chaque prescription arrive avec toute sa géométrie, parfois une ville entière : plus
    // d'un mégaoctet à Paris, plusieurs secondes même sur une bonne connexion.
    get<PrescriptionProperties>('prescription-surf', 30_000),
    Promise.all([
      get<ServitudeProperties>('assiette-sup-s'),
      get<ServitudeProperties, MultiLineString>('assiette-sup-l'),
      get<ServitudeProperties, MultiPoint>('assiette-sup-p'),
    ]),
  ])
  if (reglement.status === 'rejected') throw reglement.reason
  const [zonesPlu, secteurs, documents, communes] = reglement.value
  const partDe = mesureCouverture(parcelle.geometrie)
  const zones = [
    ...zonesPlu.features.map(({ geometry, properties }) =>
      toZone(geometry, properties, properties.typezone, FAMILLES_ZONE),
    ),
    ...secteurs.features.map(({ geometry, properties }) =>
      toZone(geometry, properties, properties.typesect, FAMILLES_SECTEUR),
    ),
  ]
    .map((zone) => ({ ...zone, part: partDe(zone.geometrie) }))
    .filter(({ part }) => part >= PART_SIGNIFICATIVE)
    .sort((a, b) => b.part - a.part)
  return {
    reglementation: reglementationDe(parcelle, zones, documents, communes),
    prescriptions: prescriptions.status === 'fulfilled' ? prescriptionsDe(prescriptions.value, partDe) : null,
    ...(servitudes.status === 'fulfilled'
      ? servitudesDe(servitudes.value, partDe)
      : { servitudes: null, perimetreAbf: null }),
  }
}

function servitudesDe(
  [surfaces, lignes, points]: [
    FeatureCollection<ServitudeProperties>,
    FeatureCollection<ServitudeProperties, MultiLineString>,
    FeatureCollection<ServitudeProperties, MultiPoint>,
  ],
  partDe: (geometrie: MultiPolygon) => number,
): Pick<Urbanisme, 'servitudes' | 'perimetreAbf'> {
  const touchees: Array<{ geometry: EmpriseServitude; properties: ServitudeProperties }> = [
    ...surfaces.features.filter(({ geometry }) => partDe(geometry) >= PART_SIGNIFICATIVE),
    // Une ligne ou un point n'a pas de surface à mesurer : l'intersection faite par l'API fait foi.
    ...lignes.features,
    ...points.features,
  ]
  const abords = touchees.filter(({ properties }) => estAbordsMonument(properties))
  const monuments = abords.flatMap(({ properties }) => (properties.nomsuplitt ? [reEncode(properties.nomsuplitt)] : []))
  return {
    servitudes: touchees.map(({ geometry, properties }) => toServitude(geometry, properties)),
    perimetreAbf: abords.length > 0 ? { monuments: [...new Set(monuments)] } : null,
  }
}

// Un monument historique (AC1) a deux emprises : la sienne et celle de ses abords.
function estAbordsMonument({ suptype, typeass }: ServitudeProperties): boolean {
  return suptype.toUpperCase() === 'AC1' && /abords/i.test(typeass ?? '')
}

function toServitude(geometrie: EmpriseServitude, properties: ServitudeProperties): Servitude {
  const code = properties.suptype.toUpperCase()
  const monument = code === 'AC1' && !estAbordsMonument(properties)
  return {
    id: properties.idass,
    code,
    categorie: monument ? 'Monument historique' : (CATEGORIES_SERVITUDE[code] ?? 'Servitude d’utilité publique'),
    nom: properties.nomsuplitt ? reEncode(properties.nomsuplitt) : null,
    geometrie,
  }
}

/**
 * Répare un texte UTF-8 lu comme du Latin-1 avant d'être servi (« HÃ´tel » pour « Hôtel »),
 * comme les noms des monuments historiques. Un texte sain est rendu tel quel.
 */
function reEncode(texte: string): string {
  const octets = Array.from(texte, (c) => c.charCodeAt(0))
  if (!/[ÂÃ]/.test(texte) || octets.some((octet) => octet > 0xff)) return texte
  const repare = new TextDecoder().decode(Uint8Array.from(octets))
  // Pas une suite UTF-8 valide : le texte contenait vraiment ces caractères.
  return repare.includes('�') ? texte : repare
}

function prescriptionsDe(
  prescriptions: FeatureCollection<PrescriptionProperties>,
  partDe: (geometrie: MultiPolygon) => number,
): Prescription[] {
  const parLibelle = new Map<string, Prescription>()
  for (const { geometry, properties } of prescriptions.features) {
    if (partDe(geometry) < PART_SIGNIFICATIVE) continue
    const prescription = { libelle: properties.libelle, texte: properties.txt || null }
    // Une même prescription est souvent découpée en plusieurs objets, un par îlot.
    parLibelle.set(`${prescription.libelle}\n${prescription.texte}`, prescription)
  }
  return [...parLibelle.values()]
}

/** Zone, avec la partition du document qui la publie. */
type ZoneDuDocument = Zone & { partition: string }

function toZone(
  geometrie: MultiPolygon,
  { libelle, libelong, partition, gpu_doc_id, nomfic }: ZonageProperties,
  type: string,
  familles: Record<string, string>,
): Omit<ZoneDuDocument, 'part'> {
  return {
    code: libelle,
    libelle: libelong,
    type,
    famille: familles[type] ?? null,
    reglement: nomfic ? `${GPU_DOCUMENTS}/${partition}/${gpu_doc_id}/${nomfic}` : null,
    geometrie,
    partition,
  }
}

function reglementationDe(
  parcelle: Parcelle,
  zones: ZoneDuDocument[],
  documents: FeatureCollection<DocumentProperties>,
  communes: FeatureCollection<MunicipalityProperties>,
): Reglementation {
  if (zones.length === 0) {
    // Une parcelle en limite touche aussi la commune voisine : seule la sienne compte.
    const codes = [parcelle.commune.codeInsee, parcelle.arrondissement?.codeInsee]
    const commune = communes.features.find(({ properties }) => codes.includes(properties.insee))
    return { regime: commune?.properties.is_rnu ? 'rnu' : 'sans-zone' }
  }
  const document = documents.features.find(({ properties }) => properties.partition === zones[0]?.partition)
  return {
    regime: 'document',
    document: document ? toDocument(document.properties) : null,
    zones: zones.map(({ partition: _partition, ...zone }) => zone),
  }
}

function toDocument({ du_type, grid_title, gpu_doc_id }: DocumentProperties): DocumentUrbanisme {
  return {
    type: du_type,
    libelleType: LIBELLES_DOCUMENT[du_type] ?? du_type,
    nom: grid_title,
    lien: `${GPU_DOCUMENT_PAGE}/${gpu_doc_id}`,
  }
}
