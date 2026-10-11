import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SectionError } from './SectionError'
import { SectionSkeleton } from './SectionSkeleton'

interface BlocQueryStateProps<Data> {
  query: UseQueryResult<Data>
  /** Lignes du squelette, à peu près celles du contenu chargé, pour que le bloc ne saute pas. */
  rows: number
  /** Contenu du bloc une fois ses données chargées. */
  children: (data: Data) => ReactNode
}

/** États d'un bloc de la fiche : squelette pendant le chargement, échec avec « Réessayer », puis son contenu. */
export function BlocQueryState<Data>({ query, rows, children }: BlocQueryStateProps<Data>) {
  if (query.isPending) return <SectionSkeleton rows={rows} />
  if (query.isError) return <SectionError error={query.error} onRetry={() => query.refetch()} />
  return children(query.data)
}
