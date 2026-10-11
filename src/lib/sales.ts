import { distanceBetween, type LonLat } from './geo'

/** Radius of the sales neighborhood, in metres. */
export const NEIGHBORHOOD_RADIUS = 500

/** The sales kept go back to the five years preceding the current year. */
export const SALES_YEARS = 5

/** Below this count of simple sales, the median of a type is not significant. */
export const MEDIAN_THRESHOLD = 5

/** What the sale transferred, at the level of detail both sources share. */
export type PropertyType =
  | 'house'
  | 'apartment'
  | 'houses'
  | 'apartments'
  /** Houses and apartments. */
  | 'dwellings'
  /** Dwelling and commercial premises. */
  | 'mixed'
  | 'commercial'
  | 'outbuilding'
  | 'land'
  | 'unknown'

/** The two dwelling types for which a median price is computed. */
export type DwellingType = 'house' | 'apartment'

/** Reason why a sale is listed but does not count towards the median price. */
export type ExclusionReason =
  | 'bulk-sale'
  | 'commercial-premises'
  | 'outbuilding'
  | 'land'
  | 'unknown-property'
  | 'off-market'
  | 'unknown-price'
  | 'unknown-area'

export const TYPE_LABELS: Record<PropertyType, string> = {
  house: 'Maison',
  apartment: 'Appartement',
  houses: 'Plusieurs maisons',
  apartments: 'Plusieurs appartements',
  dwellings: 'Plusieurs logements',
  mixed: 'Logement et local professionnel',
  commercial: 'Local professionnel',
  outbuilding: 'Dépendance',
  land: 'Terrain',
  unknown: 'Bien non décrit',
}

/** Exclusion reason in plain words, following « Exclue de la médiane : ». */
export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  'bulk-sale': 'vente groupée de plusieurs logements',
  'commercial-premises': 'comprend un local professionnel',
  outbuilding: 'dépendance seule',
  land: 'terrain',
  'unknown-property': 'bien non décrit',
  'off-market': 'échange ou expropriation, prix hors marché',
  'unknown-price': 'prix non publié',
  'unknown-area': 'surface bâtie non publiée',
}

/** A sale as a source describes it, once normalized. */
export interface Mutation {
  id: string
  /** YYYY-MM-DD. */
  date: string
  /** Nature of the mutation according to the DGFiP, e.g. « Vente », « Vente en l'état futur d'achèvement ». */
  nature: string
  type: PropertyType
  /** In euros. */
  price: number | null
  /** In m². */
  builtArea: number | null
  /** In m². */
  landArea: number | null
  /** Point of the sold property closest to the parcel. */
  position: LonLat
}

/** A neighborhood sale, located and classified. */
export interface Sale extends Mutation {
  /** Distance to the parcel center, in metres. */
  distance: number
  /** Price relative to the built area, in €/m², when both are known. */
  pricePerSqm: number | null
  /** `null` for a simple sale, which counts towards the median price. */
  exclusion: ExclusionReason | null
}

/** Median price per m² of a dwelling type, always paired with the count of sales kept. */
export interface MedianPrice {
  /** `null` when the sales kept are too few to be significant. */
  pricePerSqm: number | null
  salesCount: number
}

export type Medians = Record<DwellingType, MedianPrice>

// An exchange or an expropriation has a declared value, not a price negotiated on the market.
const OFF_MARKET = /^(é|e)change|^expropriation/i

const EXCLUSION_BY_TYPE: Record<Exclude<PropertyType, DwellingType>, ExclusionReason> = {
  houses: 'bulk-sale',
  apartments: 'bulk-sale',
  dwellings: 'bulk-sale',
  mixed: 'commercial-premises',
  commercial: 'commercial-premises',
  outbuilding: 'outbuilding',
  land: 'land',
  unknown: 'unknown-property',
}

function exclusionOf(mutation: Mutation): ExclusionReason | null {
  if (OFF_MARKET.test(mutation.nature)) return 'off-market'
  if (mutation.type !== 'house' && mutation.type !== 'apartment') return EXCLUSION_BY_TYPE[mutation.type]
  if (!mutation.price) return 'unknown-price'
  if (!mutation.builtArea) return 'unknown-area'
  return null
}

/**
 * Sales within the circle of `radius` metres around `center`, since January 1st of `since`,
 * from most recent to oldest.
 */
export function neighborhoodSales(mutations: Mutation[], center: LonLat, radius: number, since: number): Sale[] {
  return mutations
    .map((mutation) => ({
      ...mutation,
      distance: distanceBetween(center, mutation.position),
      pricePerSqm: mutation.price && mutation.builtArea ? mutation.price / mutation.builtArea : null,
      exclusion: exclusionOf(mutation),
    }))
    .filter((sale) => sale.distance <= radius && sale.date >= `${since}-01-01`)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Median price per m² of houses and apartments, over simple sales only. */
export function mediansOf(sales: Sale[]): Medians {
  const medianOf = (type: DwellingType): MedianPrice => {
    const prices = sales.flatMap(({ type: saleType, exclusion, pricePerSqm }) =>
      saleType === type && exclusion === null && pricePerSqm !== null ? [pricePerSqm] : [],
    )
    return { pricePerSqm: prices.length < MEDIAN_THRESHOLD ? null : median(prices), salesCount: prices.length }
  }
  return { house: medianOf('house'), apartment: medianOf('apartment') }
}

function median(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
