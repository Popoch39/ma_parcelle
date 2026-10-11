import { EXCLUSION_LABELS, TYPE_LABELS, type Sale } from '@/lib/sales'

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const day = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

/** "2023-03-23" → "23 mars 2023", without going through UTC, which would shift the day west of Greenwich. */
function dateOf(date: string): string {
  const [year, month, dayOfMonth] = date.split('-').map(Number)
  return day.format(new Date(year, month - 1, dayOfMonth))
}

function areasOf({ builtArea, landArea }: Sale): string | null {
  const areas = [
    builtArea && `${integer.format(builtArea)} m² bâtis`,
    landArea && `${integer.format(landArea)} m² de terrain`,
  ].filter(Boolean)
  return areas.length > 0 ? areas.join(' · ') : null
}

/** Detail of a sale: date, property, price, areas, price per sqm, and why it is excluded from the median. */
export function SaleDetails({ sale }: { sale: Sale }) {
  const areas = areasOf(sale)
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span>
          <span className="tabular-nums">{dateOf(sale.date)}</span> · {TYPE_LABELS[sale.type]}
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          {sale.price === null ? 'Prix non publié' : euros.format(sale.price)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{areas ?? 'Surfaces non publiées'}</span>
        {sale.pricePerSqm !== null && <span className="shrink-0 tabular-nums">{integer.format(sale.pricePerSqm)} €/m²</span>}
      </div>
      {sale.exclusion && (
        <span className="text-xs italic">Exclue de la médiane : {EXCLUSION_LABELS[sale.exclusion]}</span>
      )}
    </>
  )
}
