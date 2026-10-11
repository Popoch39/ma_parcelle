import { pricePerSqmScale, type PricePerSqmClass } from '@/lib/price-per-sqm-scale'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { PRICE_COLORS, RING_COLOR } from '@/map/layers/sales-style'
import { useSales } from '@/queries/sales'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'

/** Legend of the sale points, as long as the sales overlay is shown for a parcel. */
export function SalesLegend() {
  const idu = useSelectionStore((state) => state.idu)
  const shown = useMapStore((state) => state.activeOverlays.includes('sales'))
  return idu && shown ? <SalesLegendOverlay idu={idu} /> : null
}

function SalesLegendOverlay({ idu }: { idu: string }) {
  const sales = useSales(idu).data?.sales ?? []
  if (sales.length === 0) return null
  const scale = pricePerSqmScale(sales)
  return (
    <PricePerSqmLegend
      classes={scale?.classes ?? []}
      excluded={sales.some(({ exclusion }) => exclusion !== null)}
    />
  )
}

function PricePerSqmLegend({ classes, excluded }: { classes: PricePerSqmClass[]; excluded: boolean }) {
  const scheme = useColorScheme()
  return (
    <section aria-label="Légende des ventes" className="flex flex-col gap-1 px-2 py-1.5 text-xs">
      <p className="font-medium">Ventes, prix au m² bâti</p>
      <ul className="flex flex-col gap-0.5">
        {classes.map(({ rank, label }) => (
          <li key={rank} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border-[1.5px]"
              style={{ backgroundColor: PRICE_COLORS[scheme][rank], borderColor: RING_COLOR[scheme] }}
            />
            <span className="tabular-nums">{label}</span>
          </li>
        ))}
        {excluded && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border-2"
              style={{ borderColor: OVERLAY_COLORS[scheme].line }}
            />
            Exclue de la médiane
          </li>
        )}
      </ul>
    </section>
  )
}
