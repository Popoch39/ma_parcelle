import { useQueries, useQueryClient } from '@tanstack/react-query'
import { CONTRIBUTIONS } from '@/lib/summary/contributions'
import { assembleSummary } from '@/lib/summary/summary'
import { parcelBlockQuery } from './block'

/**
 * Summary of the report. It follows the blocks' queries (same keys as their sections, so
 * no extra call) and is rebuilt each time a block loads, fails or is retried.
 */
export function useSummary(idu: string) {
  const queryClient = useQueryClient()
  return useQueries({
    queries: CONTRIBUTIONS.map((contribution) => ({
      ...parcelBlockQuery(queryClient, contribution.block, idu, contribution.load),
      // A contribution that throws only fails the summary's observer: the block disappears
      // from the summary, its section knows nothing about it.
      select: (data: unknown) => contribution.facts(data),
    })),
    combine: assembleSummary,
  })
}
