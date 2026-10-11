import 'maplibre-gl/dist/maplibre-gl.css'
import { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useMapStore } from '@/stores/map-store'
import { useColorScheme } from '@/stores/ui-store'
import { BASEMAP_STYLES } from './basemaps'

// France métropolitaine entière à l'ouverture, quand l'URL ne désigne aucune parcelle.
const FRANCE = { center: [2.5, 46.6] as [number, number], zoom: 5 }

/** Crée la carte plein écran, la pose dans le store carte et lui applique le fond du thème. */
export function MapView() {
  const container = useRef<HTMLDivElement>(null)
  const map = useMapStore((state) => state.map)
  const setMap = useMapStore((state) => state.setMap)
  const style = BASEMAP_STYLES[useColorScheme()]
  const appliedStyle = useRef(style)

  useEffect(() => {
    if (!container.current) return
    const instance = new MapLibreMap({
      container: container.current,
      style: appliedStyle.current,
      ...FRANCE,
      attributionControl: { compact: true },
    })
    // Les calques ne peuvent rien poser avant que le premier style soit chargé.
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
