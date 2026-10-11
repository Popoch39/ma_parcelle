import type { Servitude } from '@/api/gpu'

interface ServitudeItemProps {
  servitude: Servitude
  /** Appelé à l'entrée (true) et à la sortie (false) du pointeur. */
  onSurvol: (survolee: boolean) => void
}

/** Une servitude d'utilité publique : sa catégorie en clair, son code officiel et ce qu'elle protège. */
export function ServitudeItem({ servitude, onSurvol }: ServitudeItemProps) {
  return (
    <li
      onMouseEnter={() => onSurvol(true)}
      onMouseLeave={() => onSurvol(false)}
      className="-mx-1.5 flex flex-col rounded-md border-b border-border/60 px-1.5 py-1.5 last:border-b-0 hover:bg-accent"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span>{servitude.categorie}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{servitude.code}</span>
      </div>
      {servitude.nom && <span className="text-muted-foreground">{servitude.nom}</span>}
    </li>
  )
}
