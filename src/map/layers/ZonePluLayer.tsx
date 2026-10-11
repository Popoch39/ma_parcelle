import type { FeatureCollection, MultiPolygon } from 'geojson'
import { useMapLayer } from '@/map/use-map-layer'
import { usePlanning } from '@/queries/planning'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme, type ColorScheme } from '@/stores/ui-store'
import { PARCELS_HIT_LAYER } from './pci-source'
import { fillAndOutline } from './surface-layers'

const SOURCE_ID = 'zone-plu'

// Distinct from the blue of the selection, so that the parcel stays readable over its zone.
const ZONE_COLOR: Record<ColorScheme, string> = {
  light: '#9333ea',
  dark: '#c084fc',
}

/** Outline and light fill of the planning zone (or sector) where the selected parcel lies. */
export function ZonePluLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <ZonePluOverlay idu={idu} /> : null
}

function ZonePluOverlay({ idu }: { idu: string }) {
  const color = ZONE_COLOR[useColorScheme()]
  const { data } = usePlanning(idu)
  const zones = data?.regulation.regime === 'document' ? data.regulation.zones : []
  const collection: FeatureCollection<MultiPolygon> = {
    type: 'FeatureCollection',
    features: zones.map(({ geometry, code }) => ({ type: 'Feature', geometry, properties: { code } })),
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    // Re-added on each selection: otherwise, it would go above the parcel.
    below: PARCELS_HIT_LAYER,
    layers: fillAndOutline({
      id: 'zone-plu',
      source: SOURCE_ID,
      color,
      fillOpacity: 0.08,
      outline: { 'line-width': 1.5, 'line-dasharray': [3, 2] },
    }),
  })

  return null
}
