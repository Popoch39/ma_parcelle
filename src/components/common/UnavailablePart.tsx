import { ExternalLink } from 'lucide-react'

interface UnavailablePartProps {
  /** Service that did not respond, e.g. « le Géoportail de l’urbanisme ». */
  service: string
  /** Where to look up the information at the source. */
  href: string
}

/** Part of a block whose service did not respond, the rest of the block staying displayed. */
export function UnavailablePart({ service, href }: UnavailablePartProps) {
  return (
    <p className="text-muted-foreground">
      Indisponible : {service} n’a pas répondu.{' '}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-sm underline underline-offset-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Consulter la source
        <ExternalLink aria-hidden className="size-3 print:hidden" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </p>
  )
}
