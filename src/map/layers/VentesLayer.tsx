import type { FeatureCollection, Point } from 'geojson'
import type { ExpressionSpecification, MapGeoJSONFeature } from 'maplibre-gl'
import { echellePrixM2 } from '@/lib/echelle-prix-m2'
import { OVERLAY_COLORS } from '@/map/basemaps'
import { useLayerClick } from '@/map/use-layer-click'
import { useLayerHover } from '@/map/use-layer-hover'
import { useMapLayer } from '@/map/use-map-layer'
import { useVentes } from '@/queries/ventes'
import { useMapStore } from '@/stores/map-store'
import { useSelectionStore } from '@/stores/selection-store'
import { useColorScheme } from '@/stores/ui-store'
import { ANNEAU, COULEURS_PRIX, RAYON_POINT } from './ventes-style'

const SOURCE_ID = 'ventes'

/** Couche invisible, plus large que les points : un doigt ou un pointeur les attrape sans viser au pixel. */
const VENTES_CLIC_LAYER = 'ventes-clic'

/** Rang d'une vente exclue de la médiane : elle n'a pas de teinte de prix. */
const EXCLUE = -1

/**
 * Ventes du voisinage de la parcelle sélectionnée, en points colorés selon leur prix au m² ;
 * les ventes exclues de la médiane en cercles vides. Survoler un point met sa vente en
 * évidence dans la liste, cliquer dessus en ouvre le détail.
 */
export function VentesLayer() {
  const idu = useSelectionStore((state) => state.idu)
  return idu ? <VentesOverlay idu={idu} /> : null
}

function VentesOverlay({ idu }: { idu: string }) {
  const scheme = useColorScheme()
  const survolerVente = useMapStore((state) => state.survolerVente)
  const ouvrirVente = useMapStore((state) => state.ouvrirVente)
  const ventes = useVentes(idu).data?.ventes ?? []
  const echelle = echellePrixM2(ventes)
  const collection: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: ventes.map(({ id, position, exclusion, prixM2 }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      properties: { id, rang: exclusion === null && prixM2 !== null && echelle ? echelle.rangDe(prixM2) : EXCLUE },
    })),
  }
  const exclue: ExpressionSpecification = ['==', ['get', 'rang'], EXCLUE]
  const couleurs = COULEURS_PRIX[scheme]

  useMapLayer({
    sources: { [SOURCE_ID]: { type: 'geojson', data: collection } },
    layers: [
      {
        id: 'ventes-points',
        type: 'circle',
        source: SOURCE_ID,
        // Les ventes colorées passent au-dessus des cercles vides des ventes exclues.
        layout: { 'circle-sort-key': ['get', 'rang'] },
        paint: {
          'circle-radius': RAYON_POINT,
          'circle-color': ['match', ['get', 'rang'], 0, couleurs[0], 1, couleurs[1], 2, couleurs[2], couleurs[3]],
          'circle-opacity': ['case', exclue, 0, 1],
          'circle-stroke-width': ['case', exclue, 2, 1.5],
          'circle-stroke-color': ['case', exclue, OVERLAY_COLORS[scheme].line, ANNEAU[scheme]],
        },
      },
      {
        id: VENTES_CLIC_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        paint: { 'circle-radius': 12, 'circle-opacity': 0 },
      },
    ],
  })

  useLayerHover(VENTES_CLIC_LAYER, (feature: MapGeoJSONFeature | null) => survolerVente(idDe(feature)))
  useLayerClick(VENTES_CLIC_LAYER, (feature: MapGeoJSONFeature) => {
    const id = idDe(feature)
    if (id) ouvrirVente(id)
  })

  return null
}

function idDe(feature: MapGeoJSONFeature | null): string | null {
  const id: unknown = feature?.properties.id
  return typeof id === 'string' ? id : null
}
