import { useMapStore } from '@/stores/map-store'
import { OrthoLayer } from './layers/OrthoLayer'
import { PciLayer } from './layers/PciLayer'
import { SelectionLayer } from './layers/SelectionLayer'
import { ServitudeLayer } from './layers/ServitudeLayer'
import { VentesLayer } from './layers/VentesLayer'
import { VenteSurvoleeLayer } from './layers/VenteSurvoleeLayer'
import { VoisinageLayer } from './layers/VoisinageLayer'
import { ZonageWmsLayer } from './layers/ZonageWmsLayer'
import { ZonePluLayer } from './layers/ZonePluLayer'
import { VentePopup } from './VentePopup'

/**
 * Calques posés sur la carte, du dessous vers le dessus. Un calque = une ligne ; activer un
 * calque optionnel revient à le monter.
 */
export function MapLayers() {
  const basemap = useMapStore((state) => state.basemap)
  const calquesActifs = useMapStore((state) => state.calquesActifs)
  const ventes = calquesActifs.includes('ventes')
  return (
    <>
      {basemap === 'ortho' && <OrthoLayer />}
      {calquesActifs.includes('zonage') && <ZonageWmsLayer />}
      <ZonePluLayer />
      <ServitudeLayer />
      {ventes && <VoisinageLayer />}
      <PciLayer />
      <SelectionLayer />
      {ventes && <VentesLayer />}
      {ventes && <VenteSurvoleeLayer />}
      {ventes && <VentePopup />}
    </>
  )
}
