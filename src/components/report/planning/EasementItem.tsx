import { cn } from 'cn'
import type { Easement } from '@/api/gpu'

interface EasementItemProps {
  easement: Easement
  /** Easement whose geometry the map shows. */
  hovered: boolean
  /** Called on entry (true) and exit (false) of the pointer or the keyboard focus, and on tap (true). */
  onHover: (hovered: boolean) => void
}

/**
 * A public utility easement: its category in plain words, its official code and what it
 * protects. Its geometry shows on the map on hover, on focus and on tap.
 */
export function EasementItem({ easement, hovered, onHover }: EasementItemProps) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        // With a finger, no hover: the tap shows the geometry, until the next tap elsewhere.
        onClick={() => onHover(true)}
        className={cn(
          '-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
          hovered && 'bg-accent',
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span>{easement.category}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{easement.code}</span>
        </span>
        {easement.name && <span className="text-muted-foreground">{easement.name}</span>}
        <span className="sr-only">, voir son emprise sur la carte</span>
      </button>
    </li>
  )
}
