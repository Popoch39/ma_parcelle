import type { ExpressionSpecification } from 'maplibre-gl'
import type { ColorScheme } from '@/stores/ui-store'

/**
 * Dégradé des prix au m², une teinte par classe de `echellePrixM2`, du moins cher au plus cher.
 * Une seule teinte, le sarcelle, libre sur la carte (bleu = sélection, violet = zone, ambre =
 * servitude). En clair le prix monte vers le foncé, en sombre vers le clair : la teinte la plus
 * proche du fond garde plus de 2:1 de contraste sur lui (positron rgb(242,243,240), dark
 * rgb(12,12,12)).
 */
export const COULEURS_PRIX: Record<ColorScheme, readonly [string, string, string, string]> = {
  light: ['#14b8a6', '#0d9488', '#0f766e', '#134e4a'],
  dark: ['#115e59', '#0d9488', '#2dd4bf', '#99f6e4'],
}

/** Anneau couleur du fond autour de chaque point : des points qui se chevauchent restent distincts. */
export const ANNEAU: Record<ColorScheme, string> = {
  light: '#ffffff',
  dark: '#0c0c0c',
}

/** Rayon des points selon le zoom : vers 14, tout le cercle de 500 m tient à l'écran et les points se serrent. */
export const RAYON_POINT: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 3.5, 18, 7]

/** Rayon de l'anneau qui entoure la vente survolée. */
export const RAYON_SURVOL: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 7.5, 18, 11]
