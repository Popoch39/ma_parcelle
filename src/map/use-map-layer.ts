import type { LayerSpecification, Map as MapLibreMap, SourceSpecification } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

/** Ce qu'un composant de calque pose sur la carte. */
export interface MapLayer {
  /**
   * Sources dont le calque a besoin. Une source partagée (ex. les tuiles PCI) est déclarée par
   * chaque calque qui l'utilise : le premier monté l'ajoute, le dernier démonté la retire.
   */
  sources: Record<string, SourceSpecification>
  /** Couches empilées dans cet ordre, au-dessus de celles déjà posées. */
  layers: LayerSpecification[]
  /**
   * Pose les couches sous toutes les autres plutôt qu'au-dessus : pour un fond posé comme un
   * calque (la photo aérienne), qui peut être monté après les surcouches.
   */
  beneath?: boolean
}

/**
 * Pose un calque sur la carte du store tant que le composant est monté, et le repose après
 * chaque changement de fond. Un changement de `sources` ou `layers` (ex. un autre filtre)
 * retire puis repose le calque.
 */
export function useMapLayer({ sources, layers, beneath = false }: MapLayer): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const apply = () => {
      for (const [id, source] of Object.entries(sources)) {
        if (!map.getSource(id)) map.addSource(id, source)
      }
      const beforeId = beneath ? map.getLayersOrder()[0] : undefined
      for (const layer of layers) {
        if (!map.getLayer(layer.id)) map.addLayer(layer, beforeId)
      }
    }
    if (isStyleReady(map)) apply()
    // Un nouveau fond remplace tout le style et efface nos sources et couches au passage.
    map.on('style.load', apply)

    return () => {
      map.off('style.load', apply)
      const style = map.getStyle()
      // Carte détruite, ou nouveau fond en cours de chargement : il n'y a rien à retirer.
      if (!style) return
      const ownIds = new Set(layers.map((layer) => layer.id))
      for (const id of ownIds) if (map.getLayer(id)) map.removeLayer(id)
      const otherSources = new Set(
        style.layers.flatMap((layer) => (!ownIds.has(layer.id) && 'source' in layer ? [layer.source] : [])),
      )
      for (const id of Object.keys(sources)) {
        if (!otherSources.has(id) && map.getSource(id)) map.removeSource(id)
      }
    }
  }, [map, sources, layers, beneath])
}

// L'API de style lève tant qu'un fond se charge et après `map.remove()` ; `getStyle()` est le
// seul moyen public de le savoir sans lever.
function isStyleReady(map: MapLibreMap): boolean {
  return map.getStyle() !== undefined
}
