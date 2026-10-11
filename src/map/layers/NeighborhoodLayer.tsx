import type { Feature, Polygon } from 'geojson'
import { circleAround } from '@/lib/geo'
import { useMapLayer } from '@/map/use-map-layer'
import { useSales } from '@/queries/sales'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PARCELS_HIT_LAYER } from './pci-source'
import { PRICE_COLORS } from './sales-style'

const SOURCE_ID = 'neighborhood'

/** Circle of the sales neighborhood around the selected parcel, in the hue of their points. */
export function NeighborhoodLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <NeighborhoodOverlay idu={idu} /> : null
}

function NeighborhoodOverlay({ idu }: { idu: string }) {
  const color = PRICE_COLORS[useColorScheme()][2]
  const { data } = useSales(idu)
  const circle: Feature<Polygon> | null = data
    ? { type: 'Feature', geometry: circleAround(data.center, data.radius, 96), properties: {} }
    : null

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: { type: 'FeatureCollection', features: circle ? [circle] : [] } } },
    below: PARCELS_HIT_LAYER,
    layers: [
      {
        id: 'neighborhood-outline',
        type: 'line',
        source: SOURCE_ID,
        paint: { 'line-color': color, 'line-width': 1.5, 'line-dasharray': [4, 3] },
      },
    ],
  })

  return null
}
