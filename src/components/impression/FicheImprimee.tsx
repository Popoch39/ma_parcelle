import { useEffect } from 'react'
import { Fiche } from '@/components/fiche/Fiche'
import { useParcelle } from '@/queries/parcelle'
import { useSelectionStore } from '@/stores/selection-store'
import { urlDeLaFiche } from '@/stores/selection-url'
import { useUiStore, type Impression } from '@/stores/ui-store'
import { CarteFigure } from './CarteFigure'

const dateHeure = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

/**
 * Document imprimé à la place de l'écran pendant une impression : la fiche de la parcelle
 * sélectionnée, précédée de la carte. La feuille d'impression masque tout le reste.
 */
export function FicheImprimee() {
  const impression = useUiStore((state) => state.impression)
  const idu = useSelectionStore((state) => state.idu)
  if (!impression || !idu) return null
  return <DocumentImprime idu={idu} impression={impression} />
}

function DocumentImprime({ idu, impression }: { idu: string; impression: Impression }) {
  const parcelle = useParcelle(idu).data
  const url = urlDeLaFiche(idu)

  // Le titre de la page sert de nom de fichier au PDF.
  useEffect(() => {
    const titre = document.title
    document.title = `Fiche parcelle ${idu}`
    return () => {
      document.title = titre
    }
  }, [idu])

  return (
    // Jamais à l'écran : seule la feuille d'impression l'affiche.
    <article className="fiche-imprimee hidden flex-col gap-3 print:flex">
      <header className="flex flex-col gap-1 border-b pb-3">
        <p className="text-xs text-muted-foreground">Ma parcelle · fiche de parcelle</p>
        <h1 className="text-lg font-semibold">
          {parcelle ? `${parcelle.commune.nom}, parcelle ${parcelle.referenceCadastrale}` : `Parcelle ${idu}`}
        </h1>
        <p className="text-xs text-muted-foreground">
          IDU <span className="font-mono">{idu}</span> · Imprimée le {dateHeure.format(impression.date)}
        </p>
        <p className="text-xs break-all text-muted-foreground">Fiche en ligne : {url}</p>
      </header>
      <CarteFigure carte={impression.carte} />
      <Fiche idu={idu} />
    </article>
  )
}
