import { distanceBetween, type LonLat } from './geo'

/** Rayon du voisinage des ventes, en mètres. */
export const RAYON_VOISINAGE = 500

/** Les ventes retenues remontent aux cinq années qui précèdent l'année en cours. */
export const ANNEES_DE_VENTES = 5

/** En dessous de ce nombre de ventes simples, la médiane d'un type n'est pas significative. */
export const SEUIL_MEDIANE = 5

/** Ce que la vente a cédé, au niveau de détail que les deux sources partagent. */
export type TypeBien =
  | 'maison'
  | 'appartement'
  | 'maisons'
  | 'appartements'
  /** Maisons et appartements. */
  | 'logements'
  /** Logement et local professionnel. */
  | 'mixte'
  | 'local'
  | 'dependance'
  | 'terrain'
  | 'indetermine'

/** Les deux types de logement pour lesquels on calcule un prix médian. */
export type TypeLogement = 'maison' | 'appartement'

/** Raison pour laquelle une vente est listée mais ne compte pas dans le prix médian. */
export type MotifExclusion =
  | 'vente-groupee'
  | 'local-professionnel'
  | 'dependance'
  | 'terrain'
  | 'bien-indetermine'
  | 'hors-marche'
  | 'prix-inconnu'
  | 'surface-inconnue'

export const LIBELLES_TYPE: Record<TypeBien, string> = {
  maison: 'Maison',
  appartement: 'Appartement',
  maisons: 'Plusieurs maisons',
  appartements: 'Plusieurs appartements',
  logements: 'Plusieurs logements',
  mixte: 'Logement et local professionnel',
  local: 'Local professionnel',
  dependance: 'Dépendance',
  terrain: 'Terrain',
  indetermine: 'Bien non décrit',
}

/** Motif d'exclusion en clair, à la suite de « Exclue de la médiane : ». */
export const LIBELLES_EXCLUSION: Record<MotifExclusion, string> = {
  'vente-groupee': 'vente groupée de plusieurs logements',
  'local-professionnel': 'comprend un local professionnel',
  dependance: 'dépendance seule',
  terrain: 'terrain',
  'bien-indetermine': 'bien non décrit',
  'hors-marche': 'échange ou expropriation, prix hors marché',
  'prix-inconnu': 'prix non publié',
  'surface-inconnue': 'surface bâtie non publiée',
}

/** Une vente telle qu'une source la décrit, une fois normalisée. */
export interface Mutation {
  id: string
  /** AAAA-MM-JJ. */
  date: string
  /** Nature de la mutation selon la DGFiP, ex. « Vente », « Vente en l'état futur d'achèvement ». */
  nature: string
  type: TypeBien
  /** En euros. */
  prix: number | null
  /** En m². */
  surfaceBatie: number | null
  /** En m². */
  surfaceTerrain: number | null
  /** Point du bien vendu le plus proche de la parcelle. */
  position: LonLat
}

/** Une vente du voisinage, située et classée. */
export interface Vente extends Mutation {
  /** Distance au centre de la parcelle, en mètres. */
  distance: number
  /** Prix rapporté à la surface bâtie, en €/m², quand les deux sont connus. */
  prixM2: number | null
  /** `null` pour une vente simple, qui compte dans le prix médian. */
  exclusion: MotifExclusion | null
}

/** Prix médian au m² d'un type de logement, toujours accompagné du nombre de ventes retenues. */
export interface PrixMedian {
  /** `null` quand les ventes retenues sont trop peu nombreuses pour être significatives. */
  prixM2: number | null
  ventes: number
}

export type Medianes = Record<TypeLogement, PrixMedian>

// Un échange ou une expropriation a une valeur déclarée, pas un prix négocié sur le marché.
const HORS_MARCHE = /^(é|e)change|^expropriation/i

const EXCLUSION_PAR_TYPE: Record<Exclude<TypeBien, TypeLogement>, MotifExclusion> = {
  maisons: 'vente-groupee',
  appartements: 'vente-groupee',
  logements: 'vente-groupee',
  mixte: 'local-professionnel',
  local: 'local-professionnel',
  dependance: 'dependance',
  terrain: 'terrain',
  indetermine: 'bien-indetermine',
}

function exclusionOf(mutation: Mutation): MotifExclusion | null {
  if (HORS_MARCHE.test(mutation.nature)) return 'hors-marche'
  if (mutation.type !== 'maison' && mutation.type !== 'appartement') return EXCLUSION_PAR_TYPE[mutation.type]
  if (!mutation.prix) return 'prix-inconnu'
  if (!mutation.surfaceBatie) return 'surface-inconnue'
  return null
}

/**
 * Ventes du cercle de `rayon` mètres autour de `centre`, depuis le 1er janvier de `depuis`,
 * de la plus récente à la plus ancienne.
 */
export function ventesDuVoisinage(mutations: Mutation[], centre: LonLat, rayon: number, depuis: number): Vente[] {
  return mutations
    .map((mutation) => ({
      ...mutation,
      distance: distanceBetween(centre, mutation.position),
      prixM2: mutation.prix && mutation.surfaceBatie ? mutation.prix / mutation.surfaceBatie : null,
      exclusion: exclusionOf(mutation),
    }))
    .filter((vente) => vente.distance <= rayon && vente.date >= `${depuis}-01-01`)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Prix médian au m² des maisons et des appartements, sur les seules ventes simples. */
export function medianesOf(ventes: Vente[]): Medianes {
  const medianeDe = (type: TypeLogement): PrixMedian => {
    const prix = ventes.flatMap(({ type: typeVente, exclusion, prixM2 }) =>
      typeVente === type && exclusion === null && prixM2 !== null ? [prixM2] : [],
    )
    return { prixM2: prix.length < SEUIL_MEDIANE ? null : mediane(prix), ventes: prix.length }
  }
  return { maison: medianeDe('maison'), appartement: medianeDe('appartement') }
}

function mediane(valeurs: number[]): number {
  const tries = valeurs.toSorted((a, b) => a - b)
  const milieu = Math.floor(tries.length / 2)
  return tries.length % 2 ? tries[milieu] : (tries[milieu - 1] + tries[milieu]) / 2
}
