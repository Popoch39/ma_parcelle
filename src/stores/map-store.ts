import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { create } from 'zustand'
import type { Emprise } from '@/lib/geo'

interface MapState {
  /** Instance MapLibre, posée par `MapView` au chargement du style et retirée au démontage. */
  map: MapLibreMap | null
  setMap: (map: MapLibreMap | null) => void
  /** Cadre la carte sur une emprise, en laissant la place au panneau de la fiche. */
  fitEmprise: (emprise: Emprise) => void
}

export const useMapStore = create<MapState>()((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
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
