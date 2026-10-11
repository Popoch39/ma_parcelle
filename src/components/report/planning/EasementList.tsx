import type { Easement } from '@/api/gpu'
import { UnavailablePart } from '@/components/common/UnavailablePart'
import { EasementItem } from './EasementItem'
import { PLANNING_GEOPORTAL } from './source'

interface EasementListProps {
  /** null if their service did not respond. */
  easements: Easement[] | null
  /** Easement whose geometry the map shows (its `id`). */
  hovered: string | null
  /** Easement under the pointer, the focus or the finger (its `id`), or null when they leave it. */
  onHover: (id: string | null) => void
}

/** Public utility easements that touch the parcel. */
export function EasementList({ easements, hovered, onHover }: EasementListProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">Servitudes d’utilité publique</h3>
      {easements === null ? (
        <UnavailablePart service="le Géoportail de l’urbanisme" href={PLANNING_GEOPORTAL} />
      ) : easements.length === 0 ? (
        <p className="text-muted-foreground">Aucune servitude ne touche la parcelle.</p>
      ) : (
        <ul className="flex flex-col">
          {easements.map((easement) => (
            <EasementItem
              key={easement.id}
              easement={easement}
              hovered={easement.id === hovered}
              onHover={(hovered) => onHover(hovered ? easement.id : null)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
