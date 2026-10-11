import { ExternalLink } from 'lucide-react'

interface SourceLinkProps {
  href: string
  /** Name of the official source, e.g. « Plan cadastral (DGFiP, IGN) ». */
  label: string
  /** Date or vintage of the data, when the source gives it. */
  date?: string
}

/** Link to the official source of a block, opened in a new tab. */
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
      {/* On paper, the link cannot be followed: the URL is written out in full. */}
      <span className="hidden break-all print:inline"> · {href}</span>
      <ExternalLink aria-hidden className="size-3 print:hidden" />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}
