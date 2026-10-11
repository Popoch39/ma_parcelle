import { cn } from 'cn'
import type { Vente } from '@/lib/ventes'
import { VenteDetails } from './VenteDetails'

interface VenteRowProps {
  vente: Vente
  /** Vente mise en évidence sur la carte, au survol de son point ou de sa ligne. */
  survolee: boolean
  /** Appelé à l'entrée (true) et à la sortie (false) du pointeur ou du focus clavier. */
  onSurvol: (survolee: boolean) => void
  /** Montre la vente sur la carte. */
  onOuvrir: () => void
}

/** Une vente du voisinage, qui se montre sur la carte au survol, au focus et au clic. */
export function VenteRow({ vente, survolee, onSurvol, onOuvrir }: VenteRowProps) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onMouseEnter={() => onSurvol(true)}
        onMouseLeave={() => onSurvol(false)}
        onFocus={() => onSurvol(true)}
        onBlur={() => onSurvol(false)}
        onClick={onOuvrir}
        className={cn(
          '-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
          survolee && 'bg-accent',
          vente.exclusion && 'text-muted-foreground',
        )}
      >
        <VenteDetails vente={vente} />
        <span className="sr-only">, voir sur la carte</span>
      </button>
    </li>
  )
}
