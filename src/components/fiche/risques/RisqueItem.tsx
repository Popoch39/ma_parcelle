import { ExternalLink } from 'lucide-react'
import type { Risque } from '@/api/georisques'
import { AlertBadge } from '@/components/common/AlertBadge'
import { RisqueElementList } from './RisqueElementList'

const LIEN =
  'inline-flex items-center gap-1 self-start rounded-sm text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Un risque : ce qu'il est, ce qu'en disent les données, son niveau d'alerte et sa page sur Géorisques. */
export function RisqueItem({ risque }: { risque: Risque }) {
  return (
    <li className="flex flex-col gap-1 border-b border-border/60 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span>{risque.libelle}</span>
          {risque.disponible ? (
            <span className="font-medium">{risque.valeur}</span>
          ) : (
            <span className="text-muted-foreground">Indisponible : Géorisques n’a pas répondu.</span>
          )}
        </div>
        {risque.disponible && <AlertBadge niveau={risque.niveau} />}
      </div>
      {risque.disponible && risque.detail && <p className="text-xs text-muted-foreground">{risque.detail}</p>}
      {risque.disponible && risque.elements.length > 0 && <RisqueElementList elements={risque.elements} />}
      <a href={risque.lien} target="_blank" rel="noreferrer" className={LIEN}>
        Comprendre ce risque sur Géorisques
        <ExternalLink aria-hidden className="size-3" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </li>
  )
}
