import type { MultiPolygon } from 'geojson'
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

/** Modèle du bloc Urbanisme. */
export interface Urbanisme {
  reglementation: Reglementation
  prescriptions: Prescription[]
}

interface FeatureCollection<Properties> {
  features: Array<{ geometry: MultiPolygon; properties: Properties }>
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
  const get = <Properties>(endpoint: string, timeoutMs?: number) =>
    fetchJson<FeatureCollection<Properties>>(fetch, `${API_CARTO_GPU}/${endpoint}?geom=${geom}`, {
      signal,
      timeoutMs,
    })
  const [zonesPlu, secteurs, documents, communes, prescriptions] = await Promise.all([
    get<ZoneUrbaProperties>('zone-urba'),
    get<SecteurCcProperties>('secteur-cc'),
    get<DocumentProperties>('document'),
    get<MunicipalityProperties>('municipality'),
    // Chaque prescription arrive avec toute sa géométrie, parfois une ville entière : plus
    // d'un mégaoctet à Paris, plusieurs secondes même sur une bonne connexion.
    get<PrescriptionProperties>('prescription-surf', 30_000),
  ])
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
    prescriptions: prescriptionsDe(prescriptions, partDe),
  }
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
