import type { MapGeoJSONFeature } from 'maplibre-gl'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useLayerClick } from '@/map/use-layer-click'
import { useMapLayer } from '@/map/use-map-layer'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PARCELLES_HIT_LAYER, PCI_PARCELLE, PCI_SOURCE_ID, PCI_SOURCES } from './pci-source'

/** Contours des parcelles cadastrales ; un clic sélectionne la parcelle lue dans la tuile. */
export function PciLayer() {
  const { line } = OVERLAY_COLORS[useColorScheme()]
  const select = useSelectionStore((state) => state.select)

  useMapLayer({
    sources: PCI_SOURCES,
    layers: [
      // Remplissage invisible : il rend tout l'intérieur de la parcelle cliquable, pas seulement son contour.
      {
        id: PARCELLES_HIT_LAYER,
        type: 'fill',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCELLE,
        paint: { 'fill-opacity': 0 },
      },
      {
        id: 'parcelles-contour',
        type: 'line',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCELLE,
        paint: {
          'line-color': line,
          'line-opacity': 0.7,
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.4, 19, 1.2],
        },
      },
    ],
  })

  useLayerClick(PARCELLES_HIT_LAYER,(feature: MapGeoJSONFeature) => {
    const { idu } = feature.properties
    if (typeof idu === 'string') select(idu)
  })

  return null
}
