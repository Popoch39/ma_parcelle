import { useMapStore } from '@/stores/map-store'
import { OrthoLayer } from './layers/OrthoLayer'
import { PciLayer } from './layers/PciLayer'
import { SelectionLayer } from './layers/SelectionLayer'
import { ServitudeLayer } from './layers/ServitudeLayer'
import { ZonageWmsLayer } from './layers/ZonageWmsLayer'
import { ZonePluLayer } from './layers/ZonePluLayer'

/**
 * Calques posés sur la carte, du dessous vers le dessus. Un calque = une ligne ; activer un
 * calque optionnel revient à le monter.
 */
export function MapLayers() {
  const basemap = useMapStore((state) => state.basemap)
  const calquesActifs = useMapStore((state) => state.calquesActifs)
  return (
    <>
      {basemap === 'ortho' && <OrthoLayer />}
      {calquesActifs.includes('zonage') && <ZonageWmsLayer />}
      <ZonePluLayer />
      <ServitudeLayer />
      <PciLayer />
      <SelectionLayer />
    </>
  )
}
