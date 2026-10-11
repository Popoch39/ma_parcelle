import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { BlockLoader } from '@/api/loader'
import type { BlockId } from '@/components/report/blocks'
import { parcelQuery } from './parcel'

/**
 * Query of a block that starts from the parcel (planning, risks, sales…), key `[block, idu]`.
 * The parcel comes from the Cadastre block's cache; if it fails, the block fails with the same
 * error, so each section only has one query to follow.
 */
export const parcelBlockQuery = <Model>(queryClient: QueryClient, block: BlockId, idu: string, load: BlockLoader<Model>) =>
  queryOptions({
    queryKey: [block, idu],
    queryFn: async ({ signal }) => load(fetch, await queryClient.fetchQuery(parcelQuery(idu)), { signal }),
  })

/**
 * Data of a block, for its section.
 *
 * ```ts
 * export const usePlanning = (idu: string) => useParcelBlock('planning', idu, loadPlanning)
 * ```
 */
export function useParcelBlock<Model>(block: BlockId, idu: string, load: BlockLoader<Model>) {
  const queryClient = useQueryClient()
  return useQuery(parcelBlockQuery(queryClient, block, idu, load))
}
