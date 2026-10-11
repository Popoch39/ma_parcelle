import type { MultiPolygon, Polygon } from 'geojson'

/** Rectangle englobant [ouest, sud, est, nord], en degrés WGS 84 (ordre GeoJSON et MapLibre). */
export type Emprise = [number, number, number, number]

/** Rectangle englobant d'un polygone ou d'un multipolygone. */
export function empriseOf(geometrie: Polygon | MultiPolygon): Emprise {
  const anneaux = geometrie.type === 'Polygon' ? geometrie.coordinates : geometrie.coordinates.flat()
  const emprise: Emprise = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [lon, lat] of anneaux.flat()) {
    emprise[0] = Math.min(emprise[0], lon)
    emprise[1] = Math.min(emprise[1], lat)
    emprise[2] = Math.max(emprise[2], lon)
    emprise[3] = Math.max(emprise[3], lat)
  }
  return emprise
}
