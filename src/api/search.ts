import type { Geometry, Point } from 'geojson'
import { distanceToBoundary, squareAround, type LonLat } from '@/lib/geo'
import { parseSearchQuery, type SearchQuery } from '@/lib/search-query'
import { findParcels, loadParcel, referenceParams, type Parcel } from './cadastre'
import type { Fetch } from './fetch-json'
import { findAddresses, findMunicipality, type Address } from './geocoding'
import type { LoadOptions } from './loader'

/** Input that designates no parcel, or not a single one. The message is displayed as is. */
export class SearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SearchError'
  }
}

const SUGGESTIONS = 5

/** Addresses to suggest while typing, only if the input looks like an address. */
export async function suggestAddresses(fetch: Fetch, input: string, { signal }: LoadOptions = {}): Promise<Address[]> {
  const query = parseSearchQuery(input)
  if (query.kind !== 'address') return []
  return findAddresses(fetch, query.text, { limit: SUGGESTIONS, autocomplete: true, signal })
}

/**
 * Resolver of the search bar: the parcel designated by a free input (IDU,
 * cadastral reference, coordinates or address).
 */
export async function resolveSearch(fetch: Fetch, input: string, options: LoadOptions = {}): Promise<Parcel> {
  const query = parseSearchQuery(input)
  switch (query.kind) {
    case 'idu':
      return loadParcel(fetch, query.idu, options)
    case 'reference':
      return resolveReference(fetch, query, options)
    case 'coordinates':
      return resolvePoint(fetch, query.point, options)
    case 'address': {
      const [address] = await findAddresses(fetch, query.text, { ...options, limit: 1 })
      if (!address) throw new SearchError(`Aucune adresse ne correspond à « ${query.text} ».`)
      return resolveAddress(fetch, address.point, options)
    }
    case 'incomplete':
      throw new SearchError('Saisissez une adresse, une référence cadastrale (33063 AB 123), un IDU ou des coordonnées.')
  }
}

// Half side of the fallback square: enough to reach both sides of an ordinary street.
const FALLBACK_HALF_SIDE_M = 20

/** The parcel containing this point, or null if none. */
async function parcelAtPoint(fetch: Fetch, point: LonLat, options: LoadOptions): Promise<Parcel | null> {
  const geom: Point = { type: 'Point', coordinates: [point.lon, point.lat] }
  const [parcel] = await findParcelsIn(fetch, geom, options)
  return parcel ?? null
}

/**
 * The parcel containing these coordinates. No fallback to a neighbor: coordinates
 * designate a precise point, and the user must know it is on no parcel.
 */
async function resolvePoint(fetch: Fetch, point: LonLat, options: LoadOptions): Promise<Parcel> {
  const parcel = await parcelAtPoint(fetch, point, options)
  if (parcel) return parcel
  throw new SearchError(
    'Aucune parcelle ne contient ce point : voirie, cours d’eau ou hors du cadastre. Vérifiez les coordonnées, ou choisissez la parcelle sur la carte.',
  )
}

/** The parcel of an address: the one containing its point, or failing that the closest one. */
export async function resolveAddress(fetch: Fetch, point: LonLat, options: LoadOptions = {}): Promise<Parcel> {
  const parcel = await parcelAtPoint(fetch, point, options)
  if (parcel) return parcel

  // An address point often falls on the road, which is not in the cadastre: we then take
  // the closest parcel among those bordering the point.
  const neighbors = await findParcelsIn(fetch, squareAround(point, FALLBACK_HALF_SIDE_M), options)
  if (neighbors.length === 0) throw new SearchError('Aucune parcelle cadastrée à cet endroit.')
  const distances = neighbors.map((neighbor) => distanceToBoundary(point, neighbor.geometry))
  return neighbors[distances.indexOf(Math.min(...distances))]
}

const findParcelsIn = (fetch: Fetch, geom: Geometry, options: LoadOptions) =>
  findParcels(fetch, new URLSearchParams({ geom: JSON.stringify(geom) }), options)

type Reference = Extract<SearchQuery, { kind: 'reference' }>

async function inseeCodeOf(fetch: Fetch, municipality: Reference['municipality'], options: LoadOptions): Promise<string> {
  if ('inseeCode' in municipality) return municipality.inseeCode
  const inseeCode = await findMunicipality(fetch, municipality.name, options)
  if (!inseeCode) throw new SearchError(`Aucune commune ne s’appelle « ${municipality.name} ».`)
  return inseeCode
}

async function resolveReference(fetch: Fetch, reference: Reference, options: LoadOptions): Promise<Parcel> {
  const inseeCode = await inseeCodeOf(fetch, reference.municipality, options)
  const parcels = await findParcels(fetch, referenceParams({ ...reference, inseeCode }), options)
  if (parcels.length === 0) {
    throw new SearchError(`Le cadastre ne connaît aucune parcelle « ${reference.text} ».`)
  }
  if (parcels.length > 1) {
    // Without district or prefix, Paris returns the same reference in several
    // districts, Marseille in several quarters: we do not choose on the user's behalf.
    const references = parcels.map(({ cadastralReference }) => cadastralReference).join(', ')
    throw new SearchError(
      `Plusieurs parcelles correspondent : ${references}. Précisez le préfixe ou l’arrondissement.`,
    )
  }
  return parcels[0]
}
