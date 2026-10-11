import type { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

/**
 * Appelle `onClick` avec l'objet cliqué sur une couche, lu dans les tuiles déjà affichées
 * (aucun appel réseau), et montre un curseur de lien au survol. L'écoute survit aux
 * changements de fond : MapLibre la rattache à l'identifiant de la couche.
 */
export function useLayerClick(layerId: string, onClick: (feature: MapGeoJSONFeature) => void): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const click = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (feature) onClick(feature)
    }
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const leave = () => {
      map.getCanvas().style.cursor = ''
    }
    map.on('click', layerId, click)
    map.on('mouseenter', layerId, enter)
    map.on('mouseleave', layerId, leave)
    return () => {
      map.off('click', layerId, click)
      map.off('mouseenter', layerId, enter)
      map.off('mouseleave', layerId, leave)
    }
  }, [map, layerId, onClick])
}
