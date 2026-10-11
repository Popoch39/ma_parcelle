import { Popup } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { VenteDetails } from '@/components/fiche/ventes/VenteDetails'
import type { LonLat } from '@/lib/geo'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'

/** Bulle de détail de la vente ouverte, posée sur son point. */
export function VentePopup() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.venteOuverte)
  return idu && id ? <VentePopupOverlay idu={idu} id={id} /> : null
}

function VentePopupOverlay({ idu, id }: { idu: string; id: string }) {
  const vente = useVentes(idu).data?.ventes.find((candidate) => candidate.id === id)
  // Le contenu est rendu par React dans ce nœud, que MapLibre place dans la bulle.
  const [contenu] = useState(() => {
    const noeud = document.createElement('div')
    noeud.className = 'flex flex-col gap-0.5 text-sm'
    return noeud
  })
  usePopup(id, vente?.position, contenu)
  return vente ? createPortal(<VenteDetails vente={vente} />, contenu) : null
}

function usePopup(id: string, position: LonLat | undefined, contenu: HTMLElement): void {
  const map = useMapStore((state) => state.map)
  const fermerVente = useMapStore((state) => state.fermerVente)

  useEffect(() => {
    if (!map || !position) return
    const popup = new Popup({
      offset: 12,
      maxWidth: '300px',
      // Ouverte depuis la liste, la bulle ne doit pas retirer au clavier sa place dans la liste.
      focusAfterOpen: false,
    })
      .setLngLat([position.lon, position.lat])
      .setDOMContent(contenu)
      .addTo(map)
    // Fermée par l'utilisateur (croix, clic ailleurs sur la carte) : la vente n'est plus ouverte.
    const fermer = () => fermerVente(id)
    popup.on('close', fermer)
    return () => {
      // Retirée par le démontage (calque masqué, double effet du StrictMode) : la vente reste
      // ouverte, la bulle reviendra avec le calque.
      popup.off('close', fermer)
      popup.remove()
    }
  }, [map, id, position, contenu, fermerVente])
}
