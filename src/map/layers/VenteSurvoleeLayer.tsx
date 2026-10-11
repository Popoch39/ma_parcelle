import type { FeatureCollection, Point } from 'geojson'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useMapLayer } from '@/map/use-map-layer'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { RAYON_SURVOL } from './ventes-style'

// Sa propre source : partager celle des points la garderait sur la carte avec les ventes de
// la parcelle précédente, `useMapLayer` ne reposant une source que si elle a disparu.
const SOURCE_ID = 'vente-survolee'

/** Anneau autour de la vente survolée ou parcourue au clavier, dans la liste comme sur la carte. */
export function VenteSurvoleeLayer() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.venteSurvolee)
  return idu && id ? <VenteSurvoleeOverlay idu={idu} id={id} /> : null
}

function VenteSurvoleeOverlay({ idu, id }: { idu: string; id: string }) {
  const { primary } = OVERLAY_COLORS[useColorScheme()]
  const vente = useVentes(idu).data?.ventes.find((candidate) => candidate.id === id)
  const collection: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: vente
      ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: [vente.position.lon, vente.position.lat] }, properties: {} }]
      : [],
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    layers: [
      {
        id: 'vente-survolee',
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': RAYON_SURVOL,
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': primary,
        },
      },
    ],
  })

  return null
}
