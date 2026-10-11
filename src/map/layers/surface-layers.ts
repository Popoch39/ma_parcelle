import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

interface Surface {
  /** Préfixe des couches : `<id>-aplat` et `<id>-contour`. */
  id: string
  /** Source GeoJSON des surfaces. */
  source: string
  couleur: string
  /** Opacité de l'aplat, assez faible pour laisser lire la parcelle et le fond dessous. */
  opaciteAplat: number
  /** Trait du contour : épaisseur, pointillés… */
  contour: LineLayerSpecification['paint']
}

/** Couches d'une surface mise en évidence sur la carte : un aplat léger et son contour, de même couleur. */
export function aplatEtContour({
  id,
  source,
  couleur,
  opaciteAplat,
  contour,
}: Surface): [FillLayerSpecification, LineLayerSpecification] {
  return [
    {
      id: `${id}-aplat`,
      type: 'fill',
      source,
      paint: { 'fill-color': couleur, 'fill-opacity': opaciteAplat },
    },
    {
      id: `${id}-contour`,
      type: 'line',
      source,
      layout: { 'line-join': 'round' },
      paint: { 'line-color': couleur, ...contour },
    },
  ]
}
