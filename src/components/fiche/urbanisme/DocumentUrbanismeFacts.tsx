import { ExternalLink } from 'lucide-react'
import type { DocumentUrbanisme } from '@/api/gpu'
import { Fact } from '@/components/common/Fact'

/** Document d'urbanisme applicable, avec un lien vers sa fiche sur le Géoportail de l'urbanisme. */
export function DocumentUrbanismeFacts({ document }: { document: DocumentUrbanisme }) {
  return (
    <dl className="text-sm">
      <Fact label="Document d’urbanisme">
        <a
          href={document.lien}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {document.libelleType}
          <ExternalLink aria-hidden className="size-3 shrink-0" />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </Fact>
      <Fact label="Territoire">{document.nom}</Fact>
    </dl>
  )
}
