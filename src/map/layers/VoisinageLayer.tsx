import type { Feature, Polygon } from 'geojson'
import { circleAround } from '@/lib/geo'
import { useMapLayer } from '@/map/use-map-layer'
import { useVentes } from '@/queries/ventes'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { PARCELLES_HIT_LAYER } from './pci-source'
import { COULEURS_PRIX } from './ventes-style'

const SOURCE_ID = 'voisinage'

/** Cercle du voisinage des ventes autour de la parcelle sélectionnée, dans la teinte de leurs points. */
export function VoisinageLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <VoisinageOverlay idu={idu} /> : null
}

function VoisinageOverlay({ idu }: { idu: string }) {
  const couleur = COULEURS_PRIX[useColorScheme()][2]
  const { data } = useVentes(idu)
  const cercle: Feature<Polygon> | null = data
    ? { type: 'Feature', geometry: circleAround(data.centre, data.rayon, 96), properties: {} }
    : null

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: { type: 'FeatureCollection', features: cercle ? [cercle] : [] } } },
    below: PARCELLES_HIT_LAYER,
    layers: [
      {
        id: 'voisinage-contour',
        type: 'line',
        source: SOURCE_ID,
        paint: { 'line-color': couleur, 'line-width': 1.5, 'line-dasharray': [4, 3] },
      },
    ],
  })

  return null
}
