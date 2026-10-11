import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { create } from 'zustand'
import type { Emprise } from '@/lib/geo'
import type { Basemap } from '@/map/basemaps'
import type { Calque } from '@/map/calques'

interface MapState {
  /** Instance MapLibre, posée par `MapView` au chargement du style et retirée au démontage. */
  map: MapLibreMap | null
  setMap: (map: MapLibreMap | null) => void
  /** Fond actif. Le plan suit le thème affiché. */
  basemap: Basemap
  setBasemap: (basemap: Basemap) => void
  /** Calques affichés au-dessus du fond, sans ordre. */
  calquesActifs: Calque[]
  setCalqueActif: (calque: Calque, actif: boolean) => void
  /** Cadre la carte sur une emprise, en laissant la place au panneau de la fiche. */
  fitEmprise: (emprise: Emprise) => void
}

export const useMapStore = create<MapState>()((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  basemap: 'plan',
  setBasemap: (basemap) => set({ basemap }),
  calquesActifs: [],
  setCalqueActif: (calque, actif) =>
    set(({ calquesActifs }) => ({
      calquesActifs: [...calquesActifs.filter((id) => id !== calque), ...(actif ? [calque] : [])],
    })),
  fitEmprise: (emprise) => get().map?.fitBounds(emprise, { padding: fichePadding(), maxZoom: 18 }),
}))

// Doit suivre la place prise par PanelShell : 420 px à gauche sur desktop, la moitié basse
// de l'écran sur mobile.
function fichePadding(): PaddingOptions {
  const margin = 48
  if (window.matchMedia('(min-width: 768px)').matches) {
    return { top: margin, right: margin, bottom: margin, left: 420 + 12 + margin }
  }
  return { top: margin, right: margin, bottom: window.innerHeight / 2 + margin, left: margin }
}
