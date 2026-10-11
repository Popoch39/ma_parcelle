import { useMapStore } from '@/stores/map-store'
import { OrthoLayer } from './layers/OrthoLayer'
import { PciLayer } from './layers/PciLayer'
import { SelectionLayer } from './layers/SelectionLayer'

/**
 * Calques posés sur la carte, du dessous vers le dessus. Un calque = une ligne ; activer un
 * calque optionnel revient à le monter.
 */
export function MapLayers() {
  const basemap = useMapStore((state) => state.basemap)
  return (
    <>
      {basemap === 'ortho' && <OrthoLayer />}
      <PciLayer />
      <SelectionLayer />
    </>
  )
}
