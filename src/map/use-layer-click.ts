import type { MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

// MapLibre prévient chaque couche cliquée, même recouverte : un clic sur une vente tomberait
// aussi sur la parcelle en dessous. Seule la plus haute des couches cliquables le reçoit.
const couchesCliquables = new Set<string>()

/**
 * Appelle `onClick` avec l'objet cliqué sur une couche, lu dans les tuiles déjà affichées
 * (aucun appel réseau), et montre un curseur de lien au survol. Le clic ne lui parvient que si
 * aucune autre couche cliquable n'est au-dessus. L'écoute survit aux changements de fond :
 * MapLibre la rattache à l'identifiant de la couche.
 */
export function useLayerClick(layerId: string, onClick: (feature: MapGeoJSONFeature) => void): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const click = (event: MapLayerMouseEvent) => {
      const posees = [...couchesCliquables].filter((id) => map.getLayer(id))
      const dessus = map.queryRenderedFeatures(event.point, { layers: posees })[0]
      if (dessus?.layer.id === layerId) onClick(dessus)
    }
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const leave = () => {
      map.getCanvas().style.cursor = ''
    }
    couchesCliquables.add(layerId)
    map.on('click', layerId, click)
    map.on('mouseenter', layerId, enter)
    map.on('mouseleave', layerId, leave)
    return () => {
      couchesCliquables.delete(layerId)
      map.off('click', layerId, click)
      map.off('mouseenter', layerId, enter)
      map.off('mouseleave', layerId, leave)
    }
  }, [map, layerId, onClick])
}
