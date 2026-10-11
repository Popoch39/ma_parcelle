import type { FeatureCollection, Point } from 'geojson'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useMapLayer } from '@/map/use-map-layer'
import { useSales } from '@/queries/sales'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { HOVER_RADIUS } from './sales-style'

// Its own source: sharing the points' one would keep it on the map with the sales of
// the previous parcel, since `useMapLayer` only re-adds a source if it has disappeared.
const SOURCE_ID = 'hovered-sale'

/** Ring around the sale hovered or browsed with the keyboard, in the list as on the map. */
export function HoveredSaleLayer() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.hoveredSale)
  return idu && id ? <HoveredSaleOverlay idu={idu} id={id} /> : null
}

function HoveredSaleOverlay({ idu, id }: { idu: string; id: string }) {
  const { primary } = OVERLAY_COLORS[useColorScheme()]
  const sale = useSales(idu).data?.sales.find((candidate) => candidate.id === id)
  const collection: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: sale
      ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: [sale.position.lon, sale.position.lat] }, properties: {} }]
      : [],
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    layers: [
      {
        id: 'hovered-sale',
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': HOVER_RADIUS,
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': primary,
        },
      },
    ],
  })

  return null
}
