import { cn } from 'cn'
import type { Sale } from '@/lib/sales'
import { SaleDetails } from './SaleDetails'

interface SaleRowProps {
  sale: Sale
  /** Sale highlighted on the map, when its point or its row is hovered. */
  hovered: boolean
  /** Called on entry (true) and exit (false) of the pointer or the keyboard focus. */
  onHover: (hovered: boolean) => void
  /** Shows the sale on the map. */
  onOpen: () => void
}

/** A sale of the neighborhood, which shows on the map on hover, on focus and on click. */
export function SaleRow({ sale, hovered, onHover, onOpen }: SaleRowProps) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        onClick={onOpen}
        className={cn(
          '-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
          hovered && 'bg-accent',
          sale.exclusion && 'text-muted-foreground',
        )}
      >
        <SaleDetails sale={sale} />
        <span className="sr-only">, voir sur la carte</span>
      </button>
    </li>
  )
}
