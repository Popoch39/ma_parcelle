import type { MultiPolygon, Polygon } from 'geojson'

/** Rectangle englobant [ouest, sud, est, nord], en degrés WGS 84 (ordre GeoJSON et MapLibre). */
export type Emprise = [number, number, number, number]

/** Point WGS 84, en degrés. */
export interface LonLat {
  lon: number
  lat: number
}

const METRES_PAR_DEGRE = 111_320

/**
 * Distance en mètres d'un point au bord le plus proche d'un polygone. Approximation plane,
 * juste à l'échelle d'une rue ou d'un quartier.
 */
export function distanceToBoundary(point: LonLat, geometrie: Polygon | MultiPolygon): number {
  const kx = METRES_PAR_DEGRE * Math.cos((point.lat * Math.PI) / 180)
  const toMetres = ([lon, lat]: number[]) => [(lon - point.lon) * kx, (lat - point.lat) * METRES_PAR_DEGRE]
  const anneaux = geometrie.type === 'Polygon' ? geometrie.coordinates : geometrie.coordinates.flat()
  let distance = Infinity
  for (const anneau of anneaux) {
    for (let i = 0; i + 1 < anneau.length; i++) {
      distance = Math.min(distance, distanceToSegment(toMetres(anneau[i]), toMetres(anneau[i + 1])))
    }
  }
  return distance
}

/** Distance de l'origine au segment [a, b]. */
function distanceToSegment([ax, ay]: number[], [bx, by]: number[]): number {
  const dx = bx - ax
  const dy = by - ay
  const longueur2 = dx * dx + dy * dy
  const t = longueur2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / longueur2))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

/** Carré de `demiCote` mètres de part et d'autre d'un point, anneau fermé depuis le coin sud-ouest. */
export function squareAround(point: LonLat, demiCote: number): Polygon {
  const dLat = demiCote / METRES_PAR_DEGRE
  const dLon = dLat / Math.cos((point.lat * Math.PI) / 180)
  const [ouest, sud, est, nord] = [point.lon - dLon, point.lat - dLat, point.lon + dLon, point.lat + dLat]
  return {
    type: 'Polygon',
    coordinates: [[[ouest, sud], [est, sud], [est, nord], [ouest, nord], [ouest, sud]]],
  }
}

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
