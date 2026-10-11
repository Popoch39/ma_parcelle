import type { MultiPolygon, Polygon } from 'geojson'
import { empriseOf, type Emprise } from './geo'

// Points par côté de la grille posée sur l'emprise de la surface mesurée : au-delà, la mesure
// ne gagne plus rien d'utile pour distinguer un liseré d'une vraie part de parcelle.
const PAS_DE_GRILLE = 50

/** Segment [x1, y1, x2, y2] du bord d'un polygone. */
type Arete = [number, number, number, number]

/**
 * Prépare la mesure de la part d'une surface (une parcelle) couverte par d'autres (des zones),
 * de 0 à 1. La mesure est estimée sur une grille de points de la surface : assez précise pour
 * écarter les recouvrements de bord dus aux décalages de numérisation entre cadastre et zonage.
 */
export function mesureCouverture(surface: MultiPolygon): (couvrante: Polygon | MultiPolygon) => number {
  const emprise = empriseOf(surface)
  const [ouest, sud, est, nord] = emprise
  const bordsSurface = aretesUtiles(surface, emprise)
  const points: Array<[number, number]> = []
  for (let i = 0; i < PAS_DE_GRILLE; i++) {
    for (let j = 0; j < PAS_DE_GRILLE; j++) {
      const point: [number, number] = [
        ouest + ((i + 0.5) / PAS_DE_GRILLE) * (est - ouest),
        sud + ((j + 0.5) / PAS_DE_GRILLE) * (nord - sud),
      ]
      if (contient(bordsSurface, point)) points.push(point)
    }
  }
  return (couvrante) => {
    // Surface trop fine pour la grille : faute de mesure, on ne l'écarte pas.
    if (points.length === 0) return 1
    const bords = aretesUtiles(couvrante, emprise)
    return points.filter((point) => contient(bords, point)).length / points.length
  }
}

/**
 * Arêtes qui peuvent croiser une demi-droite horizontale partant vers l'est d'un point de
 * l'emprise. Une zone peut compter des dizaines de milliers de sommets : ne garder que
 * celles-ci rend la mesure quasi instantanée.
 */
function aretesUtiles(geometrie: Polygon | MultiPolygon, [ouest, sud, , nord]: Emprise): Arete[] {
  const anneaux = geometrie.type === 'Polygon' ? geometrie.coordinates : geometrie.coordinates.flat()
  const aretes: Arete[] = []
  for (const anneau of anneaux) {
    for (let k = 1; k < anneau.length; k++) {
      const [x1, y1] = anneau[k - 1]
      const [x2, y2] = anneau[k]
      if (Math.max(y1, y2) < sud || Math.min(y1, y2) > nord || Math.max(x1, x2) < ouest) continue
      aretes.push([x1, y1, x2, y2])
    }
  }
  return aretes
}

/** Point dans le polygone, par la règle pair-impair : les trous sont exclus d'office. */
function contient(aretes: Arete[], [x, y]: [number, number]): boolean {
  let dedans = false
  for (const [x1, y1, x2, y2] of aretes) {
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) dedans = !dedans
  }
  return dedans
}
