import type { ExpressionSpecification } from 'maplibre-gl'
import type { ColorScheme } from '@/stores/ui-store'

/**
 * Price per sqm gradient, one hue per class of `pricePerSqmScale`, from cheapest to most expensive.
 * A single hue, teal, free on the map (blue = selection, purple = zone, amber =
 * easement). In light mode the price goes toward dark, in dark mode toward light: the hue closest
 * to the background keeps more than 2:1 contrast against it (positron rgb(242,243,240), dark
 * rgb(12,12,12)).
 */
export const PRICE_COLORS: Record<ColorScheme, readonly [string, string, string, string]> = {
  light: ['#14b8a6', '#0d9488', '#0f766e', '#134e4a'],
  dark: ['#115e59', '#0d9488', '#2dd4bf', '#99f6e4'],
}

/** Background-colored ring around each point: overlapping points stay distinct. */
export const RING_COLOR: Record<ColorScheme, string> = {
  light: '#ffffff',
  dark: '#0c0c0c',
}

/** Point radius by zoom: around 14, the whole 500 m circle fits on screen and points crowd together. */
export const POINT_RADIUS: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 3.5, 18, 7]

/** Radius of the ring around the hovered sale. */
export const HOVER_RADIUS: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 7.5, 18, 11]
