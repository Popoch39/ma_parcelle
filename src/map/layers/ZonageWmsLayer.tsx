import type { LayerSpecification } from 'maplibre-gl'
import { useMapLayer } from '@/map/use-map-layer'
import { PARCELLES_HIT_LAYER } from './pci-source'
import { ZONAGE_SOURCE_ID, ZONAGE_SOURCES } from './zonage-source'

const LAYERS: LayerSpecification[] = [
  {
    id: 'zonage',
    type: 'raster',
    source: ZONAGE_SOURCE_ID,
    // Le serveur rend des images vides en deçà : inutile de les demander.
    minzoom: 12,
    // Les zones sont des aplats opaques : il faut voir le fond à travers.
    paint: { 'raster-opacity': 0.5 },
  },
]

/** Zonage d'urbanisme de toute la zone visible, sous les parcelles et la sélection. */
export function ZonageWmsLayer() {
  useMapLayer({ sources: ZONAGE_SOURCES, layers: LAYERS, below: PARCELLES_HIT_LAYER })
  return null
}
