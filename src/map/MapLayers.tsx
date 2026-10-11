import { PciLayer } from './layers/PciLayer'
import { SelectionLayer } from './layers/SelectionLayer'

/**
 * Calques posés sur la carte, du dessous vers le dessus. Un calque = une ligne ; activer un
 * calque optionnel revient à le monter.
 */
export function MapLayers() {
  return (
    <>
      <PciLayer />
      <SelectionLayer />
    </>
  )
}
