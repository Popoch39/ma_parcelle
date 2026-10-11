import type { Point } from 'geojson'
import type { LonLat } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const GEOCODAGE_SEARCH = 'https://data.geopf.fr/geocodage/search'

/** Réponse brute du géocodeur Géoplateforme (index adresse). */
interface GeocodageResponse {
  features: Array<{
    geometry: Point
    properties: { id: string; label: string; context: string; citycode: string }
  }>
}

/** Adresse proposée par le géocodeur. */
export interface Adresse {
  /** Identifiant BAN (clé d'interopérabilité), ex. « 75107_8909_00020 ». */
  id: string
  /** Ex. « 20 Avenue de Ségur 75007 Paris ». */
  label: string
  /** Département et région, ex. « 75, Paris, Île-de-France ». */
  contexte: string
  point: LonLat
}

/**
 * Adresses qui correspondent le mieux à ce texte, de la plus probable à la moins probable.
 * `autocomplete` accepte un dernier mot incomplet, pour suggérer au fil de la frappe.
 */
export async function findAdresses(
  fetch: Fetch,
  texte: string,
  { limit, autocomplete = false, signal }: LoadOptions & { limit: number; autocomplete?: boolean },
): Promise<Adresse[]> {
  const params = new URLSearchParams({ q: texte })
  if (autocomplete) params.set('autocomplete', '1')
  params.set('limit', String(limit))
  const body = await fetchJson<GeocodageResponse>(fetch, `${GEOCODAGE_SEARCH}?${params}`, { signal })
  return body.features.map(({ geometry, properties }) => ({
    id: properties.id,
    label: properties.label,
    contexte: properties.context,
    point: { lon: geometry.coordinates[0], lat: geometry.coordinates[1] },
  }))
}

/** Code INSEE de la commune la plus probable pour ce nom, ou `null` si aucune ne ressemble. */
export async function findCommune(fetch: Fetch, nom: string, { signal }: LoadOptions = {}): Promise<string | null> {
  const params = new URLSearchParams({ q: nom, type: 'municipality', limit: '1' })
  const body = await fetchJson<GeocodageResponse>(fetch, `${GEOCODAGE_SEARCH}?${params}`, { signal })
  return body.features[0]?.properties.citycode ?? null
}
