import type { Geometry, Point } from 'geojson'
import { distanceToBoundary, squareAround, type LonLat } from '@/lib/geo'
import { parseSearchQuery, type SearchQuery } from '@/lib/search-query'
import { findParcelles, loadParcelle, referenceParams, type Parcelle } from './cadastre'
import type { Fetch } from './fetch-json'
import { findAdresses, findCommune, type Adresse } from './geocodage'
import type { LoadOptions } from './loader'

/** Saisie qui ne désigne aucune parcelle, ou pas une seule. Le message s'affiche tel quel. */
export class SearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SearchError'
  }
}

const SUGGESTIONS = 5

/** Adresses à suggérer pendant la frappe, seulement si la saisie ressemble à une adresse. */
export async function suggestAdresses(fetch: Fetch, saisie: string, { signal }: LoadOptions = {}): Promise<Adresse[]> {
  const query = parseSearchQuery(saisie)
  if (query.kind !== 'adresse') return []
  return findAdresses(fetch, query.texte, { limit: SUGGESTIONS, autocomplete: true, signal })
}

/**
 * Résolveur de la barre de recherche : la parcelle désignée par une saisie libre (IDU,
 * référence cadastrale, coordonnées ou adresse).
 */
export async function resolveSearch(fetch: Fetch, saisie: string, options: LoadOptions = {}): Promise<Parcelle> {
  const query = parseSearchQuery(saisie)
  switch (query.kind) {
    case 'idu':
      return loadParcelle(fetch, query.idu, options)
    case 'reference':
      return resolveReference(fetch, query, options)
    case 'coordonnees':
      return resolvePoint(fetch, query.point, options)
    case 'adresse': {
      const [adresse] = await findAdresses(fetch, query.texte, { ...options, limit: 1 })
      if (!adresse) throw new SearchError(`Aucune adresse ne correspond à « ${query.texte} ».`)
      return resolveAdresse(fetch, adresse.point, options)
    }
    case 'incomplete':
      throw new SearchError('Saisissez une adresse, une référence cadastrale (33063 AB 123), un IDU ou des coordonnées.')
  }
}

// Demi-côté du carré de repli : de quoi atteindre les deux rives d'une rue ordinaire.
const REPLI_DEMI_COTE_M = 20

/** La parcelle qui contient ce point, ou null si aucune. */
async function parcelleAuPoint(fetch: Fetch, point: LonLat, options: LoadOptions): Promise<Parcelle | null> {
  const geom: Point = { type: 'Point', coordinates: [point.lon, point.lat] }
  const [parcelle] = await findParcellesIn(fetch, geom, options)
  return parcelle ?? null
}

/**
 * La parcelle qui contient ces coordonnées. Pas de repli sur une voisine : des coordonnées
 * désignent un point précis, et l'utilisateur doit savoir qu'il n'est sur aucune parcelle.
 */
async function resolvePoint(fetch: Fetch, point: LonLat, options: LoadOptions): Promise<Parcelle> {
  const parcelle = await parcelleAuPoint(fetch, point, options)
  if (parcelle) return parcelle
  throw new SearchError(
    'Aucune parcelle ne contient ce point : voirie, cours d’eau ou hors du cadastre. Vérifiez les coordonnées, ou choisissez la parcelle sur la carte.',
  )
}

/** La parcelle d'une adresse : celle qui contient son point, ou à défaut la plus proche. */
export async function resolveAdresse(fetch: Fetch, point: LonLat, options: LoadOptions = {}): Promise<Parcelle> {
  const parcelle = await parcelleAuPoint(fetch, point, options)
  if (parcelle) return parcelle

  // Le point d'une adresse tombe souvent sur la voirie, qui n'est pas cadastrée : on prend
  // alors la parcelle la plus proche parmi celles qui bordent le point.
  const voisines = await findParcellesIn(fetch, squareAround(point, REPLI_DEMI_COTE_M), options)
  if (voisines.length === 0) throw new SearchError('Aucune parcelle cadastrée à cet endroit.')
  const distances = voisines.map((voisine) => distanceToBoundary(point, voisine.geometrie))
  return voisines[distances.indexOf(Math.min(...distances))]
}

const findParcellesIn = (fetch: Fetch, geom: Geometry, options: LoadOptions) =>
  findParcelles(fetch, new URLSearchParams({ geom: JSON.stringify(geom) }), options)

type Reference = Extract<SearchQuery, { kind: 'reference' }>

async function codeInseeOf(fetch: Fetch, commune: Reference['commune'], options: LoadOptions): Promise<string> {
  if ('codeInsee' in commune) return commune.codeInsee
  const codeInsee = await findCommune(fetch, commune.nom, options)
  if (!codeInsee) throw new SearchError(`Aucune commune ne s’appelle « ${commune.nom} ».`)
  return codeInsee
}

async function resolveReference(fetch: Fetch, reference: Reference, options: LoadOptions): Promise<Parcelle> {
  const codeInsee = await codeInseeOf(fetch, reference.commune, options)
  const parcelles = await findParcelles(fetch, referenceParams({ ...reference, codeInsee }), options)
  if (parcelles.length === 0) {
    throw new SearchError(`Le cadastre ne connaît aucune parcelle « ${reference.texte} ».`)
  }
  if (parcelles.length > 1) {
    // Sans arrondissement ni préfixe, Paris renvoie la même référence dans plusieurs
    // arrondissements, Marseille dans plusieurs quartiers : on ne choisit pas à la place de l'utilisateur.
    const references = parcelles.map(({ referenceCadastrale }) => referenceCadastrale).join(', ')
    throw new SearchError(
      `Plusieurs parcelles correspondent : ${references}. Précisez le préfixe ou l’arrondissement.`,
    )
  }
  return parcelles[0]
}
