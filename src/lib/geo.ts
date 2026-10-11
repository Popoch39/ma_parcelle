import type { MultiPolygon, Polygon } from 'geojson'

/** Bounding box [west, south, east, north], in WGS 84 degrees (GeoJSON and MapLibre order). */
export type BBox = [number, number, number, number]

/** Outline of a surface: parcel, zone, easement footprint… */
export type Contour = Polygon | MultiPolygon

/** WGS 84 point, in degrees. */
export interface LonLat {
  lon: number
  lat: number
}

const METRES_PER_DEGREE = 111_320

/** Distance in metres between two points. Planar approximation, accurate at neighborhood scale. */
export function distanceBetween(a: LonLat, b: LonLat): number {
  const kx = METRES_PER_DEGREE * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot((b.lon - a.lon) * kx, (b.lat - a.lat) * METRES_PER_DEGREE)
}

/**
 * Distance in metres from a point to the nearest edge of a polygon. Planar approximation,
 * accurate at street or neighborhood scale.
 */
export function distanceToBoundary(point: LonLat, geometry: Contour): number {
  const kx = METRES_PER_DEGREE * Math.cos((point.lat * Math.PI) / 180)
  const toMetres = ([lon, lat]: number[]) => [(lon - point.lon) * kx, (lat - point.lat) * METRES_PER_DEGREE]
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  let distance = Infinity
  for (const ring of rings) {
    for (let i = 0; i + 1 < ring.length; i++) {
      distance = Math.min(distance, distanceToSegment(toMetres(ring[i]), toMetres(ring[i + 1])))
    }
  }
  return distance
}

/** Distance from the origin to the segment [a, b]. */
function distanceToSegment([ax, ay]: number[], [bx, by]: number[]): number {
  const dx = bx - ax
  const dy = by - ay
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

/** Square extending `halfSide` metres on each side of a point, ring closed from the south-west corner. */
export function squareAround(point: LonLat, halfSide: number): Polygon {
  const dLat = halfSide / METRES_PER_DEGREE
  const dLon = dLat / Math.cos((point.lat * Math.PI) / 180)
  const [west, south, east, north] = [point.lon - dLon, point.lat - dLat, point.lon + dLon, point.lat + dLat]
  return {
    type: 'Polygon',
    coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
  }
}

/** Circle of `radius` metres around a point, approximated by a polygon with `vertices` sides. */
export function circleAround(point: LonLat, radius: number, vertices = 32): Polygon {
  const dLat = radius / METRES_PER_DEGREE
  const dLon = dLat / Math.cos((point.lat * Math.PI) / 180)
  const ring = Array.from({ length: vertices }, (_, k) => {
    const angle = (2 * Math.PI * k) / vertices
    return [point.lon + dLon * Math.cos(angle), point.lat + dLat * Math.sin(angle)]
  })
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] }
}

/** Point in a polygon or multipolygon, by the even-odd rule: holes are excluded by construction. */
export function containsPoint(geometry: Contour, { lon, lat }: LonLat): boolean {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  let inside = false
  for (const ring of rings) {
    for (let k = 1; k < ring.length; k++) {
      const [x1, y1] = ring[k - 1]
      const [x2, y2] = ring[k]
      if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside
    }
  }
  return inside
}

/** Bounding box of a polygon or multipolygon. */
export function bboxOf(geometry: Contour): BBox {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  const bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [lon, lat] of rings.flat()) {
    bbox[0] = Math.min(bbox[0], lon)
    bbox[1] = Math.min(bbox[1], lat)
    bbox[2] = Math.max(bbox[2], lon)
    bbox[3] = Math.max(bbox[3], lat)
  }
  return bbox
}

/**
 * Centroid (area barycenter) of a polygon or multipolygon.
 * Planar computation in degrees: the error is negligible at parcel scale.
 */
export function centroidOf(geometry: Contour): LonLat {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  // Coordinates relative to the first vertex: in absolute terms, cross products of close
  // values cancel out and lose their precision.
  const [x0, y0] = polygons[0][0][0]
  let area = 0
  let mx = 0
  let my = 0
  for (const rings of polygons) {
    rings.forEach((ring, rank) => {
      let a = 0
      let cx = 0
      let cy = 0
      for (let k = 0; k < ring.length - 1; k++) {
        const x1 = ring[k][0] - x0
        const y1 = ring[k][1] - y0
        const x2 = ring[k + 1][0] - x0
        const y2 = ring[k + 1][1] - y0
        const cross = x1 * y2 - x2 * y1
        a += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
      }
      // The sources do not guarantee the winding order of rings: the outer ring counts
      // positively, holes negatively, whatever their winding.
      const sign = Math.sign(a) * (rank === 0 ? 1 : -1)
      area += sign * a
      mx += sign * cx
      my += sign * cy
    })
  }
  return { lon: x0 + mx / (3 * area), lat: y0 + my / (3 * area) }
}

/** Distance in metres from a point to a polygon: zero when it is inside. */
export function distanceToPolygon(point: LonLat, geometry: Contour): number {
  return containsPoint(geometry, point) ? 0 : distanceToBoundary(point, geometry)
}

/**
 * Distance in metres between two polygons, measured vertex to edge in both directions: zero
 * when one has a vertex inside the other. Two polygons crossing without any vertex of one
 * lying inside the other are rare at parcel scale.
 */
export function distanceBetweenPolygons(a: Contour, b: Contour): number {
  const vertices = (geometry: Contour) =>
    (geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()).flat()
  let distance = Infinity
  for (const [source, target] of [[a, b], [b, a]]) {
    for (const [lon, lat] of vertices(source)) {
      distance = Math.min(distance, distanceToPolygon({ lon, lat }, target))
      if (distance === 0) return 0
    }
  }
  return distance
}
