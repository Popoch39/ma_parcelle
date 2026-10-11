import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { RiskElement } from '@/api/georisques'
import { Button } from '@/components/ui/button'
import { useIsPrinting } from '@/stores/ui-store'

// A history of natural disasters sometimes counts more than fifty decrees.
const VISIBLE = 5

/**
 * What a risk is based on (sites, cavities, decrees…), each with its page when it exists.
 * List collapsed to the first ones, expanded when printing.
 */
export function RiskElementList({ elements }: { elements: RiskElement[] }) {
  const [expanded, setExpanded] = useState(false)
  const printing = useIsPrinting()
  const visible = expanded || printing ? elements : elements.slice(0, VISIBLE)
  return (
    <div className="flex flex-col items-start gap-1">
      <ul className="flex flex-col gap-0.5 self-stretch border-l-2 border-border pl-2 text-xs">
        {visible.map((element) => (
          <li key={element.id}>
            {element.link ? (
              <a
                href={element.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {element.label}
                <ExternalLink aria-hidden className="size-3 shrink-0" />
                <span className="sr-only">(fiche sur Géorisques, nouvel onglet)</span>
              </a>
            ) : (
              element.label
            )}
            {element.note && <span className="text-muted-foreground"> · {element.note}</span>}
          </li>
        ))}
      </ul>
      {elements.length > VISIBLE && !printing && (
        <Button variant="ghost" size="xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Replier' : `Afficher tout (${elements.length})`}
        </Button>
      )}
    </div>
  )
}
