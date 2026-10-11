import type { Point } from 'geojson'
import type { LonLat } from '@/lib/geo'
import { fetchJson, type Fetch } from './fetch-json'
import type { LoadOptions } from './loader'

const GEOCODING_SEARCH = 'https://data.geopf.fr/geocodage/search'

/** Raw response of the Géoplateforme geocoder (address index). */
interface GeocodingResponse {
  features: Array<{
    geometry: Point
    properties: { id: string; label: string; context: string; citycode: string }
  }>
}

/** Address suggested by the geocoder. */
export interface Address {
  /** BAN identifier (interoperability key), e.g. "75107_8909_00020". */
  id: string
  /** E.g. "20 Avenue de Ségur 75007 Paris". */
  label: string
  /** Department and region, e.g. "75, Paris, Île-de-France". */
  context: string
  point: LonLat
}

/**
 * Addresses that best match this text, from the most to the least likely.
 * `autocomplete` accepts an incomplete last word, to suggest while typing.
 */
export async function findAddresses(
  fetch: Fetch,
  text: string,
  { limit, autocomplete = false, signal }: LoadOptions & { limit: number; autocomplete?: boolean },
): Promise<Address[]> {
  const params = new URLSearchParams({ q: text })
  if (autocomplete) params.set('autocomplete', '1')
  params.set('limit', String(limit))
  const body = await fetchJson<GeocodingResponse>(fetch, `${GEOCODING_SEARCH}?${params}`, { signal })
  return body.features.map(({ geometry, properties }) => ({
    id: properties.id,
    label: properties.label,
    context: properties.context,
    point: { lon: geometry.coordinates[0], lat: geometry.coordinates[1] },
  }))
}

/** INSEE code of the most likely municipality for this name, or `null` if none looks alike. */
export async function findMunicipality(fetch: Fetch, name: string, { signal }: LoadOptions = {}): Promise<string | null> {
  const params = new URLSearchParams({ q: name, type: 'municipality', limit: '1' })
  const body = await fetchJson<GeocodingResponse>(fetch, `${GEOCODING_SEARCH}?${params}`, { signal })
  return body.features[0]?.properties.citycode ?? null
}
