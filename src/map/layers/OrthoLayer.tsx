import type { LayerSpecification, SourceSpecification } from 'maplibre-gl'
import { useMapLayer } from '@/map/use-map-layer'

const ORTHO_SOURCE_ID = 'ortho'

const SOURCES: Record<string, SourceSpecification> = {
  [ORTHO_SOURCE_ID]: {
    type: 'raster',
    // Le WMTS de la Géoplateforme ne sert que du JPEG (PNG → 400).
    tiles: [
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    ],
    tileSize: 256,
    // Le serveur répond 404 au-delà de 19 : MapLibre agrandit alors les tuiles du zoom 19.
    maxzoom: 19,
    attribution: '© IGN – Photographies aériennes',
  },
}

const LAYERS: LayerSpecification[] = [{ id: 'ortho', type: 'raster', source: ORTHO_SOURCE_ID }]

/** Photo aérienne de l'IGN, posée sous les surcouches quand c'est le fond actif. */
export function OrthoLayer() {
  useMapLayer({ sources: SOURCES, layers: LAYERS, beneath: true })
  return null
}
