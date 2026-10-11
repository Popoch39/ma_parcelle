import { PciLayer } from './layers/PciLayer'
import { SelectionLayer } from './layers/SelectionLayer'
import { ZonePluLayer } from './layers/ZonePluLayer'

/**
 * Calques posés sur la carte, du dessous vers le dessus. Un calque = une ligne ; activer un
 * calque optionnel revient à le monter.
 */
export function MapLayers() {
  return (
    <>
      <PciLayer />
      <SelectionLayer />
      {/* Reposé à chaque nouvelle sélection, il passe de toute façon au-dessus : aplat et
          contour restent assez légers pour laisser voir la parcelle. */}
      <ZonePluLayer />
    </>
  )
}
