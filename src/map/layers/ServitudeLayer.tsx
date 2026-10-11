import type { FeatureCollection } from 'geojson'
import type { EmpriseServitude } from '@/api/gpu'
import { useMapLayer } from '@/map/use-map-layer'
import { useUrbanisme } from '@/queries/urbanisme'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme, type ColorScheme } from '@/stores/ui-store'
import { PARCELLES_HIT_LAYER } from './pci-source'

const SOURCE_ID = 'servitude'

// Distincte du violet de la zone et du bleu de la sélection, qu'elle recouvre souvent.
const COULEUR_SERVITUDE: Record<ColorScheme, string> = {
  light: '#d97706',
  dark: '#fbbf24',
}

/** Emprise de la servitude survolée dans la fiche de la parcelle sélectionnée. */
export function ServitudeLayer() {
  const idu = useSelectionStore((state) => state.idu)
  const id = useMapStore((state) => state.servitudeSurvolee)
  return idu && id ? <ServitudeOverlay idu={idu} id={id} /> : null
}

function ServitudeOverlay({ idu, id }: { idu: string; id: string }) {
  const couleur = COULEUR_SERVITUDE[useColorScheme()]
  const { data } = useUrbanisme(idu)
  const servitude = data?.servitudes.find((candidate) => candidate.id === id)
  const collection: FeatureCollection<EmpriseServitude> = {
    type: 'FeatureCollection',
    features: servitude ? [{ type: 'Feature', geometry: servitude.geometrie, properties: {} }] : [],
  }

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    below: PARCELLES_HIT_LAYER,
    layers: [
      {
        id: 'servitude-aplat',
        type: 'fill',
        source: SOURCE_ID,
        paint: { 'fill-color': couleur, 'fill-opacity': 0.12 },
      },
      {
        id: 'servitude-contour',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round' },
        paint: { 'line-color': couleur, 'line-width': 2 },
      },
      {
        id: 'servitude-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
        paint: { 'circle-color': couleur, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
      },
    ],
  })

  return null
}
