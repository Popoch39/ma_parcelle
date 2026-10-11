import type { FilterSpecification } from 'maplibre-gl'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useMapLayer } from '@/map/use-map-layer'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PCI_PARCELLE, PCI_SOURCE_ID, PCI_SOURCES } from './pci-source'

/**
 * Surligne la parcelle sélectionnée en filtrant les tuiles PCI déjà chargées : instantané au
 * clic, sans attendre le cadastre.
 */
export function SelectionLayer() {
  const { primary } = OVERLAY_COLORS[useColorScheme()]
  const idu = useSelectionStore((state) => state.idu) ?? ''
  const filter: FilterSpecification = ['==', ['get', 'idu'], idu]

  useMapLayer({
    sources: PCI_SOURCES,
    layers: [
      {
        id: 'selection-aplat',
        type: 'fill',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCELLE,
        filter,
        paint: { 'fill-color': primary, 'fill-opacity': 0.18 },
      },
      {
        id: 'selection-contour',
        type: 'line',
        source: PCI_SOURCE_ID,
        'source-layer': PCI_PARCELLE,
        filter,
        layout: { 'line-join': 'round' },
        paint: { 'line-color': primary, 'line-width': 3 },
      },
    ],
  })

  return null
}
