import { useMapStore } from '@/stores/map-store'
import { EasementLayer } from './layers/EasementLayer'
import { HoveredSaleLayer } from './layers/HoveredSaleLayer'
import { NeighborhoodLayer } from './layers/NeighborhoodLayer'
import { OrthoLayer } from './layers/OrthoLayer'
import { PciLayer } from './layers/PciLayer'
import { SalesLayer } from './layers/SalesLayer'
import { SelectionLayer } from './layers/SelectionLayer'
import { ZonePluLayer } from './layers/ZonePluLayer'
import { ZoningWmsLayer } from './layers/ZoningWmsLayer'
import { SalePopup } from './SalePopup'

/**
 * Layers placed on the map, from bottom to top. One layer = one line; activating an optional
 * overlay means mounting it.
 */
export function MapLayers() {
  const basemap = useMapStore((state) => state.basemap)
  const activeOverlays = useMapStore((state) => state.activeOverlays)
  const sales = activeOverlays.includes('sales')
  return (
    <>
      {basemap === 'ortho' && <OrthoLayer />}
      {activeOverlays.includes('zoning') && <ZoningWmsLayer />}
      <ZonePluLayer />
      <EasementLayer />
      {sales && <NeighborhoodLayer />}
      <PciLayer />
      <SelectionLayer />
      {sales && <SalesLayer />}
      {sales && <HoveredSaleLayer />}
      {sales && <SalePopup />}
    </>
  )
}
