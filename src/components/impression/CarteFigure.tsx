import type { CarteImprimee } from '@/stores/ui-store'

/** La carte capturée pour l'impression, avec les mentions de ses sources. */
export function CarteFigure({ carte }: { carte: CarteImprimee | null }) {
  return (
    <figure className="flex flex-col gap-1">
      {carte ? (
        <img src={carte.image} alt="Carte centrée sur la parcelle, surlignée" className="w-full rounded-lg border" />
      ) : (
        <p className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">Carte indisponible pour cette impression.</p>
      )}
      {carte && (
        <figcaption className="text-xs text-muted-foreground">
          Parcelle surlignée{carte.attribution && ` · Carte : ${carte.attribution}`}
        </figcaption>
      )}
    </figure>
  )
}
