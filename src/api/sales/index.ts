import { centroidOf, type LonLat } from '@/lib/geo'
import {
  SALES_YEARS,
  mediansOf,
  NEIGHBORHOOD_RADIUS,
  neighborhoodSales,
  type Medians,
  type Mutation,
  type Sale,
} from '@/lib/sales'
import type { Fetch } from '../fetch-json'
import type { BlockLoader, LoadOptions } from '../loader'
import { cerema } from './cerema'
import { datagouv } from './datagouv'
import type { SalesSourceId, SalesSource, Neighborhood } from './source'

/** Model of the Sales block. */
export interface SalesBlock {
  /** The source that answered: the main one, or the fallback. */
  source: SalesSourceId
  /** Center of the neighborhood circle: the parcel centroid. */
  center: LonLat
  /** Neighborhood radius, in meters. */
  radius: number
  /** First year kept. */
  since: number
  /** The neighborhood sales, from the most recent to the oldest, excluded ones included. */
  sales: Sale[]
  medians: Medians
}

/** Sources in the order they are tried: the next one is only used if the previous one fails. */
const SOURCES: readonly SalesSource[] = [cerema, datagouv]

/** Loader of the Sales block: the DVF sales of the parcel's neighborhood and their median price per m². */
export const loadSales: BlockLoader<SalesBlock> = async (fetch, parcel, { signal } = {}) => {
  const neighborhood: Neighborhood = {
    center: centroidOf(parcel.geometry),
    radius: NEIGHBORHOOD_RADIUS,
    since: new Date().getFullYear() - SALES_YEARS,
  }
  const { source, mutations } = await loadMutations(fetch, neighborhood, { signal })
  const sales = neighborhoodSales(mutations, neighborhood.center, neighborhood.radius, neighborhood.since)
  return { source, ...neighborhood, sales, medians: mediansOf(sales) }
}

async function loadMutations(
  fetch: Fetch,
  neighborhood: Neighborhood,
  { signal }: LoadOptions,
): Promise<{ source: SalesSourceId; mutations: Mutation[] }> {
  let firstError: unknown
  for (const source of SOURCES) {
    try {
      return { source: source.id, mutations: await source.load(fetch, neighborhood, { signal }) }
    } catch (error) {
      if (signal?.aborted) throw error
      firstError ??= error
    }
  }
  // The outage of the main source explains the failure better than that of the fallback.
  throw firstError
}
