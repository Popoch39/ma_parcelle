import { ExternalLink } from 'lucide-react'
import type { PlanningDocument } from '@/api/gpu'
import { Fact } from '@/components/common/Fact'

/** Applicable planning document, with a link to its page on the Géoportail de l'urbanisme. */
export function PlanningDocumentFacts({ document }: { document: PlanningDocument }) {
  return (
    <dl className="text-sm">
      <Fact label="Document d’urbanisme">
        <a
          href={document.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {document.typeLabel}
          <ExternalLink aria-hidden className="size-3 shrink-0" />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </Fact>
      <Fact label="Territoire">{document.name}</Fact>
    </dl>
  )
}
