import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

interface Surface {
  /** Layer prefix: `<id>-fill` and `<id>-outline`. */
  id: string
  /** GeoJSON source of the surfaces. */
  source: string
  color: string
  /** Fill opacity, low enough to keep the parcel and the basemap below readable. */
  fillOpacity: number
  /** Outline stroke: width, dashes… */
  outline: LineLayerSpecification['paint']
}

/** Layers of a surface highlighted on the map: a light fill and its outline, of the same color. */
export function fillAndOutline({
  id,
  source,
  color,
  fillOpacity,
  outline,
}: Surface): [FillLayerSpecification, LineLayerSpecification] {
  return [
    {
      id: `${id}-fill`,
      type: 'fill',
      source,
      paint: { 'fill-color': color, 'fill-opacity': fillOpacity },
    },
    {
      id: `${id}-outline`,
      type: 'line',
      source,
      layout: { 'line-join': 'round' },
      paint: { 'line-color': color, ...outline },
    },
  ]
}
