import type { LayerSpecification, SourceSpecification } from 'maplibre-gl'
import { useMapLayer } from '@/map/use-map-layer'

const ORTHO_SOURCE_ID = 'ortho'

const SOURCES: Record<string, SourceSpecification> = {
  [ORTHO_SOURCE_ID]: {
    type: 'raster',
    // The Géoplateforme WMTS only serves JPEG (PNG → 400).
    tiles: [
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    ],
    tileSize: 256,
    // The server answers 404 beyond 19: MapLibre then upscales the zoom 19 tiles.
    maxzoom: 19,
    attribution: '© IGN – Photographies aériennes',
  },
}

const LAYERS: LayerSpecification[] = [{ id: 'ortho', type: 'raster', source: ORTHO_SOURCE_ID }]

/** IGN aerial photo, placed below the overlays when it is the active basemap. */
export function OrthoLayer() {
  useMapLayer({ sources: SOURCES, layers: LAYERS, beneath: true })
  return null
}
