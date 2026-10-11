import type { Zone } from '@/api/gpu'
import { Fact } from '@/components/common/Fact'
import { RulesLink } from './RulesLink'

const percentage = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

interface ZonePluCardProps {
  zone: Zone
  /** True when the parcel straddles several zones. */
  showShare: boolean
}

/** A zone of the planning document (or a municipal map sector) that covers the parcel. */
export function ZonePluCard({ zone, showShare }: ZonePluCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <header>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold">
            {zone.code}
            {zone.family && <span className="font-normal"> · {zone.family}</span>}
          </h3>
          {showShare && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {percentage.format(zone.share)} de la parcelle
            </span>
          )}
        </div>
        {zone.label && <p className="text-sm text-muted-foreground">{zone.label}</p>}
      </header>
      <dl className="text-sm">
        <Fact label="Code">{zone.code}</Fact>
        <Fact label="Type">{zone.type}</Fact>
      </dl>
      {zone.rules && <RulesLink href={zone.rules} />}
    </article>
  )
}
