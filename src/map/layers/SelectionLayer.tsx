import type { FilterSpecification } from 'maplibre-gl'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useMapLayer } from '@/map/use-map-layer'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PCI_PARCEL_LAYER, PCI_SOURCE_ID, PCI_SOURCES } from './pci-source'

/**
 * Highlights the selected parcel by filtering the already loaded PCI tiles: instant on
 * click, without waiting for the cadastre.
 */
export function SelectionLayer() {
  const { primary } = OVERLAY_COLORS[useColorScheme()]
  const idu = useSelectionStore((state) => state.idu) ?? ''
  const filter: FilterSpecification = ['==', ['get', 'idu'], idu]

  useMapLayer({
    sources: PCI_SOURCES,
    layers: [
      {
        id: 'selection-fill',
        type: 'fill',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCEL_LAYER,
        filter,
        paint: { 'fill-color': primary, 'fill-opacity': 0.18 },
      },
      {
        id: 'selection-outline',
        type: 'line',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCEL_LAYER,
        filter,
        layout: { 'line-join': 'round' },
        paint: { 'line-color': primary, 'line-width': 3 },
      },
    ],
  })

  return null
}
