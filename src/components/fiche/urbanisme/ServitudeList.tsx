import type { Servitude } from '@/api/gpu'
import { ServitudeItem } from './ServitudeItem'

interface ServitudeListProps {
  servitudes: Servitude[]
  /** Servitude sous le pointeur (son `id`), ou null quand il les quitte. */
  onSurvol: (id: string | null) => void
}

/** Servitudes d'utilité publique qui touchent la parcelle. */
export function ServitudeList({ servitudes, onSurvol }: ServitudeListProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">Servitudes d’utilité publique</h3>
      {servitudes.length === 0 ? (
        <p className="text-muted-foreground">Aucune servitude ne touche la parcelle.</p>
      ) : (
        <ul className="flex flex-col">
          {servitudes.map((servitude) => (
            <ServitudeItem
              key={servitude.id}
              servitude={servitude}
              onSurvol={(survolee) => onSurvol(survolee ? servitude.id : null)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
