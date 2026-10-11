import type { SalesBlock } from '@/api/sales'
import { MedianPriceStat } from './MedianPriceStat'

type MedianPricesProps = Pick<SalesBlock, 'medians' | 'radius' | 'since'>

/** Median prices per sqm of the neighborhood, apartments and houses, and what they measure. */
export function MedianPrices({ medians, radius, since }: MedianPricesProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">Prix médian au m² bâti</h3>
      <div className="grid grid-cols-2 gap-2">
        <MedianPriceStat type="apartment" median={medians.apartment} />
        <MedianPriceStat type="house" median={medians.house} />
      </div>
      <p className="text-xs text-muted-foreground">
        Ventes d’un seul logement, dépendances comprises, à moins de {radius} m de la parcelle depuis {since} : un
        repère du voisinage, pas une estimation de la parcelle.
      </p>
    </div>
  )
}
