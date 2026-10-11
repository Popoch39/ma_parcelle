import { LIBELLES_EXCLUSION, LIBELLES_TYPE, type Vente } from '@/lib/ventes'

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const entier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const jour = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

/** « 2023-03-23 » → « 23 mars 2023 », sans passer par UTC qui décalerait le jour à l'ouest de Greenwich. */
function dateOf(date: string): string {
  const [annee, mois, quantieme] = date.split('-').map(Number)
  return jour.format(new Date(annee, mois - 1, quantieme))
}

function surfacesOf({ surfaceBatie, surfaceTerrain }: Vente): string | null {
  const surfaces = [
    surfaceBatie && `${entier.format(surfaceBatie)} m² bâtis`,
    surfaceTerrain && `${entier.format(surfaceTerrain)} m² de terrain`,
  ].filter(Boolean)
  return surfaces.length > 0 ? surfaces.join(' · ') : null
}

/** Détail d'une vente : date, bien, prix, surfaces, prix au m², et pourquoi elle est exclue de la médiane. */
export function VenteDetails({ vente }: { vente: Vente }) {
  const surfaces = surfacesOf(vente)
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span>
          <span className="tabular-nums">{dateOf(vente.date)}</span> · {LIBELLES_TYPE[vente.type]}
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          {vente.prix === null ? 'Prix non publié' : euros.format(vente.prix)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{surfaces ?? 'Surfaces non publiées'}</span>
        {vente.prixM2 !== null && <span className="shrink-0 tabular-nums">{entier.format(vente.prixM2)} €/m²</span>}
      </div>
      {vente.exclusion && (
        <span className="text-xs italic">Exclue de la médiane : {LIBELLES_EXCLUSION[vente.exclusion]}</span>
      )}
    </>
  )
}
