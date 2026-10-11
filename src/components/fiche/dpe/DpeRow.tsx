import type { Dpe } from '@/api/ademe'
import { EtiquetteBadge } from './EtiquetteBadge'

// « AAAA-MM-JJ » se lit à minuit UTC : formater en UTC garde le bon jour quel que soit le fuseau.
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' })
const metres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const surface = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

/** Un DPE : ses étiquettes énergie et climat, la surface du logement, sa date et son adresse. */
export function DpeRow({ dpe }: { dpe: Dpe }) {
  return (
    <li className="flex items-center gap-3 border-b border-border/60 py-1.5 last:border-b-0">
      <div className="flex gap-1">
        <EtiquetteBadge etiquette={dpe.etiquetteEnergie} type="energie" />
        <EtiquetteBadge etiquette={dpe.etiquetteClimat} type="climat" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium tabular-nums">
            {dpe.surface === null ? 'Surface non renseignée' : `${surface.format(dpe.surface)} m²`}
          </span>
          <time dateTime={dpe.date} className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {date.format(new Date(dpe.date))}
          </time>
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {dpe.distance !== null && <span className="tabular-nums">À {metres.format(dpe.distance)} m · </span>}
          {dpe.adresse ?? 'Adresse non renseignée'}
        </span>
      </div>
    </li>
  )
}
