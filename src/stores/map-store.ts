import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { create } from 'zustand'
import { HALF_SCREEN_RATIO } from '@/lib/bottom-sheet'
import type { BBox, LonLat } from '@/lib/geo'
import { DESKTOP, panelWidth } from '@/lib/layout'
import type { Basemap } from '@/map/basemaps'
import { OVERLAYS, type Overlay } from '@/map/overlays'

interface MapState {
  /** MapLibre instance, set by `MapView` when the style loads and removed on unmount. */
  map: MapLibreMap | null
  setMap: (map: MapLibreMap | null) => void
  /** Active basemap. The plan follows the displayed theme. */
  basemap: Basemap
  setBasemap: (basemap: Basemap) => void
  /** Overlays shown above the basemap, unordered. */
  activeOverlays: Overlay[]
  setOverlayActive: (overlay: Overlay, active: boolean) => void
  /** Easement hovered in the report (its `id`), whose geometry the map shows. */
  hoveredEasement: string | null
  hoverEasement: (id: string | null) => void
  /** Sale (its `id`) hovered or browsed with the keyboard, in the list as on the map: both highlight it. */
  hoveredSale: string | null
  hoverSale: (id: string | null) => void
  /** Sale whose details the map shows in a popup. */
  openedSale: string | null
  openSale: (id: string) => void
  /**
   * Closes this sale's popup, if it is still the open one: when moving from one point to
   * another, the old popup may close after the new one opens.
   */
  closeSale: (id: string) => void
  /** Frames the map on a bbox, leaving room for the report panel. */
  fitBBox: (bbox: BBox) => void
  /** Brings the map to a point, close enough to tap a parcel there. */
  centerOn: (point: LonLat) => void
  /** Brings a point into the part of the map the report does not cover, if it is not already there, without changing the zoom. */
  revealPoint: (point: LonLat) => void
}

// PCI parcels show from zoom 15; at 18, the one in front of you stands out.
const PARCEL_ZOOM = 18

export const useMapStore = create<MapState>()((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  basemap: 'plan',
  setBasemap: (basemap) => set({ basemap }),
  activeOverlays: OVERLAYS.flatMap(({ id, activeByDefault }) => (activeByDefault ? [id] : [])),
  setOverlayActive: (overlay, active) =>
    set(({ activeOverlays }) => ({
      activeOverlays: [...activeOverlays.filter((id) => id !== overlay), ...(active ? [overlay] : [])],
    })),
  hoveredEasement: null,
  hoverEasement: (hoveredEasement) => set({ hoveredEasement }),
  hoveredSale: null,
  hoverSale: (hoveredSale) => set({ hoveredSale }),
  openedSale: null,
  openSale: (openedSale) => set({ openedSale }),
  closeSale: (id) => set(({ openedSale }) => (openedSale === id ? { openedSale: null } : {})),
  fitBBox: (bbox) => get().map?.fitBounds(bbox, { padding: reportPadding(), maxZoom: PARCEL_ZOOM }),
  centerOn: ({ lon, lat }) => {
    const map = get().map
    map?.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), PARCEL_ZOOM) })
  },
  revealPoint: ({ lon, lat }) => {
    const map = get().map
    if (!map) return
    const { top, right, bottom, left } = reportPadding()
    const { x, y } = map.project([lon, lat])
    const { clientWidth, clientHeight } = map.getContainer()
    if (x >= left && x <= clientWidth - right && y >= top && y <= clientHeight - bottom) return
    // An offset rather than a `padding`, which MapLibre would keep for every following move.
    map.panTo([lon, lat], { offset: [(left - right) / 2, (top - bottom) / 2] })
  },
}))

// The room taken by the report: the panel on the left on desktop (12 px from the edge), the bottom
// sheet at half screen on mobile, below the search bar (56 px) that covers the top of the screen.
function reportPadding(): Required<PaddingOptions> {
  const margin = 48
  if (window.matchMedia(DESKTOP).matches) {
    return { top: margin, right: margin, bottom: margin, left: panelWidth() + 12 + margin }
  }
  return { top: 56 + margin, right: margin, bottom: window.innerHeight * HALF_SCREEN_RATIO + margin, left: margin }
}
