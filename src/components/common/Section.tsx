import { useId, type ReactNode } from 'react'

interface SectionProps {
  title: string
  /** Lien vers la source officielle, affiché quel que soit l'état du bloc (`SourceLink`). */
  source: ReactNode
  children: ReactNode
}

/** Cadre commun d'un bloc de la fiche : titre, contenu, source. */
export function Section({ title, source, children }: SectionProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="rounded-xl border bg-card p-4 text-card-foreground">
      <h2 id={titleId} className="mb-3 text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {children}
      <footer className="mt-4 border-t pt-3 text-xs text-muted-foreground">{source}</footer>
    </section>
  )
}
