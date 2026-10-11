import type { Sale } from '@/lib/sales'
import { useMapStore } from './map-store'
import { useUiStore } from './ui-store'

/**
 * Shows a sale on the map, from the report: sales overlay shown, popup opened,
 * point brought out from under the report. Action across two stores, map and UI.
 */
export function showSale({ id, position }: Sale): void {
  const { setOverlayActive, openSale, revealPoint } = useMapStore.getState()
  setOverlayActive('sales', true)
  openSale(id)
  // On mobile, the full-screen report hides the whole map.
  const { sheetSnap, setSheetSnap } = useUiStore.getState()
  if (sheetSnap === 'full') setSheetSnap('half')
  revealPoint(position)
}
