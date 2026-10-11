import { SEUIL_MEDIANE, type PrixMedian, type TypeLogement } from '@/lib/ventes'

const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

const TITRES: Record<TypeLogement, string> = { appartement: 'Appartements', maison: 'Maisons' }

interface PrixMedianStatProps {
  type: TypeLogement
  median: PrixMedian
}

/** Prix médian au m² d'un type de logement, avec le nombre de ventes simples qui le fondent. */
export function PrixMedianStat({ type, median: { prixM2, ventes } }: PrixMedianStatProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/40 p-3">
      <span className="text-xs text-muted-foreground">{TITRES[type]}</span>
      {prixM2 === null ? (
        <span className="text-sm font-medium text-muted-foreground">Non significatif</span>
      ) : (
        <span className="text-lg font-semibold tabular-nums">{euros.format(prixM2)} €/m²</span>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        {ventes === 0 ? 'Aucune vente retenue' : ventes === 1 ? '1 vente retenue' : `${ventes} ventes retenues`}
        {prixM2 === null && ventes > 0 && ` (moins de ${SEUIL_MEDIANE})`}
      </span>
    </div>
  )
}
