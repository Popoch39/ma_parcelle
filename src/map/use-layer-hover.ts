import type { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

/**
 * Appelle `onHover` avec l'objet sous le pointeur sur une couche, à chaque objet survolé, puis
 * avec `null` quand le pointeur quitte la couche.
 */
export function useLayerHover(layerId: string, onHover: (feature: MapGeoJSONFeature | null) => void): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    // `mousemove` plutôt que `mouseenter` : passer d'un objet à son voisin ne quitte pas la couche.
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
