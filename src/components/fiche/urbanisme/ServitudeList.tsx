import type { Servitude } from '@/api/gpu'
import { PartieIndisponible } from '@/components/common/PartieIndisponible'
import { ServitudeItem } from './ServitudeItem'
import { GEOPORTAIL_URBANISME } from './source'

interface ServitudeListProps {
  /** null si leur service n'a pas répondu. */
  servitudes: Servitude[] | null
  /** Servitude dont la carte montre l'emprise (son `id`). */
  survolee: string | null
  /** Servitude sous le pointeur, le focus ou le doigt (son `id`), ou null quand ils la quittent. */
  onSurvol: (id: string | null) => void
}

/** Servitudes d'utilité publique qui touchent la parcelle. */
export function ServitudeList({ servitudes, survolee, onSurvol }: ServitudeListProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">Servitudes d’utilité publique</h3>
      {servitudes === null ? (
        <PartieIndisponible service="le Géoportail de l’urbanisme" href={GEOPORTAIL_URBANISME} />
      ) : servitudes.length === 0 ? (
        <p className="text-muted-foreground">Aucune servitude ne touche la parcelle.</p>
      ) : (
        <ul className="flex flex-col">
          {servitudes.map((servitude) => (
            <ServitudeItem
              key={servitude.id}
              servitude={servitude}
              survolee={servitude.id === survolee}
              onSurvol={(survolee) => onSurvol(survolee ? servitude.id : null)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
