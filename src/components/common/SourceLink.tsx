import { ExternalLink } from 'lucide-react'

interface SourceLinkProps {
  href: string
  /** Nom de la source officielle, ex. « Plan cadastral (DGFiP, IGN) ». */
  label: string
  /** Date ou millésime des données, quand la source le donne. */
  date?: string
}

/** Lien vers la source officielle d'un bloc, ouvert dans un nouvel onglet. */
export function SourceLink({ href, label, date }: SourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none print:inline"
    >
      Source : {label}
      {date && <span className="tabular-nums"> · {date}</span>}
      {/* Sur papier, le lien ne se suit pas : l'adresse s'écrit en clair. */}
      <span className="hidden break-all print:inline"> · {href}</span>
      <ExternalLink aria-hidden className="size-3 print:hidden" />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}
