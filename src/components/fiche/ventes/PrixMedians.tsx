import type { VentesBloc } from '@/api/ventes'
import { PrixMedianStat } from './PrixMedianStat'

type PrixMediansProps = Pick<VentesBloc, 'medianes' | 'rayon' | 'depuis'>

/** Prix médians au m² du voisinage, appartements et maisons, et ce qu'ils mesurent. */
export function PrixMedians({ medianes, rayon, depuis }: PrixMediansProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">Prix médian au m² bâti</h3>
      <div className="grid grid-cols-2 gap-2">
        <PrixMedianStat type="appartement" median={medianes.appartement} />
        <PrixMedianStat type="maison" median={medianes.maison} />
      </div>
      <p className="text-xs text-muted-foreground">
        Ventes d’un seul logement, dépendances comprises, à moins de {rayon} m de la parcelle depuis {depuis} : un
        repère du voisinage, pas une estimation de la parcelle.
      </p>
    </div>
  )
}
