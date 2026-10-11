import { echellePrixM2, type ClassePrixM2 } from '@/lib/echelle-prix-m2'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { ANNEAU, COULEURS_PRIX } from '@/map/layers/ventes-style'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'

/** Légende des points de vente, tant que le calque des ventes est affiché pour une parcelle. */
export function VentesLegend() {
  const idu = useSelectionStore((state) => state.idu)
  const affiche = useMapStore((state) => state.calquesActifs.includes('ventes'))
  return idu && affiche ? <VentesLegendOverlay idu={idu} /> : null
}

function VentesLegendOverlay({ idu }: { idu: string }) {
  const ventes = useVentes(idu).data?.ventes ?? []
  if (ventes.length === 0) return null
  const echelle = echellePrixM2(ventes)
  return (
    <LegendePrixM2
      classes={echelle?.classes ?? []}
      exclues={ventes.some(({ exclusion }) => exclusion !== null)}
    />
  )
}

function LegendePrixM2({ classes, exclues }: { classes: ClassePrixM2[]; exclues: boolean }) {
  const scheme = useColorScheme()
  return (
    <section aria-label="Légende des ventes" className="flex flex-col gap-1 px-2 py-1.5 text-xs">
      <p className="font-medium">Ventes, prix au m² bâti</p>
      <ul className="flex flex-col gap-0.5">
        {classes.map(({ rang, libelle }) => (
          <li key={rang} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border-[1.5px]"
              style={{ backgroundColor: COULEURS_PRIX[scheme][rang], borderColor: ANNEAU[scheme] }}
            />
            <span className="tabular-nums">{libelle}</span>
          </li>
        ))}
        {exclues && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border-2"
              style={{ borderColor: OVERLAY_COLORS[scheme].line }}
            />
            Exclue de la médiane
          </li>
        )}
      </ul>
    </section>
  )
}
