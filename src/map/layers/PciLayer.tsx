import type { MapGeoJSONFeature } from 'maplibre-gl'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useLayerClick } from '@/map/use-layer-click'
import { useMapLayer } from '@/map/use-map-layer'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PARCELS_HIT_LAYER, PCI_PARCEL_LAYER, PCI_SOURCE_ID, PCI_SOURCES } from './pci-source'

/** Outlines of the cadastral parcels; a click selects the parcel read from the tile. */
export function PciLayer() {
  const { line } = OVERLAY_COLORS[useColorScheme()]
  const select = useSelectionStore((state) => state.select)

  useMapLayer({
    sources: PCI_SOURCES,
    layers: [
      // Invisible fill: it makes the whole inside of the parcel clickable, not only its outline.
      {
        id: PARCELS_HIT_LAYER,
        type: 'fill',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCEL_LAYER,
        paint: { 'fill-opacity': 0 },
      },
      {
        id: 'parcels-outline',
        type: 'line',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCEL_LAYER,
        paint: {
          'line-color': line,
          'line-opacity': 0.7,
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.4, 19, 1.2],
        },
      },
    ],
  })

  useLayerClick(PARCELS_HIT_LAYER,(feature: MapGeoJSONFeature) => {
    const { idu } = feature.properties
    if (typeof idu === 'string') select(idu)
  })

  return null
}
