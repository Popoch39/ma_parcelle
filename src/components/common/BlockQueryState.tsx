import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SectionError } from './SectionError'
import { SectionSkeleton } from './SectionSkeleton'

interface BlockQueryStateProps<Data> {
  query: UseQueryResult<Data>
  /** Skeleton rows, roughly those of the loaded content, so that the block does not jump. */
  rows: number
  /** Content of the block once its data is loaded. */
  children: (data: Data) => ReactNode
}

/** States of a report block: skeleton while loading, failure with « Réessayer », then its content. */
export function BlockQueryState<Data>({ query, rows, children }: BlockQueryStateProps<Data>) {
  if (query.isPending) return <SectionSkeleton rows={rows} />
  if (query.isError) return <SectionError error={query.error} onRetry={() => query.refetch()} />
  return children(query.data)
}
