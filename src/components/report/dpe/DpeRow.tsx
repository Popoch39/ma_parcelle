import type { Dpe } from '@/api/ademe'
import { GradeBadge } from './GradeBadge'

// "YYYY-MM-DD" is read as midnight UTC: formatting in UTC keeps the right day whatever the time zone.
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' })
const meters = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const area = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

/** A DPE: its energy and climate grades, the living area of the dwelling, its date and its address. */
export function DpeRow({ dpe }: { dpe: Dpe }) {
  return (
    <li className="flex items-center gap-3 border-b border-border/60 py-1.5 last:border-b-0">
      <div className="flex gap-1">
        <GradeBadge grade={dpe.energyGrade} type="energy" />
        <GradeBadge grade={dpe.climateGrade} type="climate" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium tabular-nums">
            {dpe.livingArea === null ? 'Surface non renseignée' : `${area.format(dpe.livingArea)} m²`}
          </span>
          <time dateTime={dpe.date} className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {date.format(new Date(dpe.date))}
          </time>
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {dpe.distance !== null && <span className="tabular-nums">À {meters.format(dpe.distance)} m · </span>}
          {dpe.address ?? 'Adresse non renseignée'}
        </span>
      </div>
    </li>
  )
}
