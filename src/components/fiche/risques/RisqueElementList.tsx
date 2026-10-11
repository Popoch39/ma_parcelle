import { ExternalLink } from 'lucide-react'
import type { ElementRisque } from '@/api/georisques'

/** Ce qui fonde un risque (sites, cavités, arrêtés…), chacun avec sa fiche quand elle existe. */
export function RisqueElementList({ elements }: { elements: ElementRisque[] }) {
  return (
    <ul className="flex flex-col gap-0.5 border-l-2 border-border pl-2 text-xs">
      {elements.map((element) => (
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
  )
}
