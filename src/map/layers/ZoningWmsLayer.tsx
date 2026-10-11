import type { LayerSpecification } from 'maplibre-gl'
import { useMapLayer } from '@/map/use-map-layer'
import { PARCELS_HIT_LAYER } from './pci-source'
import { ZONING_SOURCE_ID, ZONING_SOURCES } from './zoning-source'

const LAYERS: LayerSpecification[] = [
  {
    id: 'zoning',
    type: 'raster',
    source: ZONING_SOURCE_ID,
    // The server renders empty images below that: no point requesting them.
    minzoom: 12,
    // The zones are opaque fills: the basemap must show through.
    paint: { 'raster-opacity': 0.5 },
  },
]

/** Planning zoning of the whole visible area, below the parcels and the selection. */
export function ZoningWmsLayer() {
  useMapLayer({ sources: ZONING_SOURCES, layers: LAYERS, below: PARCELS_HIT_LAYER })
  return null
}
