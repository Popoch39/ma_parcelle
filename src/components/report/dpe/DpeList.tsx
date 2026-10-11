import { useState } from 'react'
import type { Dpe, DpeBlock } from '@/api/ademe'
import { Button } from '@/components/ui/button'
import { useIsPrinting } from '@/stores/ui-store'
import { DpeRow } from './DpeRow'

// Enough to see at a glance, without drowning the report when a building has hundreds of them.
const VISIBLE = 10

interface DpeListProps {
  dpes: Dpe[]
  /** Those of the parcel go from the most recent to the oldest, those of the neighborhood from the nearest to the farthest. */
  scope: DpeBlock['scope']
}

/** List of the DPEs, collapsed to the first ones, expanded when printing. */
export function DpeList({ dpes, scope }: DpeListProps) {
  const [expanded, setExpanded] = useState(false)
  const printing = useIsPrinting()
  const visible = expanded || printing ? dpes : dpes.slice(0, VISIBLE)
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">
        Étiquettes énergie et climat,{' '}
        {scope === 'parcel' ? 'du plus récent au plus ancien' : 'du plus proche au plus lointain'}
      </h3>
      <ul className="flex flex-col">
        {visible.map((dpe) => (
          <DpeRow key={dpe.number} dpe={dpe} />
        ))}
      </ul>
      {dpes.length > VISIBLE && !printing && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Replier la liste' : `Afficher les ${dpes.length - VISIBLE} autres`}
        </Button>
      )}
    </div>
  )
}
