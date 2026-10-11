import type { MultiPolygon, Polygon } from 'geojson'

/** Rectangle englobant [ouest, sud, est, nord], en degrés WGS 84 (ordre GeoJSON et MapLibre). */
export type Emprise = [number, number, number, number]

/** Contour d'une surface : parcelle, zone, emprise de servitude… */
export type Contour = Polygon | MultiPolygon

/** Point WGS 84, en degrés. */
export interface LonLat {
  lon: number
  lat: number
}

const METRES_PAR_DEGRE = 111_320

/** Distance en mètres entre deux points. Approximation plane, juste à l'échelle d'un quartier. */
export function distanceBetween(a: LonLat, b: LonLat): number {
  const kx = METRES_PAR_DEGRE * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot((b.lon - a.lon) * kx, (b.lat - a.lat) * METRES_PAR_DEGRE)
}

/**
 * Distance en mètres d'un point au bord le plus proche d'un polygone. Approximation plane,
 * juste à l'échelle d'une rue ou d'un quartier.
 */
export function distanceToBoundary(point: LonLat, geometrie: Contour): number {
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

/** Cercle de `rayon` mètres autour d'un point, approché par un polygone de `sommets` côtés. */
export function circleAround(point: LonLat, rayon: number, sommets = 32): Polygon {
  const dLat = rayon / METRES_PAR_DEGRE
  const dLon = dLat / Math.cos((point.lat * Math.PI) / 180)
  const anneau = Array.from({ length: sommets }, (_, k) => {
    const angle = (2 * Math.PI * k) / sommets
    return [point.lon + dLon * Math.cos(angle), point.lat + dLat * Math.sin(angle)]
  })
  return { type: 'Polygon', coordinates: [[...anneau, anneau[0]]] }
}

/** Point dans un polygone ou un multipolygone, par la règle pair-impair : les trous sont exclus d'office. */
export function containsPoint(geometrie: Contour, { lon, lat }: LonLat): boolean {
  const anneaux = geometrie.type === 'Polygon' ? geometrie.coordinates : geometrie.coordinates.flat()
  let dedans = false
  for (const anneau of anneaux) {
    for (let k = 1; k < anneau.length; k++) {
      const [x1, y1] = anneau[k - 1]
      const [x2, y2] = anneau[k]
      if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) dedans = !dedans
    }
  }
  return dedans
}

/** Rectangle englobant d'un polygone ou d'un multipolygone. */
export function empriseOf(geometrie: Contour): Emprise {
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

/**
 * Centroïde (barycentre des surfaces) d'un polygone ou d'un multipolygone.
 * Calcul plan en degrés : l'erreur est négligeable à l'échelle d'une parcelle.
 */
export function centroideOf(geometrie: Contour): LonLat {
  const polygones = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates
  // Coordonnées relatives au premier sommet : en absolu, les produits croisés de valeurs
  // proches s'annulent et perdent leur précision.
  const [x0, y0] = polygones[0][0][0]
  let aire = 0
  let mx = 0
  let my = 0
  for (const anneaux of polygones) {
    anneaux.forEach((anneau, rang) => {
      let a = 0
      let cx = 0
      let cy = 0
      for (let k = 0; k < anneau.length - 1; k++) {
        const x1 = anneau[k][0] - x0
        const y1 = anneau[k][1] - y0
        const x2 = anneau[k + 1][0] - x0
        const y2 = anneau[k + 1][1] - y0
        const croise = x1 * y2 - x2 * y1
        a += croise
        cx += (x1 + x2) * croise
        cy += (y1 + y2) * croise
      }
      // Le sens de parcours des anneaux n'est pas garanti par les sources : le contour
      // extérieur compte en plus, les trous en moins, quel que soit leur sens.
      const signe = Math.sign(a) * (rang === 0 ? 1 : -1)
      aire += signe * a
      mx += signe * cx
      my += signe * cy
    })
  }
  return { lon: x0 + mx / (3 * aire), lat: y0 + my / (3 * aire) }
}

/** Distance en mètres d'un point à un polygone : nulle quand il est dedans. */
export function distanceToPolygon(point: LonLat, geometrie: Contour): number {
  return containsPoint(geometrie, point) ? 0 : distanceToBoundary(point, geometrie)
}

/**
 * Distance en mètres entre deux polygones, mesurée de sommet à bord dans les deux sens : nulle
 * quand l'un a un sommet dans l'autre. Deux polygones qui se croisent sans qu'aucun sommet de
 * l'un ne soit dans l'autre sont rares à l'échelle d'une parcelle.
 */
export function distanceBetweenPolygons(a: Contour, b: Contour): number {
  const sommets = (geometrie: Contour) =>
    (geometrie.type === 'Polygon' ? geometrie.coordinates : geometrie.coordinates.flat()).flat()
  let distance = Infinity
  for (const [source, cible] of [[a, b], [b, a]]) {
    for (const [lon, lat] of sommets(source)) {
      distance = Math.min(distance, distanceToPolygon({ lon, lat }, cible))
      if (distance === 0) return 0
    }
  }
  return distance
}
