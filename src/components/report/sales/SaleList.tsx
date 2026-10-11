import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Sale } from '@/lib/sales'
import { useIsPrinting } from '@/stores/ui-store'
import { SaleRow } from './SaleRow'

// A dense neighborhood counts more than a thousand sales over five years: they are unrolled in batches.
const PER_BATCH = 20

interface SaleListProps {
  sales: Sale[]
  /** Highlighted sale (its `id`), from the list or from the map. */
  hovered: string | null
  /** Sale under the pointer or the focus (its `id`), or null when they leave it. */
  onHover: (id: string | null) => void
  /** Shows a sale on the map. */
  onOpen: (sale: Sale) => void
}

/** All the sales of the neighborhood, from the most recent to the oldest, excluded ones included, all of them when printing. */
export function SaleList({ sales, hovered, onHover, onOpen }: SaleListProps) {
  const [unrolled, setUnrolled] = useState(PER_BATCH)
  const shown = useIsPrinting() ? sales.length : unrolled
  const remaining = sales.length - shown
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">
        {sales.length === 1 ? '1 vente dans le voisinage' : `${sales.length} ventes dans le voisinage`}
      </h3>
      {sales.length === 0 ? (
        <p className="text-muted-foreground">Aucune vente publiée dans le voisinage sur la période.</p>
      ) : (
        <ul className="flex flex-col">
          {sales.slice(0, shown).map((sale) => (
            <SaleRow
              key={sale.id}
              sale={sale}
              hovered={sale.id === hovered}
              onHover={(hover) => onHover(hover ? sale.id : null)}
              onOpen={() => onOpen(sale)}
            />
          ))}
        </ul>
      )}
      {remaining > 0 && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setUnrolled(unrolled + PER_BATCH)}>
          Afficher {Math.min(remaining, PER_BATCH)} ventes de plus
        </Button>
      )}
    </div>
  )
}
