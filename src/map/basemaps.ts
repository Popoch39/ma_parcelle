import type { ColorScheme } from '@/stores/ui-store'

/** Fond de plan OpenFreeMap selon le thème affiché. */
export const BASEMAP_STYLES: Record<ColorScheme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

/** Couleurs des surcouches. MapLibre ne lit pas les variables CSS : `primary` est recopiée ici. */
export const OVERLAY_COLORS: Record<ColorScheme, { primary: string; line: string }> = {
  light: { primary: '#155dfc', line: '#737373' },
  dark: { primary: '#2b7fff', line: '#a3a3a3' },
}
