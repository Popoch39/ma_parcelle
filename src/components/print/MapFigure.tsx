import type { PrintedMap } from '@/stores/ui-store'

/** The map captured for printing, with the credits of its sources. */
export function MapFigure({ map }: { map: PrintedMap | null }) {
  return (
    <figure className="flex flex-col gap-1">
      {map ? (
        <img src={map.image} alt="Carte autour de la parcelle, surlignée" className="w-full rounded-lg border" />
      ) : (
        <p className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">Carte indisponible pour cette impression.</p>
      )}
      {map && (
        <figcaption className="text-xs text-muted-foreground">
          Parcelle surlignée{map.attribution && ` · Carte : ${map.attribution}`}
        </figcaption>
      )}
    </figure>
  )
}
