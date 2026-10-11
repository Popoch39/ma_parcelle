import { AlertBadge } from '@/components/common/AlertBadge'
import type { FaitSynthese } from '@/lib/synthese/synthese'

/** Un fait de la synthèse, à placer dans un `<dl>` : ce dont on parle, ce qu'on en sait, son niveau. */
export function SyntheseFact({ fait }: { fait: FaitSynthese }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{fait.libelle}</dt>
      <dd className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium">{fait.valeur}</span>
        <AlertBadge niveau={fait.niveau} />
      </dd>
      {fait.detail && <dd className="text-xs text-muted-foreground">{fait.detail}</dd>}
    </div>
  )
}
