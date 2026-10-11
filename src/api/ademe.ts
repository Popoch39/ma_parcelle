import { centroideOf, containsPoint } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { BlocLoader } from './loader'

const LIGNES = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines'

/** Étiquette d'un DPE, de A (sobre) à G. */
export type Etiquette = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export const ETIQUETTES: readonly Etiquette[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

/** DPE d'un logement. */
export interface Dpe {
  numero: string
  /** Date d'établissement, AAAA-MM-JJ. */
  date: string
  /** Étiquette énergie. */
  etiquetteEnergie: Etiquette | null
  /** Étiquette climat (émissions de gaz à effet de serre). */
  etiquetteClimat: Etiquette | null
  /** Surface habitable du logement, en m². */
  surface: number | null
  adresse: string | null
  /** Distance au centre de la parcelle en mètres, pour un DPE du voisinage. */
  distance: number | null
}

/** Modèle du bloc DPE. */
export interface DpeBloc {
  /** Les DPE sont ceux de la parcelle, ou faute de DPE sur la parcelle, ceux de son voisinage. */
  portee: 'parcelle' | 'voisinage'
  dpe: Dpe[]
  /** Nombre de DPE par étiquette énergie, de A à G (les sept, même à zéro). */
  repartition: Array<{ etiquette: Etiquette; nombre: number }>
  /**
   * Pagination arrêtée avant la fin : lignes lues sur le total annoncé par l'ADEME (DPE de
   * l'emprise de la parcelle, ou du voisinage). Null quand tout a été lu.
   */
  limite: { lues: number; total: number | null } | null
}

/** Ligne brute de `dpe03existant/lines`, réduite aux colonnes demandées. */
interface LigneDpe {
  numero_dpe: string
  date_etablissement_dpe: string
  etiquette_dpe?: string
  etiquette_ges?: string
  surface_habitable_logement?: number
  adresse_ban?: string
  /** « lat,lon » : latitude d'abord. */
  _geopoint: string
  _geo_distance?: number
}

/** Page de `dpe03existant/lines`. */
interface PageDpe {
  /** Nombre de lignes de la requête, seulement en première page. */
  total: number | null
  /** Page suivante, telle quelle (curseur `after`), absente à la dernière page. */
  next?: string | null
  results: LigneDpe[]
}

/** Rayon du voisinage, en mètres. */
export const RAYON_VOISINAGE = 100

const TAILLE_PAGE = '100'
// Au-delà de 300 DPE, la liste n'apprend plus rien à qui regarde une parcelle, et chaque page
// coûte une requête de plus.
const PAGES_MAX = 3

const COLONNES = [
  'numero_dpe',
  'date_etablissement_dpe',
  'etiquette_dpe',
  'etiquette_ges',
  'surface_habitable_logement',
  'adresse_ban',
  '_geopoint',
].join(',')

/** Chargeur du bloc DPE : les DPE des logements de la parcelle, ou à défaut de son voisinage, d'après l'ADEME. */
export const loadDpe: BlocLoader<DpeBloc> = async (fetch, parcelle, { signal } = {}) => {
  const emprise = await lignesDe(
    fetch,
    new URLSearchParams({ bbox: parcelle.emprise.join(','), size: TAILLE_PAGE, sort: '-date_etablissement_dpe', select: COLONNES }),
    signal,
  )
  // L'emprise déborde de la parcelle : seuls comptent les DPE dont le point tombe dedans.
  const dansLaParcelle = emprise.lignes.filter((ligne) => containsPoint(parcelle.geometrie, pointOf(ligne)))
  if (dansLaParcelle.length > 0) return blocOf('parcelle', dansLaParcelle.map(dpeOf), emprise.limite)

  // Triés par distance par défaut : si la limite tombe, ce sont les plus lointains qui manquent.
  const { lon, lat } = centroideOf(parcelle.geometrie)
  const voisinage = await lignesDe(
    fetch,
    new URLSearchParams({ geo_distance: `${lon},${lat},${RAYON_VOISINAGE}m`, size: TAILLE_PAGE, select: COLONNES }),
    signal,
  )
  return blocOf('voisinage', voisinage.lignes.map(dpeOf), voisinage.limite)
}

function blocOf(portee: DpeBloc['portee'], dpe: Dpe[], limite: DpeBloc['limite']): DpeBloc {
  const repartition = ETIQUETTES.map((etiquette) => ({
    etiquette,
    nombre: dpe.filter(({ etiquetteEnergie }) => etiquetteEnergie === etiquette).length,
  }))
  return { portee, dpe, repartition, limite }
}

/** Lignes d'une requête, en suivant les pages jusqu'à `PAGES_MAX`. */
async function lignesDe(fetch: Fetch, params: URLSearchParams, signal: AbortSignal | undefined) {
  const premiere = await fetchJson<PageDpe>(fetch, `${LIGNES}?${params}`, { signal })
  const lignes = [...premiere.results]
  let suivante = premiere.next
  for (let pages = 1; suivante && pages < PAGES_MAX; pages++) {
    const page = await fetchJson<PageDpe>(fetch, suivante, { signal })
    lignes.push(...page.results)
    suivante = page.next
  }
  // `total` n'est donné qu'en première page (null ensuite).
  return { lignes, limite: suivante ? { lues: lignes.length, total: premiere.total } : null }
}

function pointOf({ _geopoint }: LigneDpe) {
  const [lat, lon] = _geopoint.split(',').map(Number)
  return { lon, lat }
}

function dpeOf(ligne: LigneDpe): Dpe {
  return {
    numero: ligne.numero_dpe,
    date: ligne.date_etablissement_dpe,
    etiquetteEnergie: etiquetteOf(ligne.etiquette_dpe),
    etiquetteClimat: etiquetteOf(ligne.etiquette_ges),
    surface: ligne.surface_habitable_logement ?? null,
    adresse: ligne.adresse_ban ?? null,
    distance: ligne._geo_distance ?? null,
  }
}

function etiquetteOf(valeur: string | undefined): Etiquette | null {
  return ETIQUETTES.find((etiquette) => etiquette === valeur) ?? null
}
