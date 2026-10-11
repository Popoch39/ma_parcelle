import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { BlocId } from '@/components/fiche/blocs'
import { cn } from '@/lib/utils'
import { useBlocReplie, useUiStore } from '@/stores/ui-store'

interface SectionProps {
  title: string
  /** Bloc de la fiche, qui se replie et se déplie d'un clic sur son titre. La synthèse n'en est pas un. */
  bloc?: BlocId
  /**
   * Lien vers la source officielle, affiché quel que soit l'état du chargement (`SourceLink`).
   * Seule la synthèse, qui cite les blocs, n'en a pas.
   */
  source?: ReactNode
  children: ReactNode
}

/** Cadre commun d'un bloc de la fiche : titre (qui le replie), contenu, source. */
export function Section({ title, bloc, source, children }: SectionProps) {
  const titleId = useId()
  const contentId = useId()
  const replie = useBlocReplie(bloc)
  const basculerBloc = useUiStore((state) => state.basculerBloc)
  return (
    <section aria-labelledby={titleId} className="rounded-xl border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold tracking-tight">
        {bloc ? (
          <button
            type="button"
            id={titleId}
            aria-expanded={!replie}
            aria-controls={contentId}
            onClick={() => basculerBloc(bloc)}
            className="-m-1 flex w-[calc(100%+0.5rem)] items-center justify-between gap-2 rounded-md p-1 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {title}
            <ChevronDown
              aria-hidden
              className={cn('size-4 shrink-0 text-muted-foreground transition-transform print:hidden', replie && '-rotate-90')}
            />
          </button>
        ) : (
          <span id={titleId}>{title}</span>
        )}
      </h2>
      <div id={contentId} hidden={replie} className="mt-3">
        {children}
        {source && <footer className="mt-4 border-t pt-3 text-xs text-muted-foreground">{source}</footer>}
      </div>
    </section>
  )
}
