import { lazy, Suspense } from 'react'
import { SectionSkeleton } from '@/components/common/SectionSkeleton'

// The blocks are only needed once a parcel is chosen: kept out of the map's initial load.
// A single `lazy` for the panel and for print: once loaded, the report prints without waiting.
const Report = lazy(() => import('./Report').then(({ Report }) => ({ default: Report })))

/** The report of a parcel, whose code loads on the first selection. */
export function LazyReport({ idu }: { idu: string }) {
  return (
    <Suspense fallback={<SectionSkeleton rows={8} />}>
      <Report idu={idu} />
    </Suspense>
  )
}
