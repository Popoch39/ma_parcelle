/** Loading state of a block: a few pulsing rows in place of the facts. */
export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" className="flex flex-col gap-2.5">
      <span className="sr-only">Chargement…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex justify-between gap-6">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
