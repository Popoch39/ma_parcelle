import { ExternalLink } from 'lucide-react'
import type { Risk } from '@/api/georisques'
import { AlertBadge } from '@/components/common/AlertBadge'
import { RiskElementList } from './RiskElementList'

const LINK =
  'inline-flex items-center gap-1 self-start rounded-sm text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** A risk: what it is, what the data says about it, its alert level and its page on Géorisques. */
export function RiskItem({ risk }: { risk: Risk }) {
  return (
    <li className="flex flex-col gap-1 border-b border-border/60 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span>{risk.label}</span>
          {risk.available ? (
            <span className="font-medium">{risk.value}</span>
          ) : (
            <span className="text-muted-foreground">Indisponible : Géorisques n’a pas répondu.</span>
          )}
        </div>
        {risk.available && <AlertBadge level={risk.level} />}
      </div>
      {risk.available && risk.detail && <p className="text-xs text-muted-foreground">{risk.detail}</p>}
      {risk.available && risk.elements.length > 0 && <RiskElementList elements={risk.elements} />}
      <a href={risk.link} target="_blank" rel="noreferrer" className={LINK}>
        Comprendre ce risque sur Géorisques
        <ExternalLink aria-hidden className="size-3" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </li>
  )
}
