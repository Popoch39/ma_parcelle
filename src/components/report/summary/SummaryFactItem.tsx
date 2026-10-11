import { AlertBadge } from '@/components/common/AlertBadge'
import type { SummaryFact } from '@/lib/summary/summary'

/** A fact of the summary, to place inside a `<dl>`: what it is about, what is known of it, its level. */
export function SummaryFactItem({ fact }: { fact: SummaryFact }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
      <dd className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium">{fact.value}</span>
        <AlertBadge level={fact.level} />
      </dd>
      {fact.detail && <dd className="text-xs text-muted-foreground">{fact.detail}</dd>}
    </div>
  )
}
