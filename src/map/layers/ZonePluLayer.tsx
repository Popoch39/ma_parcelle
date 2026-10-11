import type { FeatureCollection, MultiPolygon } from 'geojson'
import { useMapLayer } from '@/map/use-map-layer'
import { useUrbanisme } from '@/queries/urbanisme'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme, type ColorScheme } from '@/stores/ui-store'
import { PARCELLES_HIT_LAYER } from './pci-source'
import { aplatEtContour } from './surface-layers'

const SOURCE_ID = 'zone-plu'

// Distincte du bleu de la sélection, pour que la parcelle reste lisible par-dessus sa zone.
const COULEUR_ZONE: Record<ColorScheme, string> = {
  light: '#9333ea',
  dark: '#c084fc',
}

/** Contour et aplat léger de la zone d'urbanisme (ou du secteur) où se trouve la parcelle sélectionnée. */
export function ZonePluLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <ZonePluOverlay idu={idu} /> : null
}

function ZonePluOverlay({ idu }: { idu: string }) {
  const couleur = COULEUR_ZONE[useColorScheme()]
  const { data } = useUrbanisme(idu)
  const zones = data?.reglementation.regime === 'document' ? data.reglementation.zones : []
  const collection: FeatureCollection<MultiPolygon> = {
    type: 'FeatureCollection',
    features: zones.map(({ geometrie, code }) => ({ type: 'Feature', geometry: geometrie, properties: { code } })),
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    // Reposé à chaque sélection : sans cela, il passerait au-dessus de la parcelle.
    below: PARCELLES_HIT_LAYER,
    layers: aplatEtContour({
      id: 'zone-plu',
      source: SOURCE_ID,
      couleur,
      opaciteAplat: 0.08,
      contour: { 'line-width': 1.5, 'line-dasharray': [3, 2] },
    }),
  })

  return null
}
