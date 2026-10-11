import type { LayerSpecification, Map as MapLibreMap, SourceSpecification } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMapStore } from '@/stores/map-store'

/** What an overlay component adds to the map. */
export interface MapLayer {
  /**
   * Sources the overlay needs. A shared source (e.g. the PCI tiles) is declared by
   * each overlay using it: the first mounted adds it, the last unmounted removes it.
   */
  sources: Record<string, SourceSpecification>
  /** Layers stacked in this order, above those already added. */
  layers: LayerSpecification[]
  /**
   * Adds the layers below all the others rather than above: for a basemap added as an
   * overlay (the aerial photo), which may be mounted after the overlays.
   */
  beneath?: boolean
  /**
   * Adds the layers below this layer when it is on the map: for an overlay mounted
   * on demand that must stay below the parcels and the selection.
   */
  below?: string
}

/** Layer before which `addLayer` must insert, or `undefined` to add above everything. */
export function insertionPoint(
  order: string[],
  { beneath, below }: Pick<MapLayer, 'beneath' | 'below'>,
): string | undefined {
  if (beneath) return order[0]
  // MapLibre rejects a missing reference layer: we then add above.
  if (below && order.includes(below)) return below
  return undefined
}

/**
 * Adds an overlay to the store map as long as the component is mounted, and re-adds it after
 * each basemap change. A change of `sources` or `layers` (e.g. another filter)
 * removes then re-adds the overlay.
 */
export function useMapLayer({ sources, layers, beneath = false, below }: MapLayer): void {
  const map = useMapStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const apply = () => {
      for (const [id, source] of Object.entries(sources)) {
        if (!map.getSource(id)) map.addSource(id, source)
      }
      const beforeId = insertionPoint(map.getLayersOrder(), { beneath, below })
      for (const layer of layers) {
        if (!map.getLayer(layer.id)) map.addLayer(layer, beforeId)
      }
    }
    if (isStyleReady(map)) apply()
    // A new basemap replaces the whole style and wipes our sources and layers along the way.
    map.on('style.load', apply)

    return () => {
      map.off('style.load', apply)
      const style = map.getStyle()
      // Map destroyed, or new basemap loading: there is nothing to remove.
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
  }, [map, sources, layers, beneath, below])
}

// The style API throws while a basemap is loading and after `map.remove()`; `getStyle()` is the
// only public way to know without throwing.
function isStyleReady(map: MapLibreMap): boolean {
  return map.getStyle() !== undefined
}
