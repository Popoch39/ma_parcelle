import type { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

/**
 * Calls `onHover` with the feature under the pointer on a layer, for each hovered feature, then
 * with `null` when the pointer leaves the layer.
 */
export function useLayerHover(layerId: string, onHover: (feature: MapGeoJSONFeature | null) => void): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    // `mousemove` rather than `mouseenter`: moving from a feature to its neighbor does not leave the layer.
    const move = (event: MapLayerMouseEvent) => onHover(event.features?.[0] ?? null)
    const leave = () => onHover(null)
    map.on('mousemove', layerId, move)
    map.on('mouseleave', layerId, leave)
    return () => {
      map.off('mousemove', layerId, move)
      map.off('mouseleave', layerId, leave)
    }
  }, [map, layerId, onHover])
}
