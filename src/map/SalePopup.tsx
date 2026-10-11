import { Popup } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SaleDetails } from '@/components/report/sales/SaleDetails'
import type { LonLat } from '@/lib/geo'
import { useSales } from '@/queries/sales'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'

/** Detail popup of the opened sale, placed on its point. */
export function SalePopup() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.openedSale)
  return idu && id ? <SalePopupOverlay idu={idu} id={id} /> : null
}

function SalePopupOverlay({ idu, id }: { idu: string; id: string }) {
  const sale = useSales(idu).data?.sales.find((candidate) => candidate.id === id)
  // The content is rendered by React into this node, which MapLibre places in the popup.
  const [content] = useState(() => {
    const node = document.createElement('div')
    node.className = 'flex flex-col gap-0.5 text-sm'
    return node
  })
  usePopup(id, sale?.position, content)
  return sale ? createPortal(<SaleDetails sale={sale} />, content) : null
}

function usePopup(id: string, position: LonLat | undefined, content: HTMLElement): void {
  const map = useMapStore((state) => state.map)
  const closeSale = useMapStore((state) => state.closeSale)

  useEffect(() => {
    if (!map || !position) return
    const popup = new Popup({
      offset: 12,
      maxWidth: '300px',
      // Opened from the list, the popup must not take away the keyboard focus from the list.
      focusAfterOpen: false,
    })
      .setLngLat([position.lon, position.lat])
      .setDOMContent(content)
      .addTo(map)
    // Closed by the user (cross, click elsewhere on the map): the sale is no longer open.
    const close = () => closeSale(id)
    popup.on('close', close)
    return () => {
      // Removed by unmounting (overlay hidden, StrictMode double effect): the sale stays
      // open, the popup will come back with the overlay.
      popup.off('close', close)
      popup.remove()
    }
  }, [map, id, position, content, closeSale])
}
