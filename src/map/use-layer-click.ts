import type { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

// MapLibre notifies every clicked layer, even covered ones: a click on a sale would
// also land on the parcel below. Only the topmost clickable layer receives it.
const clickableLayers = new Set<string>()

/**
 * Calls `onClick` with the feature clicked on a layer, read from the tiles already displayed
 * (no network call), and shows a link cursor on hover. The click only reaches it if
 * no other clickable layer is above. The listener survives basemap changes:
 * MapLibre attaches it to the layer id.
 */
export function useLayerClick(layerId: string, onClick: (feature: MapGeoJSONFeature) => void): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const click = (event: MapLayerMouseEvent) => {
      const added = [...clickableLayers].filter((id) => map.getLayer(id))
      const top = map.queryRenderedFeatures(event.point, { layers: added })[0]
      if (top?.layer.id === layerId) onClick(top)
    }
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const leave = () => {
      map.getCanvas().style.cursor = ''
    }
    clickableLayers.add(layerId)
    map.on('click', layerId, click)
    map.on('mouseenter', layerId, enter)
    map.on('mouseleave', layerId, leave)
    return () => {
      clickableLayers.delete(layerId)
      map.off('click', layerId, click)
      map.off('mouseenter', layerId, enter)
      map.off('mouseleave', layerId, leave)
    }
  }, [map, layerId, onClick])
}
