import type { Vente } from '@/lib/ventes'
import { useMapStore } from './map-store'
import { useUiStore } from './ui-store'

/**
 * Montre une vente sur la carte, depuis la fiche : calque des ventes affiché, bulle ouverte,
 * point amené hors de la fiche. Action sur deux stores, carte et interface.
 */
export function montrerVente({ id, position }: Vente): void {
  const { setCalqueActif, ouvrirVente, montrerPoint } = useMapStore.getState()
  setCalqueActif('ventes', true)
  ouvrirVente(id)
  // Sur mobile, la fiche en plein écran cache toute la carte.
  const { sheetCran, setSheetCran } = useUiStore.getState()
  if (sheetCran === 'plein-ecran') setSheetCran('mi-ecran')
  montrerPoint(position)
}
