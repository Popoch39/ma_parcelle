import type { LonLat } from '@/lib/geo'
import type { Mutation } from '@/lib/sales'
import type { Fetch } from '../fetch-json'
import type { LoadOptions } from '../loader'

export type SalesSourceId = 'cerema' | 'datagouv'

/** The neighborhood whose sales we look for. */
export interface Neighborhood {
  center: LonLat
  /** In meters. */
  radius: number
  /** First year kept. */
  since: number
}

/**
 * A source of DVF sales. It returns the normalized mutations around the neighborhood, with no
 * guarantee of staying within the circle: the loader applies it afterwards, for every source.
 */
export interface SalesSource {
  id: SalesSourceId
  load: (fetch: Fetch, neighborhood: Neighborhood, options?: LoadOptions) => Promise<Mutation[]>
}
