import { ExternalLink } from 'lucide-react'

interface PartieIndisponibleProps {
  /** Service qui n'a pas répondu, ex. « le Géoportail de l’urbanisme ». */
  service: string
  /** Où consulter l'information à la source. */
  href: string
}

/** Partie d'un bloc dont le service n'a pas répondu, le reste du bloc restant affiché. */
export function PartieIndisponible({ service, href }: PartieIndisponibleProps) {
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
