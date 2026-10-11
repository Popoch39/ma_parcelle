import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { create } from 'zustand'
import type { Emprise, LonLat } from '@/lib/geo'
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
  /** Servitude survolée dans la fiche (son `id`), dont la carte montre l'emprise. */
  servitudeSurvolee: string | null
  survolerServitude: (id: string | null) => void
  /** Cadre la carte sur une emprise, en laissant la place au panneau de la fiche. */
  fitEmprise: (emprise: Emprise) => void
  /** Amène la carte sur un point, assez près pour y toucher une parcelle. */
  centerOn: (point: LonLat) => void
}

// Les parcelles PCI s'affichent à partir du zoom 15 ; à 18, on distingue celle devant soi.
const ZOOM_PARCELLE = 18

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
  servitudeSurvolee: null,
  survolerServitude: (servitudeSurvolee) => set({ servitudeSurvolee }),
  fitEmprise: (emprise) => get().map?.fitBounds(emprise, { padding: fichePadding(), maxZoom: ZOOM_PARCELLE }),
  centerOn: ({ lon, lat }) => {
    const map = get().map
    map?.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), ZOOM_PARCELLE) })
  },
}))

// Doit suivre la place prise par PanelShell : 420 px à gauche sur desktop, la moitié basse
// de l'écran sur mobile, sous la barre de recherche (56 px) qui couvre le haut de l'écran.
function fichePadding(): PaddingOptions {
  const margin = 48
  if (window.matchMedia('(min-width: 768px)').matches) {
    return { top: margin, right: margin, bottom: margin, left: 420 + 12 + margin }
  }
  return { top: 56 + margin, right: margin, bottom: window.innerHeight / 2 + margin, left: margin }
}
