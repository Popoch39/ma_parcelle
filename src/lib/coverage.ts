import type { MultiPolygon } from 'geojson'
import { bboxOf, type Contour, type BBox } from './geo'

// Points per side of the grid laid over the bbox of the measured surface: beyond this, the
// measure gains nothing useful for telling a sliver apart from a real share of the parcel.
const GRID_STEPS = 50

/** Segment [x1, y1, x2, y2] of a polygon's boundary. */
type Edge = [number, number, number, number]

/**
 * Prepares the measure of the share of a surface (a parcel) covered by others (zones),
 * from 0 to 1. The measure is estimated on a grid of points of the surface: precise enough to
 * discard edge overlaps due to digitization offsets between cadastre and zoning.
 */
export function measureCoverage(surface: MultiPolygon): (covering: Contour) => number {
  const bbox = bboxOf(surface)
  const [west, south, east, north] = bbox
  const surfaceEdges = relevantEdges(surface, bbox)
  const points: Array<[number, number]> = []
  for (let i = 0; i < GRID_STEPS; i++) {
    for (let j = 0; j < GRID_STEPS; j++) {
      const point: [number, number] = [
        west + ((i + 0.5) / GRID_STEPS) * (east - west),
        south + ((j + 0.5) / GRID_STEPS) * (north - south),
      ]
      if (contains(surfaceEdges, point)) points.push(point)
    }
  }
  return (covering) => {
    // Surface too thin for the grid: lacking a measure, we do not discard it.
    if (points.length === 0) return 1
    const edges = relevantEdges(covering, bbox)
    return points.filter((point) => contains(edges, point)).length / points.length
  }
}

/**
 * Edges that may cross a horizontal ray heading east from a point of the bbox. A zone can
 * have tens of thousands of vertices: keeping only these makes the measure almost instant.
 */
function relevantEdges(geometry: Contour,[west, south, , north]: BBox): Edge[] {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  const edges: Edge[] = []
  for (const ring of rings) {
    for (let k = 1; k < ring.length; k++) {
      const [x1, y1] = ring[k - 1]
      const [x2, y2] = ring[k]
      if (Math.max(y1, y2) < south || Math.min(y1, y2) > north || Math.max(x1, x2) < west) continue
      edges.push([x1, y1, x2, y2])
    }
  }
  return edges
}

/** Point in polygon, by the even-odd rule: holes are excluded by construction. */
function contains(edges: Edge[], [x, y]: [number, number]): boolean {
  let inside = false
  for (const [x1, y1, x2, y2] of edges) {
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside
  }
  return inside
}
