import { useState } from 'react'
import type { Dpe, DpeBloc } from '@/api/ademe'
import { Button } from '@/components/ui/button'
import { useImpressionEnCours } from '@/stores/ui-store'
import { DpeRow } from './DpeRow'

// Assez pour voir d'un coup d'œil, sans noyer la fiche quand un immeuble en compte des centaines.
const VISIBLES = 10

interface DpeListProps {
  dpe: Dpe[]
  /** Ceux de la parcelle viennent du plus récent au plus ancien, ceux du voisinage du plus proche au plus lointain. */
  portee: DpeBloc['portee']
}

/** Liste des DPE, repliée aux premiers, dépliée à l'impression. */
export function DpeList({ dpe, portee }: DpeListProps) {
  const [deplie, setDeplie] = useState(false)
  const impression = useImpressionEnCours()
  const visibles = deplie || impression ? dpe : dpe.slice(0, VISIBLES)
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <h3 className="text-xs font-medium text-muted-foreground">
        Étiquettes énergie et climat,{' '}
        {portee === 'parcelle' ? 'du plus récent au plus ancien' : 'du plus proche au plus lointain'}
      </h3>
      <ul className="flex flex-col">
        {visibles.map((un) => (
          <DpeRow key={un.numero} dpe={un} />
        ))}
      </ul>
      {dpe.length > VISIBLES && !impression && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setDeplie(!deplie)}>
          {deplie ? 'Replier la liste' : `Afficher les ${dpe.length - VISIBLES} autres`}
        </Button>
      )}
    </div>
  )
}
