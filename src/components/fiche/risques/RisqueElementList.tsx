import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { ElementRisque } from '@/api/georisques'
import { Button } from '@/components/ui/button'
import { useImpressionEnCours } from '@/stores/ui-store'

// Un historique de catastrophes naturelles compte parfois plus de cinquante arrêtés.
const VISIBLES = 5

/**
 * Ce qui fonde un risque (sites, cavités, arrêtés…), chacun avec sa fiche quand elle existe.
 * Liste repliée aux premiers, dépliée à l'impression.
 */
export function RisqueElementList({ elements }: { elements: ElementRisque[] }) {
  const [deplie, setDeplie] = useState(false)
  const impression = useImpressionEnCours()
  const visibles = deplie || impression ? elements : elements.slice(0, VISIBLES)
  return (
    <div className="flex flex-col items-start gap-1">
      <ul className="flex flex-col gap-0.5 self-stretch border-l-2 border-border pl-2 text-xs">
        {visibles.map((element) => (
          <li key={element.id}>
            {element.lien ? (
              <a
                href={element.lien}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {element.libelle}
                <ExternalLink aria-hidden className="size-3 shrink-0" />
                <span className="sr-only">(fiche sur Géorisques, nouvel onglet)</span>
              </a>
            ) : (
              element.libelle
            )}
            {element.precision && <span className="text-muted-foreground"> · {element.precision}</span>}
          </li>
        ))}
      </ul>
      {elements.length > VISIBLES && !impression && (
        <Button variant="ghost" size="xs" onClick={() => setDeplie(!deplie)}>
          {deplie ? 'Replier' : `Afficher tout (${elements.length})`}
        </Button>
      )}
    </div>
  )
}
