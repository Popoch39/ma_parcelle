import type { StyleSpecification } from 'maplibre-gl'
import type { ColorScheme } from '@/stores/ui-store'

/** Fond choisi par l'utilisateur : le plan (selon le thème) ou la photo aérienne de l'IGN. */
export type Basemap = 'plan' | 'ortho'

/** Fond de plan OpenFreeMap selon le thème affiché. */
const PLAN_STYLES: Record<ColorScheme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

/**
 * Sous la photo aérienne, un style vide : la photo est posée par `OrthoLayer`, sous les
 * surcouches. Les polices du plan restent déclarées pour les étiquettes des surcouches.
 */
const ORTHO_BASE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [],
}

/** Style MapLibre à appliquer à la carte pour un fond et un thème affiché. */
export function basemapStyle(basemap: Basemap, scheme: ColorScheme): string | StyleSpecification {
  return basemap === 'ortho' ? ORTHO_BASE_STYLE : PLAN_STYLES[scheme]
}

/** Couleurs des surcouches. MapLibre ne lit pas les variables CSS : `primary` est recopiée ici. */
export const OVERLAY_COLORS: Record<ColorScheme, { primary: string; line: string }> = {
  light: { primary: '#155dfc', line: '#737373' },
  dark: { primary: '#2b7fff', line: '#a3a3a3' },
}
