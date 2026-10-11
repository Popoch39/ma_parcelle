import type { SourceSpecification } from 'maplibre-gl'

/** Zones of the planning documents, drawn by the Géoportail de l'Urbanisme WMS. */
export const ZONING_SOURCE_ID = 'zoning'

// 512 px images divide requests by four (the WMS caps at 50 per second) and cut the
// zone labels less often, which the server draws in each image.
const TILE_SIZE = 512

export const ZONING_SOURCES: Record<string, SourceSpecification> = {
  [ZONING_SOURCE_ID]: {
    type: 'raster',
    tiles: [
      `https://data.geopf.fr/wms-v/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=zone_secteur&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=${TILE_SIZE}&HEIGHT=${TILE_SIZE}&FORMAT=image/png&TRANSPARENT=true`,
    ],
    tileSize: TILE_SIZE,
    attribution: '© Géoportail de l’Urbanisme',
  },
}
