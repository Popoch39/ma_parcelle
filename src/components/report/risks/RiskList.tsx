import type { Risk, RiskScope } from '@/api/georisques'
import { RiskItem } from './RiskItem'

const SCOPES: ReadonlyArray<{ scope: RiskScope; title: string }> = [
  { scope: 'location', title: 'À l’emplacement de la parcelle et autour' },
  { scope: 'municipality', title: 'Dans la commune' },
]

/** Risks of the block, those of the parcel's location then those of its municipality. */
export function RiskList({ risks }: { risks: Risk[] }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      {SCOPES.map(({ scope, title }) => {
        const group = risks.filter((risk) => risk.scope === scope)
        if (group.length === 0) return null
        return (
          <div key={scope} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
            <ul className="flex flex-col">
              {group.map((risk) => (
                <RiskItem key={risk.id} risk={risk} />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
