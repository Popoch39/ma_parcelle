import type { FeatureCollection, Point } from 'geojson'
import type { ExpressionSpecification, MapGeoJSONFeature } from 'maplibre-gl'
import { pricePerSqmScale } from '@/lib/price-per-sqm-scale'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useLayerClick } from '@/map/use-layer-click'
import { useLayerHover } from '@/map/use-layer-hover'
import { useMapLayer } from '@/map/use-map-layer'
import { useSales } from '@/queries/sales'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { POINT_RADIUS, PRICE_COLORS, RING_COLOR } from './sales-style'

const SOURCE_ID = 'sales'

/** Invisible layer, wider than the points: a finger or a pointer catches them without pixel-perfect aim. */
const SALES_CLICK_LAYER = 'sales-click'

/** Rank of a sale excluded from the median: it has no price hue. */
const EXCLUDED = -1

/**
 * Neighborhood sales of the selected parcel, as points colored by their price per sqm;
 * sales excluded from the median as empty circles. Hovering a point highlights its sale
 * in the list, clicking it opens its details.
 */
export function SalesLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <SalesOverlay idu={idu} /> : null
}

function SalesOverlay({ idu }: { idu: string }) {
  const scheme = useColorScheme()
  const hoverSale = useMapStore((state) => state.hoverSale)
  const openSale = useMapStore((state) => state.openSale)
  const sales = useSales(idu).data?.sales ?? []
  const scale = pricePerSqmScale(sales)
  const collection: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: sales.map(({ id, position, exclusion, pricePerSqm }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      properties: { id, rank: exclusion === null && pricePerSqm !== null && scale ? scale.rankOf(pricePerSqm) : EXCLUDED },
    })),
  }
  const excluded: ExpressionSpecification = ['==', ['get', 'rank'], EXCLUDED]
  const colors = PRICE_COLORS[scheme]

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    layers: [
      {
        id: 'sales-points',
        type: 'circle',
        source: SOURCE_ID,
        // Colored sales go above the empty circles of the excluded sales.
        layout: { 'circle-sort-key': ['get', 'rank'] },
        paint: {
          'circle-radius': POINT_RADIUS,
          'circle-color': ['match', ['get', 'rank'], 0, colors[0], 1, colors[1], 2, colors[2], colors[3]],
          'circle-opacity': ['case', excluded, 0, 1],
          'circle-stroke-width': ['case', excluded, 2, 1.5],
          'circle-stroke-color': ['case', excluded, OVERLAY_COLORS[scheme].line, RING_COLOR[scheme]],
        },
      },
      {
        id: SALES_CLICK_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        paint: { 'circle-radius': 12, 'circle-opacity': 0 },
      },
    ],
  })

  useLayerHover(SALES_CLICK_LAYER, (feature: MapGeoJSONFeature | null) => hoverSale(idOf(feature)))
  useLayerClick(SALES_CLICK_LAYER, (feature: MapGeoJSONFeature) => {
    const id = idOf(feature)
    if (id) openSale(id)
  })

  return null
}

function idOf(feature: MapGeoJSONFeature | null): string | null {
  const id: unknown = feature?.properties.id
  return typeof id === 'string' ? id : null
}
