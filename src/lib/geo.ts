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

/**
 * Centroïde (barycentre des surfaces) d'un polygone ou d'un multipolygone, en [lon, lat].
 * Calcul plan en degrés : l'erreur est négligeable à l'échelle d'une parcelle.
 */
export function centroideOf(geometrie: Polygon | MultiPolygon): [number, number] {
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
  return [x0 + mx / (3 * aire), y0 + my / (3 * aire)]
}
