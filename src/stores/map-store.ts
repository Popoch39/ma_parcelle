import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { create } from 'zustand'
import type { Emprise, LonLat } from '@/lib/geo'
import type { Basemap } from '@/map/basemaps'
import { CALQUES, type Calque } from '@/map/calques'

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
  /** Vente (son `id`) survolée ou parcourue au clavier, dans la liste comme sur la carte : les deux la mettent en évidence. */
  venteSurvolee: string | null
  survolerVente: (id: string | null) => void
  /** Vente dont la carte montre le détail dans une bulle. */
  venteOuverte: string | null
  ouvrirVente: (id: string) => void
  /**
   * Ferme la bulle de cette vente, si c'est encore elle qui est ouverte : en passant d'un point
   * à un autre, l'ancienne bulle peut se fermer après l'ouverture de la nouvelle.
   */
  fermerVente: (id: string) => void
  /** Cadre la carte sur une emprise, en laissant la place au panneau de la fiche. */
  fitEmprise: (emprise: Emprise) => void
  /** Amène la carte sur un point, assez près pour y toucher une parcelle. */
  centerOn: (point: LonLat) => void
  /** Amène un point dans la partie de la carte que la fiche ne couvre pas, s'il n'y est pas déjà, sans changer le zoom. */
  montrerPoint: (point: LonLat) => void
}

// Les parcelles PCI s'affichent à partir du zoom 15 ; à 18, on distingue celle devant soi.
const ZOOM_PARCELLE = 18

export const useMapStore = create<MapState>()((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  basemap: 'plan',
  setBasemap: (basemap) => set({ basemap }),
  calquesActifs: CALQUES.flatMap(({ id, actifAuDepart }) => (actifAuDepart ? [id] : [])),
  setCalqueActif: (calque, actif) =>
    set(({ calquesActifs }) => ({
      calquesActifs: [...calquesActifs.filter((id) => id !== calque), ...(actif ? [calque] : [])],
    })),
  servitudeSurvolee: null,
  survolerServitude: (servitudeSurvolee) => set({ servitudeSurvolee }),
  venteSurvolee: null,
  survolerVente: (venteSurvolee) => set({ venteSurvolee }),
  venteOuverte: null,
  ouvrirVente: (venteOuverte) => set({ venteOuverte }),
  fermerVente: (id) => set(({ venteOuverte }) => (venteOuverte === id ? { venteOuverte: null } : {})),
  fitEmprise: (emprise) => get().map?.fitBounds(emprise, { padding: fichePadding(), maxZoom: ZOOM_PARCELLE }),
  centerOn: ({ lon, lat }) => {
    const map = get().map
    map?.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), ZOOM_PARCELLE) })
  },
  montrerPoint: ({ lon, lat }) => {
    const map = get().map
    if (!map) return
    const { top, right, bottom, left } = fichePadding()
    const { x, y } = map.project([lon, lat])
    const { clientWidth, clientHeight } = map.getContainer()
    if (x >= left && x <= clientWidth - right && y >= top && y <= clientHeight - bottom) return
    // Un décalage plutôt qu'un `padding`, que MapLibre garderait pour tous les mouvements suivants.
    map.panTo([lon, lat], { offset: [(left - right) / 2, (top - bottom) / 2] })
  },
}))

// Doit suivre la place prise par PanelShell : 420 px à gauche sur desktop, la moitié basse
// de l'écran sur mobile, sous la barre de recherche (56 px) qui couvre le haut de l'écran.
function fichePadding(): Required<PaddingOptions> {
  const margin = 48
  if (window.matchMedia('(min-width: 768px)').matches) {
    return { top: margin, right: margin, bottom: margin, left: 420 + 12 + margin }
  }
  return { top: 56 + margin, right: margin, bottom: window.innerHeight / 2 + margin, left: margin }
}
