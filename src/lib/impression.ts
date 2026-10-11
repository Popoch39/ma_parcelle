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

interface ZoomsImpression {
  /** Zoom de la vue à l'écran. */
  courant: number
  /** Zoom le plus fort auquel la parcelle tient entière dans l'image. */
  parcelleEntiere: number
  /** Zoom à partir duquel la parcelle sélectionnée est surlignée (tuiles cadastrales). */
  surlignage: number
}

/**
 * Zoom de la carte imprimée : celui de la vue courante, tant que la parcelle y tient entière et
 * y est surlignée. Une parcelle trop grande pour être surlignée est au moins montrée entière.
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
