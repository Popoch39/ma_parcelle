/** Dimensions en pixels. */
export interface Taille {
  width: number
  height: number
}

/** Rectangle en pixels, depuis le coin haut gauche. */
export interface Rectangle extends Taille {
  x: number
  y: number
}

interface VueCourante {
  /** Zoom de la vue à l'écran. */
  zoom: number
  /** Zoom à partir duquel la parcelle sélectionnée est surlignée (tuiles cadastrales). */
  surlignage: number
  /** Centre de l'emprise de la parcelle à l'écran, en pixels. */
  centreParcelle: { x: number; y: number }
  /** Partie de la carte gardée pour l'impression (`cadrageCapture`). */
  cadre: Rectangle
}

/**
 * Vrai si la carte s'imprime telle qu'à l'écran : la parcelle y est surlignée et son centre tombe
 * dans l'image. Sinon, il faut recadrer sur elle.
 */
export function garderVueCourante({ zoom, surlignage, centreParcelle: { x, y }, cadre }: VueCourante): boolean {
  if (zoom < surlignage) return false
  return x >= cadre.x && x <= cadre.x + cadre.width && y >= cadre.y && y <= cadre.y + cadre.height
}

interface ZoomsImpression {
  /** Zoom de la vue à l'écran. */
  courant: number
  /** Zoom le plus fort auquel la parcelle tient entière dans l'image. */
  parcelleEntiere: number
  /** Zoom à partir duquel la parcelle sélectionnée est surlignée (tuiles cadastrales). */
  surlignage: number
}

/**
 * Zoom de la carte imprimée recadrée sur la parcelle : celui de la vue courante, tant que la
 * parcelle y tient entière et y est surlignée. Une parcelle trop grande pour être surlignée est
 * au moins montrée entière.
 */
export function zoomImpression({ courant, parcelleEntiere, surlignage }: ZoomsImpression): number {
  return Math.min(Math.max(courant, surlignage), parcelleEntiere)
}

/**
 * Partie de la carte à garder pour l'impression : le plus grand rectangle au format voulu
 * (largeur / hauteur), centré, en pixels entiers.
 */
export function cadrageCapture(canvas: Taille, format: number): Rectangle {
  const width = Math.round(Math.min(canvas.width, canvas.height * format))
  const height = Math.round(Math.min(canvas.height, canvas.width / format))
  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
  }
}
