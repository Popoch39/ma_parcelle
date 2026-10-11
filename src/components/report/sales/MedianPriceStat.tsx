import { MEDIAN_THRESHOLD, type DwellingType, type MedianPrice } from '@/lib/sales'

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

const TITLES: Record<DwellingType, string> = { apartment: 'Appartements', house: 'Maisons' }

interface MedianPriceStatProps {
  type: DwellingType
  median: MedianPrice
}

/** Median price per sqm of a dwelling type, with the count of simple sales it is based on. */
export function MedianPriceStat({ type, median: { pricePerSqm, salesCount } }: MedianPriceStatProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/40 p-3">
      <span className="text-xs text-muted-foreground">{TITLES[type]}</span>
      {pricePerSqm === null ? (
        <span className="text-sm font-medium text-muted-foreground">Non significatif</span>
      ) : (
        <span className="text-lg font-semibold tabular-nums">{euros.format(pricePerSqm)} €/m²</span>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        {salesCount === 0 ? 'Aucune vente retenue' : salesCount === 1 ? '1 vente retenue' : `${salesCount} ventes retenues`}
        {pricePerSqm === null && salesCount > 0 && ` (moins de ${MEDIAN_THRESHOLD})`}
      </span>
    </div>
  )
}
