import { cn } from 'cn'
import type { Servitude } from '@/api/gpu'

interface ServitudeItemProps {
  servitude: Servitude
  /** Servitude dont la carte montre l'emprise. */
  survolee: boolean
  /** Appelé à l'entrée (true) et à la sortie (false) du pointeur ou du focus clavier, et au tap (true). */
  onSurvol: (survolee: boolean) => void
}

/**
 * Une servitude d'utilité publique : sa catégorie en clair, son code officiel et ce qu'elle
 * protège. Son emprise se montre sur la carte au survol, au focus et au tap.
 */
export function ServitudeItem({ servitude, survolee, onSurvol }: ServitudeItemProps) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onMouseEnter={() => onSurvol(true)}
        onMouseLeave={() => onSurvol(false)}
        onFocus={() => onSurvol(true)}
        onBlur={() => onSurvol(false)}
        // Au doigt, pas de survol : le tap montre l'emprise, jusqu'au tap suivant ailleurs.
        onClick={() => onSurvol(true)}
        className={cn(
          '-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
          survolee && 'bg-accent',
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span>{servitude.categorie}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{servitude.code}</span>
        </span>
        {servitude.nom && <span className="text-muted-foreground">{servitude.nom}</span>}
        <span className="sr-only">, voir son emprise sur la carte</span>
      </button>
    </li>
  )
}
