import type { StyleSpecification } from 'maplibre-gl'
import type { ColorScheme } from '@/stores/ui-store'

/** Basemap chosen by the user: the plan (depending on the theme) or the IGN aerial photo. */
export type Basemap = 'plan' | 'ortho'

/** OpenFreeMap plan basemap depending on the displayed theme. */
const PLAN_STYLES: Record<ColorScheme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

/**
 * Under the aerial photo, an empty style: the photo is added by `OrthoLayer`, below the
 * overlays. The plan fonts stay declared for the overlay labels.
 */
const ORTHO_BASE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [],
}

/** MapLibre style to apply to the map for a basemap and a displayed theme. */
export function basemapStyle(basemap: Basemap, scheme: ColorScheme): string | StyleSpecification {
  return basemap === 'ortho' ? ORTHO_BASE_STYLE : PLAN_STYLES[scheme]
}

/** Overlay colors. MapLibre does not read CSS variables: `primary` is copied here. */
export const OVERLAY_COLORS: Record<ColorScheme, { primary: string; line: string }> = {
  light: { primary: '#155dfc', line: '#737373' },
  dark: { primary: '#2b7fff', line: '#a3a3a3' },
}
