import type { DpeBloc } from '@/api/ademe'
import { COULEURS_ETIQUETTE } from './etiquettes'
import { EtiquetteBadge } from './EtiquetteBadge'

/** Répartition des DPE par étiquette énergie, de A à G : une barre par étiquette, son nombre écrit à côté. */
export function EtiquetteDistribution({ repartition }: { repartition: DpeBloc['repartition'] }) {
  const max = Math.max(1, ...repartition.map(({ nombre }) => nombre))
  return (
    <ul aria-label="Répartition par étiquette énergie" className="flex flex-col gap-1">
      {repartition.map(({ etiquette, nombre }) => (
        <li key={etiquette} className="flex items-center gap-2 text-sm">
          <EtiquetteBadge etiquette={etiquette} type="energie" />
          <div aria-hidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(nombre / max) * 100}%`, backgroundColor: COULEURS_ETIQUETTE.energie[etiquette].fond }}
            />
          </div>
          <span className="w-8 text-right font-medium tabular-nums">
            {nombre}
            <span className="sr-only"> DPE</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
