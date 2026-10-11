import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef } from 'react'
import { useMapStore } from '@/stores/map-store'
import { useColorScheme } from '@/stores/ui-store'
import { basemapStyle } from './basemaps'

// MapLibre looks for its worker next to its own module: once bundled by Vite (chunk in
// build, pre-bundle in dev), that file is no longer there. So Vite emits it itself.
setWorkerUrl(workerUrl)

// All of metropolitan France on open, when the URL designates no parcel.
const FRANCE = { center: [2.5, 46.6] as [number, number], zoom: 5 }

/** Creates the full-screen map, puts it in the map store and applies the active basemap. */
export function MapView() {
  const container = useRef<HTMLDivElement>(null)
  const map = useMapStore((state) => state.map)
  const setMap = useMapStore((state) => state.setMap)
  const style = basemapStyle(useMapStore((state) => state.basemap), useColorScheme())
  const appliedStyle = useRef(style)

  useEffect(() => {
    if (!container.current) return
    const instance = new MapLibreMap({
      container: container.current,
      style: appliedStyle.current,
      ...FRANCE,
      attributionControl: { compact: true },
    })
    // Layers cannot add anything before the first style is loaded.
    instance.once('load', () => setMap(instance))
    return () => {
      setMap(null)
      instance.remove()
    }
  }, [setMap])

  useEffect(() => {
    if (!map || appliedStyle.current === style) return
    appliedStyle.current = style
    map.setStyle(style)
  }, [map, style])

  return <div ref={container} className="fixed inset-0" />
}
