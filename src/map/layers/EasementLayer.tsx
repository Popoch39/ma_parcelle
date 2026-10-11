import type { FeatureCollection } from 'geojson'
import type { EasementGeometry } from '@/api/gpu'
import { useMapLayer } from '@/map/use-map-layer'
import { usePlanning } from '@/queries/planning'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme, type ColorScheme } from '@/stores/ui-store'
import { PARCELS_HIT_LAYER } from './pci-source'
import { fillAndOutline } from './surface-layers'

const SOURCE_ID = 'easement'

// Distinct from the purple of the zone and the blue of the selection, which it often covers.
const EASEMENT_COLOR: Record<ColorScheme, string> = {
  light: '#d97706',
  dark: '#fbbf24',
}

/** Geometry of the easement hovered in the report of the selected parcel. */
export function EasementLayer() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.hoveredEasement)
  return idu && id ? <EasementOverlay idu={idu} id={id} /> : null
}

function EasementOverlay({ idu, id }: { idu: string; id: string }) {
  const color = EASEMENT_COLOR[useColorScheme()]
  const { data } = usePlanning(idu)
  const easement = data?.easements?.find((candidate) => candidate.id === id)
  const collection: FeatureCollection<EasementGeometry> = {
    type: 'FeatureCollection',
    features: easement ? [{ type: 'Feature', geometry: easement.geometry, properties: {} }] : [],
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    below: PARCELS_HIT_LAYER,
    layers: [
      // The outline also draws a linear easement, such as a road alignment.
      ...fillAndOutline({ id: 'easement', source: SOURCE_ID, color, fillOpacity: 0.12, outline: { 'line-width': 2 } }),
      {
        id: 'easement-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
        paint: { 'circle-color': color, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
      },
    ],
  })

  return null
}
