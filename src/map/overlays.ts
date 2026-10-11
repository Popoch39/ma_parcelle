/**
 * Overlays the user can show above the basemap, in the order of the overlay control.
 * One toggleable overlay = one line here, and its component mounted in `MapLayers`.
 */
export const OVERLAYS = [
  { id: 'sales', label: 'Ventes', activeByDefault: true },
  { id: 'zoning', label: 'Zonage d’urbanisme', activeByDefault: false },
] as const

export type Overlay = (typeof OVERLAYS)[number]['id']
